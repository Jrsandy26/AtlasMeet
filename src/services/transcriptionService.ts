export interface TranscriptUpdate {
  text: string;
  timestamp: string;
  confidence: number;
  sequenceId: number;
  audioStartTime: number;
  audioEndTime: number;
  duration: number;
}

class TranscriptionService {
  private recognition: any = null;
  private isListening: boolean = false;
  private sequenceCounter: number = 0;
  private meetingStartTime: number = 0;
  private onTranscriptCallback: ((update: TranscriptUpdate) => void) | null = null;

  startRealtime(
    onTranscript: (update: TranscriptUpdate) => void,
    language: string = 'en-US',
    onError?: (error: string) => void
  ): void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Web Speech API is not supported in this browser.');
      return;
    }

    this.onTranscriptCallback = onTranscript;
    this.sequenceCounter = 0;
    this.meetingStartTime = Date.now();

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = false;
    this.recognition.lang = language;

    this.recognition.onresult = (event: any) => {
      const resultIndex = event.resultIndex;
      const result = event.results[resultIndex];
      
      if (result.isFinal) {
        const text = result[0].transcript.trim();
        const confidence = result[0].confidence;
        
        if (text) {
          const timestamp = new Date().toLocaleTimeString();
          const elapsedMs = Date.now() - this.meetingStartTime;
          const elapsedSec = elapsedMs / 1000;
          
          const update: TranscriptUpdate = {
            text,
            timestamp,
            confidence: Math.round(confidence * 100) / 100,
            sequenceId: this.sequenceCounter++,
            audioStartTime: Math.max(0, elapsedSec - 5), // rough estimation of segment start
            audioEndTime: elapsedSec,
            duration: 5, // rough estimation
          };

          if (this.onTranscriptCallback) {
            this.onTranscriptCallback(update);
          }
        }
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (onError) {
        onError(event.error);
      }
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        // Auto-restart to make it continuous (Web Speech API can sometimes time out)
        try {
          this.recognition.start();
        } catch (e) {
          console.warn('Failed to restart recognition:', e);
        }
      }
    };

    this.isListening = true;
    try {
      this.recognition.start();
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
    }
  }

  stopRealtime(): void {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (error) {
        console.warn('Failed to stop recognition:', error);
      }
      this.recognition = null;
    }
  }

  /**
   * Transcribe the complete audio Blob using Groq Whisper API
   */
  async transcribeWithGroq(audioBlob: Blob, apiKey: string, model: string = 'whisper-large-v3-turbo'): Promise<string> {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', model);
    formData.append('response_format', 'json');

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Groq Whisper failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.text;
  }

  /**
   * Transcribe the complete audio Blob using OpenAI Whisper API
   */
  async transcribeWithOpenAI(audioBlob: Blob, apiKey: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'json');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `OpenAI Whisper failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.text;
  }

  async transcribeWithNvidia(audioBlob: Blob, apiKey: string, model: string = 'nvidia/parakeet-tdt-0.6b-v3'): Promise<string> {
    const reader = new FileReader();
    const readPromise = new Promise<string>((resolve) => {
      reader.onloadend = () => {
        const resultStr = reader.result as string;
        const base64Content = resultStr.split(',')[1] || '';
        resolve(base64Content);
      };
      reader.readAsDataURL(audioBlob);
    });
    const audioBase64 = await readPromise;

    const response = await fetch('/api/nvidia/transcribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        audioBase64,
        model
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.detail || `NVIDIA NIM transcription failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.text;
  }

  /**
   * Transcribe the complete audio Blob using a local custom transcription server (e.g. Parakeet/NeMo)
   */
  async transcribeWithCustomLocal(audioBlob: Blob, endpoint: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'parakeet-tdt-0.6b-v3');
    formData.append('response_format', 'json');

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Local transcription server failed (${response.status}): ${errText || response.statusText}`);
    }

    const result = await response.json();
    return result.text || '';
  }
}

export const transcriptionService = new TranscriptionService();

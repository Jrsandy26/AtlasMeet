export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number; // in seconds
}

class RecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private stream: MediaStream | null = null;
  private elapsedSeconds: number = 0;
  private timerInterval: any = null;
  private onStateChangeCallback: ((state: RecordingState) => void) | null = null;
  private onDurationChangeCallback: ((duration: number) => void) | null = null;

  async start(
    onStateChange: (state: RecordingState) => void,
    onDurationChange: (duration: number) => void
  ): Promise<void> {
    this.onStateChangeCallback = onStateChange;
    this.onDurationChangeCallback = onDurationChange;
    this.audioChunks = [];
    this.elapsedSeconds = 0;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup audio analyzer for levels
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = this.audioContext.createMediaStreamSource(this.stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      // Setup recorder
      this.mediaRecorder = new MediaRecorder(this.stream);
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(250); // Capture data every 250ms
      
      this.timerInterval = setInterval(() => {
        this.elapsedSeconds++;
        if (this.onDurationChangeCallback) {
          this.onDurationChangeCallback(this.elapsedSeconds);
        }
      }, 1000);

      this.notifyStateChange(true, false);
    } catch (error) {
      console.error('Error starting browser recording:', error);
      this.cleanup();
      throw error;
    }
  }

  pause(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
      this.notifyStateChange(true, true);
    }
  }

  resume(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
      this.timerInterval = setInterval(() => {
        this.elapsedSeconds++;
        if (this.onDurationChangeCallback) {
          this.onDurationChangeCallback(this.elapsedSeconds);
        }
      }, 1000);
      this.notifyStateChange(true, false);
    }
  }

  async stop(): Promise<{ blob: Blob; duration: number }> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve({ blob: new Blob(), duration: 0 });
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const finalDuration = this.elapsedSeconds;
        this.cleanup();
        resolve({ blob: audioBlob, duration: finalDuration });
      };

      this.mediaRecorder.stop();
    });
  }

  getAudioLevel(): number {
    if (!this.analyser) return 0;
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    const average = sum / bufferLength;
    // Map normal talking level (around 0-128) to 0-100 percentage
    return Math.min(100, Math.round((average / 128) * 100));
  }

  private notifyStateChange(isRecording: boolean, isPaused: boolean): void {
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback({
        isRecording,
        isPaused,
        duration: this.elapsedSeconds,
      });
    }
  }

  private cleanup(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.analyser = null;
    }
    this.mediaRecorder = null;
    this.notifyStateChange(false, false);
  }
}

export const recordingService = new RecordingService();

import { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type TranscriptSegment, switchUserDatabase } from './db';
import { recordingService, type RecordingState } from './services/recordingService';
import { transcriptionService, type TranscriptUpdate } from './services/transcriptionService';
import { summaryService, type SummaryTemplate, type LLMConfig } from './services/summaryService';
import { 
  Mic, 
  Pause, 
  Play, 
  Square, 
  Settings as SettingsIcon, 
  Trash2, 
  Copy, 
  Check, 
  Download, 
  FileText,
  Calendar, 
  Clock, 
  Plus, 
  Sparkles, 
  Key, 
  Database, 
  BookOpen, 
  Upload, 
  AlertCircle,
  LogOut,
  Layout,
  ArrowLeft,
  X,
  Mail
} from 'lucide-react';
import canvasConfetti from 'canvas-confetti';
import LoginScreen from './components/LoginScreen';
import AdminDashboard from './components/AdminDashboard';
import OrgDashboard from './components/OrgDashboard';
import Homepage from './components/Homepage';
import Documentation from './components/resources/Documentation';
import DeveloperAPI from './components/resources/DeveloperAPI';
import SupportCenter from './components/resources/SupportCenter';

export default function App() {
  // Navigation & UI States
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'transcript' | 'notes' | 'summary'>('transcript');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const [liveTranscripts, setLiveTranscripts] = useState<TranscriptSegment[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const visualizerAnimationFrame = useRef<number | null>(null);

  // Transcription & Summary settings (saved in localStorage)
  const [transcribeProvider, setTranscribeProvider] = useState<'webspeech' | 'groq' | 'openai' | 'custom' | 'nvidia'>('webspeech');
  const [transcribeCustomEndpoint, setTranscribeCustomEndpoint] = useState('http://localhost:8000/v1/audio/transcriptions');
  const [summaryProvider, setSummaryProvider] = useState<'ollama' | 'gemini' | 'openai' | 'groq' | 'nvidia'>('gemini');
  
  // API Keys / Settings
  const [openaiKey, setOpenaiKey] = useState('');
  const [groqKey, setGroqKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [nvidiaKey, setNvidiaKey] = useState('');
  const [ollamaEndpoint, setOllamaEndpoint] = useState('http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState('gemma2:2b');
  const [openaiModel, setOpenaiModel] = useState('gpt-4o-mini');
  const [groqModel, setGroqModel] = useState('llama-3.3-70b-versatile');
  const [geminiModel, setGeminiModel] = useState('gemini-1.5-flash');
  const [nvidiaModel, setNvidiaModel] = useState('meta/llama-3.1-405b-instruct');

  // Active meeting states
  const [activeMeetingNotes, setActiveMeetingNotes] = useState('');
  const [activeMeetingSummary, setActiveMeetingSummary] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SummaryTemplate>('minutes');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [isPostProcessing, setIsPostProcessing] = useState(false);
  const [userName, setUserName] = useState('Meeting Organizer');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [audioPlaybackTime, setAudioPlaybackTime] = useState<number>(0);

  // Live Translate States
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('Urdu');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedTranscripts, setTranslatedTranscripts] = useState<TranscriptSegment[]>([]);
  const [showTranslation, setShowTranslation] = useState(false);

  // Real-Time Live Translate States
  const [liveSourceLang, setLiveSourceLang] = useState('auto');
  const [liveTargetLang, setLiveTargetLang] = useState('Japanese');
  const [isLiveTranslateEnabled, setIsLiveTranslateEnabled] = useState(false);

  // Endpoint connection test states
  const [testingEndpoint, setTestingEndpoint] = useState(false);
  const [endpointTestResult, setEndpointTestResult] = useState<{ status: 'success' | 'error' | null, message: string }>({ status: null, message: '' });

  // Startup splash loader state
  const [isSplashActive, setIsSplashActive] = useState(true);

  // Recording & Connection warning state
  const [recordingError, setRecordingError] = useState<'no-speech' | 'not-allowed' | 'server-offline' | null>(null);

  // Auth States
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ username: string; role: string; orgId?: string } | null>(null);
  const [showAdminConsole, setShowAdminConsole] = useState(false);
  const [viewState, setViewState] = useState<'homepage' | 'app' | 'documentation' | 'api' | 'support'>('homepage');
  const [showPostMeetingModal, setShowPostMeetingModal] = useState<string | null>(null);
  const [emailSendingState, setEmailSendingState] = useState<{ [meetingId: string]: 'idle' | 'sending' | 'sent' | 'error' }>({});
  const [serverConfig, setServerConfig] = useState<{ hasNvidiaKey: boolean; hasOpenaiKey: boolean; hasGroqKey: boolean; hasGeminiKey: boolean } | null>(null);
  const [sendingLog, setSendingLog] = useState(false);
  const [logSent, setLogSent] = useState(false);
  const [showConfirmEmail, setShowConfirmEmail] = useState(false);
  const [logError, setLogError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSplashActive(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  // Parse query parameter for invite and upgrade 'sai' user role
  useEffect(() => {
    // Parse invite code
    const params = new URLSearchParams(window.location.search);
    const invite = params.get('invite');
    if (invite) {
      // Save invite code to session storage so LoginScreen can auto-fill it
      sessionStorage.setItem('org_invite_code', invite);
      window.history.replaceState({}, document.title, window.location.pathname);
      alert(`AtlasMeet Invite Parsed! Pre-filling Organization invite code: ${invite}`);
    }

    // Upgrade 'sai' to organization admin if present
    try {
      const usersStr = localStorage.getItem('atlasmeet_users') || '[]';
      const users = JSON.parse(usersStr);
      let upgraded = false;

      const targetIdx = users.findIndex((u: any) => 
        u.username === 'sai' || 
        u.email === 'sandeepsai1915@gmail.com'
      );

      if (targetIdx !== -1) {
        const user = users[targetIdx];
        if (!user.orgId) {
          const orgsStr = localStorage.getItem('atlasmeet_organizations') || '[]';
          const orgs = JSON.parse(orgsStr);
          
          const defaultOrg = {
            id: 'org-atlasmeet-enterprise',
            name: 'AtlasMeet Enterprise',
            description: 'Corporate Workspace for TVS and partner teams',
            org_code: 'ATL-5892',
            invite_code: 'ATL-9K7M-PQ25',
            created_at: new Date().toISOString()
          };

          if (!orgs.some((o: any) => o.id === defaultOrg.id)) {
            orgs.push(defaultOrg);
            localStorage.setItem('atlasmeet_organizations', JSON.stringify(orgs));
          }

          users[targetIdx].orgId = defaultOrg.id;
          users[targetIdx].role = 'admin'; // Organization Admin
          upgraded = true;

          // If current logged in session matches, update session storage
          const sessionUser = localStorage.getItem('currentUser');
          if (sessionUser) {
            const parsed = JSON.parse(sessionUser);
            if (parsed.username === user.username) {
              parsed.orgId = defaultOrg.id;
              parsed.role = 'admin';
              localStorage.setItem('currentUser', JSON.stringify(parsed));
            }
          }
        }
      }

      if (upgraded) {
        localStorage.setItem('atlasmeet_users', JSON.stringify(users));
      }
    } catch (e) {
      console.error('Failed to migrate sai to organization admin:', e);
    }
  }, []);

  // Check authentication status on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('currentUser');
    const loginTimestamp = localStorage.getItem('loginTimestamp');

    if (savedToken && savedUser && loginTimestamp) {
      const isSessionValid = Date.now() - Number(loginTimestamp) < 6 * 60 * 60 * 1000; // 6 hours expiration
      if (isSessionValid) {
        try {
          const parsed = JSON.parse(savedUser);
          const dbNamespace = parsed.orgId ? parsed.orgId : parsed.username;
          switchUserDatabase(dbNamespace); 
          setAuthToken(savedToken);
          setCurrentUser(parsed);
          setViewState('app');
        } catch (e) {
          console.error('Failed to parse user session:', e);
          localStorage.removeItem('authToken');
          localStorage.removeItem('currentUser');
          localStorage.removeItem('loginTimestamp');
          switchUserDatabase('default');
        }
      } else {
        console.log('Session expired (exceeded 6 hours). Requiring fresh login.');
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('loginTimestamp');
        switchUserDatabase('default');
      }
    } else if (savedToken || savedUser || loginTimestamp) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('loginTimestamp');
      switchUserDatabase('default');
    }

    // Clean up unwanted user account
    try {
      const usersStr = localStorage.getItem('atlasmeet_users');
      if (usersStr) {
        let users = JSON.parse(usersStr);
        if (users.some((u: any) => u.username === 'akhil888binoy@gmail.com')) {
          users = users.filter((u: any) => u.username !== 'akhil888binoy@gmail.com');
          localStorage.setItem('atlasmeet_users', JSON.stringify(users));
          console.log('Successfully cleaned up unwanted user akhil888binoy@gmail.com');
        }
      }
    } catch (e) {
      console.error('Failed to clean up unwanted user:', e);
    }
  }, []);

  // Refs for Speech Recognition Closure avoidance
  const isLiveTranslateEnabledRef = useRef(isLiveTranslateEnabled);
  const liveSourceLangRef = useRef(liveSourceLang);
  const liveTargetLangRef = useRef(liveTargetLang);

  useEffect(() => {
    isLiveTranslateEnabledRef.current = isLiveTranslateEnabled;
  }, [isLiveTranslateEnabled]);

  useEffect(() => {
    liveSourceLangRef.current = liveSourceLang;
  }, [liveSourceLang]);

  useEffect(() => {
    liveTargetLangRef.current = liveTargetLang;
  }, [liveTargetLang]);

  const recognitionLangCodes: { [key: string]: string } = {
    'auto': 'en-US',
    'English': 'en-US',
    'Urdu': 'ur-PK',
    'Spanish': 'es-ES',
    'French': 'fr-FR',
    'German': 'de-DE',
    'Hindi': 'hi-IN',
    'Arabic': 'ar-SA',
    'Mandarin': 'zh-CN',
    'Japanese': 'ja-JP',
    'Tamil': 'ta-IN'
  };

  // Live Query from Dexie IndexedDB
  const meetings = useLiveQuery(() => db.meetings.orderBy('lastUpdated').reverse().toArray());
  const activeMeetingTranscripts = useLiveQuery(
    () => (activeMeetingId ? db.transcripts.where('meetingId').equals(activeMeetingId).sortBy('sequenceId') : []),
    [activeMeetingId]
  );
  const activeMeeting = useLiveQuery(
    () => (activeMeetingId ? db.meetings.get(activeMeetingId) : undefined),
    [activeMeetingId]
  );

  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    if (activeMeeting?.audioBlob) {
      const url = URL.createObjectURL(activeMeeting.audioBlob);
      setAudioUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setAudioUrl(null);
    }
  }, [activeMeeting?.audioBlob]);

  // Load Settings on Mount
  useEffect(() => {
    setTranscribeProvider((localStorage.getItem('transcribeProvider') as any) || 'webspeech');
    setTranscribeCustomEndpoint(localStorage.getItem('transcribeCustomEndpoint') || 'http://localhost:8000/v1/audio/transcriptions');
    setSummaryProvider((localStorage.getItem('summaryProvider') as any) || 'gemini');
    setOpenaiKey(localStorage.getItem('openaiKey') || '');
    setGroqKey(localStorage.getItem('groqKey') || '');
    setGeminiKey(localStorage.getItem('geminiKey') || '');
    setNvidiaKey(localStorage.getItem('nvidiaKey') || '');
    setOllamaEndpoint(localStorage.getItem('ollamaEndpoint') || 'http://localhost:11434');
    setOllamaModel(localStorage.getItem('ollamaModel') || 'gemma2:2b');
    setOpenaiModel(localStorage.getItem('openaiModel') || 'gpt-4o-mini');
    setGroqModel(localStorage.getItem('groqModel') || 'llama-3.3-70b-versatile');
    setGeminiModel(localStorage.getItem('geminiModel') || 'gemini-1.5-flash');
    setNvidiaModel(localStorage.getItem('nvidiaModel') || 'meta/llama-3.1-405b-instruct');
    setUserName(localStorage.getItem('userName') || 'Meeting Organizer');

    // Query server for pre-configured keys in .env
    fetch('/api/config')
      .then(res => res.json())
      .then(data => setServerConfig(data))
      .catch(err => console.error('Failed to retrieve server api configs:', err));
  }, []);

  // Update Settings in LocalStorage
  const saveSetting = (key: string, value: string) => {
    localStorage.setItem(key, value);
  };

  const handleDownloadAudio = () => {
    if (!activeMeeting?.audioBlob) return;
    const url = URL.createObjectURL(activeMeeting.audioBlob);
    const a = document.createElement('a');
    a.href = url;
    const safeTitle = (activeMeeting.title || 'meeting').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    a.download = `${safeTitle}_audio.webm`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportAudio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';

    // Check cloud / local configs
    const isGroqEnabled = transcribeProvider === 'groq' && (groqKey || serverConfig?.hasGroqKey);
    const isOpenAIEnabled = transcribeProvider === 'openai' && (openaiKey || serverConfig?.hasOpenaiKey);
    const isNvidiaEnabled = transcribeProvider === 'nvidia' && (nvidiaKey || serverConfig?.hasNvidiaKey);
    const isCustomEnabled = transcribeProvider === 'custom' && transcribeCustomEndpoint;
    
    let activeProvider = transcribeProvider;
    let activeKey = '';
    let activeModelName = '';

    if (isCustomEnabled) {
      // Custom local server needs no API keys
    } else if (isNvidiaEnabled) {
      activeKey = nvidiaKey || 'server_key';
      activeModelName = 'nvidia/whisper-large-v3';
    } else if (isGroqEnabled) {
      activeKey = groqKey || 'server_key';
      activeModelName = groqModel;
    } else if (isOpenAIEnabled) {
      activeKey = openaiKey || 'server_key';
      activeModelName = 'whisper-1';
    } else if (nvidiaKey || serverConfig?.hasNvidiaKey) {
      activeProvider = 'nvidia';
      activeKey = nvidiaKey || 'server_key';
      activeModelName = 'nvidia/whisper-large-v3';
    } else if (groqKey || serverConfig?.hasGroqKey) {
      activeProvider = 'groq';
      activeKey = groqKey || 'server_key';
      activeModelName = groqModel;
    } else if (openaiKey || serverConfig?.hasOpenaiKey) {
      activeProvider = 'openai';
      activeKey = openaiKey || 'server_key';
      activeModelName = 'whisper-1';
    }

    if (!isCustomEnabled && !activeKey) {
      alert('To transcribe imported audio files, please configure an NVIDIA NIM key, Groq key, OpenAI key, or Custom server in Settings.');
      setIsSettingsOpen(true);
      return;
    }

    setIsPostProcessing(true);
    const tempId = `meeting-${Date.now()}`;
    const cleanTitle = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;

    try {
      // Get audio duration
      const duration = await new Promise<number>((resolve) => {
        const audio = new Audio();
        audio.src = URL.createObjectURL(file);
        audio.onloadedmetadata = () => {
          URL.revokeObjectURL(audio.src);
          resolve(audio.duration || 0);
        };
        audio.onerror = () => {
          resolve(0);
        };
      });

      // Save meeting in db
      await db.meetings.add({
        id: tempId,
        title: cleanTitle,
        startTime: Date.now(),
        lastUpdated: Date.now(),
        notes: '',
        summary: '',
        audioBlob: file,
        duration,
      });

      setActiveMeetingId(tempId);

      let transcribedText = '';
      if (activeProvider === 'custom') {
        transcribedText = await transcriptionService.transcribeWithCustomLocal(file, transcribeCustomEndpoint);
      } else if (activeProvider === 'nvidia') {
        transcribedText = await transcriptionService.transcribeWithNvidia(file, activeKey, activeModelName);
      } else if (activeProvider === 'groq') {
        transcribedText = await transcriptionService.transcribeWithGroq(file, activeKey, activeModelName);
      } else {
        transcribedText = await transcriptionService.transcribeWithOpenAI(file, activeKey);
      }

      if (transcribedText) {
        await processCloudTranscript(tempId, transcribedText);
      }

      canvasConfetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });

    } catch (err) {
      console.error('Failed to import and transcribe audio:', err);
      alert('Transcribing imported audio failed. Please check your API key/network connection.');
      await db.meetings.delete(tempId);
      setActiveMeetingId(null);
    } finally {
      setIsPostProcessing(false);
    }
  };

  const testLocalEndpoint = async () => {
    setTestingEndpoint(true);
    setEndpointTestResult({ status: null, message: 'Testing connection...' });
    try {
      const mockAudioBlob = new Blob([new Uint8Array(100)], { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('file', mockAudioBlob, 'audio.webm');
      formData.append('model', 'parakeet-tdt-0.6b-v3');
      formData.append('response_format', 'json');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(transcribeCustomEndpoint, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        await response.json().catch(() => ({}));
        setEndpointTestResult({
          status: 'success',
          message: `Connection successful! Server responded.`
        });
      } else {
        const errText = await response.text().catch(() => '');
        setEndpointTestResult({
          status: 'error',
          message: `Server reachable but returned error status ${response.status}: ${errText || response.statusText}`
        });
      }
    } catch (err: any) {
      console.error('Endpoint test failed:', err);
      setEndpointTestResult({
        status: 'error',
        message: err.name === 'AbortError' 
          ? 'Error: Connection timed out (5s). Is your local server running?' 
          : `Error: Connection failed. Check endpoint URL. (${err.message || err})`
      });
    } finally {
      setTestingEndpoint(false);
    }
  };

  const translateTextFree = async (text: string, sourceLang: string, targetLang: string): Promise<string> => {
    try {
      const langCodes: { [key: string]: string } = {
        'auto': 'auto',
        'English': 'en',
        'Urdu': 'ur',
        'Spanish': 'es',
        'French': 'fr',
        'German': 'de',
        'Hindi': 'hi',
        'Arabic': 'ar',
        'Mandarin': 'zh',
        'Japanese': 'ja',
        'Tamil': 'ta'
      };

      const sourceCode = langCodes[sourceLang] || 'auto';
      const targetCode = langCodes[targetLang] || 'ja';

      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceCode}|${targetCode}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.responseData && data.responseData.translatedText) {
          return data.responseData.translatedText;
        }
      }
    } catch (e) {
      console.error('Free translation API error:', e);
    }
    return '';
  };

  const handleTranslate = async () => {
    if (!activeMeetingTranscripts || activeMeetingTranscripts.length === 0) return;

    setIsTranslating(true);
    try {
      const hasKey = summaryProvider === 'ollama' || 
                    (summaryProvider === 'gemini' && (geminiKey || serverConfig?.hasGeminiKey)) || 
                    (summaryProvider === 'openai' && (openaiKey || serverConfig?.hasOpenaiKey)) || 
                    (summaryProvider === 'nvidia' && (nvidiaKey || serverConfig?.hasNvidiaKey)) || 
                    (summaryProvider === 'groq' && (groqKey || serverConfig?.hasGroqKey));

      let responseText = '';
      if (hasKey) {
        const textToTranslate = activeMeetingTranscripts
          .map(t => `[${formatTime(t.audioStartTime || 0)}] ${t.text}`)
          .join('\n');

        const config: LLMConfig = {
          provider: summaryProvider,
          apiKey: summaryProvider === 'gemini' ? (geminiKey || 'server') : summaryProvider === 'openai' ? (openaiKey || 'server') : summaryProvider === 'nvidia' ? (nvidiaKey || 'server') : (groqKey || 'server'),
          model: summaryProvider === 'ollama' ? ollamaModel : summaryProvider === 'gemini' ? geminiModel : summaryProvider === 'openai' ? openaiModel : summaryProvider === 'nvidia' ? nvidiaModel : groqModel,
          customEndpoint: summaryProvider === 'ollama' ? ollamaEndpoint : undefined,
        };

        responseText = await summaryService.translate(
          textToTranslate,
          sourceLang,
          targetLang,
          config
        );
      } else {
        // Free Translation - Batched to prevent rate limiting and extreme latency
        const batchSize = 10;
        const translatedLines = [];
        
        for (let i = 0; i < activeMeetingTranscripts.length; i += batchSize) {
          const batch = activeMeetingTranscripts.slice(i, i + batchSize);
          const batchText = batch.map(s => s.text).join('\n');
          
          const translatedBatchText = await translateTextFree(batchText, sourceLang, targetLang);
          const splitLines = translatedBatchText.split('\n');
          
          for (let j = 0; j < batch.length; j++) {
            const original = batch[j];
            const translatedText = splitLines[j] || original.text;
            translatedLines.push(`[${formatTime(original.audioStartTime || 0)}] ${translatedText.trim()}`);
          }
        }
        responseText = translatedLines.join('\n');
      }

      const parsed = parseTranslatedText(responseText);
      if (parsed.length > 0) {
        // Save translated text back into IndexedDB for persistence
        for (let i = 0; i < parsed.length; i++) {
          const originalSegment = activeMeetingTranscripts[i];
          if (originalSegment && originalSegment.id) {
            await db.transcripts.update(originalSegment.id, {
              translatedText: parsed[i].text
            });
          }
        }

        setTranslatedTranscripts(parsed);
        setShowTranslation(true);
      } else {
        alert('Translation returned an empty result.');
      }
    } catch (err: any) {
      console.error('Translation error:', err);
      alert(`Translation failed: ${err.message || err}`);
    } finally {
      setIsTranslating(false);
    }
  };

  const parseTranslatedText = (translatedText: string): TranscriptSegment[] => {
    const lines = translatedText.split('\n');
    const result: TranscriptSegment[] = [];
    let seq = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const match = trimmed.match(/^\[(\d{2}:\d{2}(?::\d{2})?)\]\s*(.*)$/);
      if (match) {
        const timeStr = match[1];
        const text = match[2].trim();

        const parts = timeStr.split(':').map(Number);
        let seconds = 0;
        if (parts.length === 2) {
          seconds = parts[0] * 60 + parts[1];
        } else if (parts.length === 3) {
          seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
        }

        result.push({
          meetingId: activeMeetingId || '',
          text,
          timestamp: timeStr,
          audioStartTime: seconds,
          audioEndTime: seconds + 5,
          sequenceId: seq++,
          confidence: 1.0,
        });
      }
    }

    if (result.length === 0 && activeMeetingTranscripts) {
      const sentences = translatedText.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
      return activeMeetingTranscripts.map((orig, i) => ({
        ...orig,
        text: sentences[i] || orig.text,
      }));
    }

    return result;
  };

  const translateLiveSegment = async (_meetingId: string, segmentId: number | undefined, text: string) => {
    if (!segmentId) return;

    try {
      const translated = await translateTextFree(text, liveSourceLangRef.current, liveTargetLangRef.current);
      if (translated) {
        await db.transcripts.update(segmentId, { translatedText: translated });
        setLiveTranscripts((prev) => 
          prev.map((s) => s.id === segmentId ? { ...s, translatedText: translated } : s)
        );
      }
    } catch (err) {
      console.warn('Failed to translate segment in real-time:', err);
    }
  };

  const handleDownloadTranscript = (format: 'txt' | 'docx' | 'pdf') => {
    const currentTranscripts = showTranslation 
      ? (translatedTranscripts.length > 0 
          ? translatedTranscripts 
          : (activeMeetingTranscripts || []).map(t => ({ ...t, text: t.translatedText || t.text }))
        )
      : (activeMeetingTranscripts || []);
    if (currentTranscripts.length === 0) return;
    
    const title = activeMeeting?.title || 'Untitled Meeting';
    const date = new Date(activeMeeting?.startTime || Date.now()).toLocaleDateString();
    const time = new Date(activeMeeting?.startTime || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const durationText = activeMeeting?.duration ? formatTime(activeMeeting.duration) : '';
    const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    if (format === 'txt') {
      let content = `==================================================\n`;
      content += `               MEETING TRANSCRIPT ${showTranslation ? `(TRANSLATED TO ${targetLang.toUpperCase()})` : ''}\n`;
      content += `==================================================\n`;
      content += `Meeting Title : ${title}\n`;
      content += `Date          : ${date}\n`;
      content += `Time          : ${time}\n`;
      content += `Organized By  : ${userName || 'Meeting Organizer'}\n`;
      if (durationText) {
        content += `Duration      : ${durationText}\n`;
      }
      content += `==================================================\n\n`;
      content += currentTranscripts.map(t => `[${formatTime(t.audioStartTime || 0)}] ${t.text}`).join('\n');

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeTitle}_transcript.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'docx') {
      const docHtml = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333333; padding: 20px; }
            h1 { color: #4f46e5; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; font-size: 20pt; font-weight: bold; margin-bottom: 5px; }
            .meta-table { width: 100%; margin-bottom: 25px; border-collapse: collapse; }
            .meta-table td { padding: 4px 0; font-size: 11pt; color: #4b5563; }
            .section-title { color: #1e1b4b; font-size: 14pt; margin-top: 25px; margin-bottom: 10px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; font-weight: bold; }
            .segment { margin-bottom: 10px; font-size: 11pt; }
            .timestamp { font-family: Consolas, monospace; color: #6366f1; font-weight: bold; margin-right: 12px; }
          </style>
        </head>
        <body>
          <h1>Meeting Transcript: ${title}</h1>
          <table class="meta-table">
            <tr><td><strong>Date:</strong> ${date}</td></tr>
            <tr><td><strong>Time:</strong> ${time}</td></tr>
            <tr><td><strong>Organized By:</strong> ${userName || 'Meeting Organizer'}</td></tr>
            ${durationText ? `<tr><td><strong>Duration:</strong> ${durationText}</td></tr>` : ''}
          </table>
          <hr style="border: 0; border-top: 1px solid #cbd5e1; margin-bottom: 20px;" />
          <div class="section-title">Transcript Details ${showTranslation ? `(Translated)` : ''}</div>
          ${currentTranscripts.map(t => `<div class="segment"><span class="timestamp">[${formatTime(t.audioStartTime || 0)}]</span> <span>${t.text}</span></div>`).join('')}
        </body>
        </html>
      `;
      const blob = new Blob(['\ufeff' + docHtml], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeTitle}_transcript_${showTranslation ? 'translated' : 'original'}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
          <head>
            <title>${title} - Transcript</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; }
              h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; font-size: 26px; font-weight: 800; margin-bottom: 10px; }
              .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 30px; font-size: 14px; color: #475569; background-color: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #f1f5f9; }
              .meta p { margin: 0; }
              .section-title { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; }
              .segment { margin-bottom: 16px; font-size: 14px; line-height: 1.6; display: flex; align-items: start; }
              .timestamp { font-family: monospace; color: #6366f1; font-weight: 600; width: 110px; flex-shrink: 0; }
              .text { color: #334155; }
              @media print {
                body { padding: 0; }
                .meta { background-color: transparent; border: none; padding: 0; }
              }
            </style>
          </head>
          <body>
            <h1>Meeting Transcript: ${title} ${showTranslation ? `(Translated)` : ''}</h1>
            <div class="meta">
              <p><strong>Date:</strong> ${date}</p>
              <p><strong>Time:</strong> ${time}</p>
              <p><strong>Organized By:</strong> ${userName || 'Meeting Organizer'}</p>
              ${durationText ? `<p><strong>Duration:</strong> ${durationText}</p>` : ''}
            </div>
            <div class="section-title">Meeting Transcript ${showTranslation ? `(Translated)` : ''}</div>
            <div style="margin-top: 10px;">
              ${currentTranscripts.map(t => `
                <div class="segment">
                  <div class="timestamp">[${formatTime(t.audioStartTime || 0)}]</div>
                  <div class="text">${t.text}</div>
                </div>
              `).join('')}
            </div>
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              };
            </script>
          </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  const convertMarkdownToHtml = (md: string) => {
    return md
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^\- \[( )\] (.*$)/gim, '<div><input type="checkbox" disabled /> $2</div>')
      .replace(/^\- \[(x)\] (.*$)/gim, '<div><input type="checkbox" checked disabled /> $2</div>')
      .replace(/^\- (.*$)/gim, '<ul><li>$1</li></ul>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br />');
  };

  const handleDownloadSummary = (format: 'docx' | 'pdf') => {
    if (!activeMeetingSummary) return;

    const title = activeMeeting?.title || 'Untitled Meeting';
    const date = new Date(activeMeeting?.startTime || Date.now()).toLocaleDateString();
    const time = new Date(activeMeeting?.startTime || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const summaryHtml = convertMarkdownToHtml(activeMeetingSummary);

    if (format === 'docx') {
      const docHtml = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <title>${title} - AI Summary</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333333; padding: 20px; }
            h1 { color: #4f46e5; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; font-size: 20pt; font-weight: bold; margin-bottom: 5px; }
            .meta-table { width: 100%; margin-bottom: 25px; border-collapse: collapse; }
            .meta-table td { padding: 4px 0; font-size: 11pt; color: #4b5563; }
            .summary-content { font-size: 11pt; line-height: 1.6; }
            h3 { color: #0f172a; font-size: 14pt; font-weight: bold; margin-top: 20px; margin-bottom: 8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
            ul { margin-top: 5px; margin-bottom: 15px; padding-left: 20px; }
            li { margin-bottom: 6px; }
          </style>
        </head>
        <body>
          <h1>AI Summary: ${title}</h1>
          <table class="meta-table">
            <tr><td><strong>Date:</strong> ${date}</td></tr>
            <tr><td><strong>Time:</strong> ${time}</td></tr>
            <tr><td><strong>Organized By:</strong> ${userName || 'Meeting Organizer'}</td></tr>
          </table>
          <hr style="border: 0; border-top: 1px solid #cbd5e1; margin-bottom: 20px;" />
          <div class="summary-content">
            ${summaryHtml}
          </div>
        </body>
        </html>
      `;
      const blob = new Blob(['\ufeff' + docHtml], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeTitle}_summary.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
          <head>
            <title>${title} - AI Summary</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; }
              h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; font-size: 26px; font-weight: 800; margin-bottom: 10px; }
              .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 30px; font-size: 14px; color: #475569; background-color: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #f1f5f9; }
              .meta p { margin: 0; }
              .summary-container { line-height: 1.6; color: #334155; font-size: 15px; }
              h3 { color: #0f172a; font-size: 18px; font-weight: 700; margin-top: 25px; margin-bottom: 10px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; }
              ul { margin-top: 5px; margin-bottom: 15px; padding-left: 20px; }
              li { margin-bottom: 6px; }
              @media print {
                body { padding: 0; }
                .meta { background-color: transparent; border: none; padding: 0; }
              }
            </style>
          </head>
          <body>
            <h1>AI Summary: ${title}</h1>
            <div class="meta">
              <p><strong>Date:</strong> ${date}</p>
              <p><strong>Time:</strong> ${time}</p>
              <p><strong>Organized By:</strong> ${userName || 'Meeting Organizer'}</p>
            </div>
            <div class="summary-container">
              ${summaryHtml}
            </div>
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              };
            </script>
          </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  // Restart recognition if source language changes during recording
  useEffect(() => {
    if (isRecording && !isPaused && activeMeetingId) {
      transcriptionService.stopRealtime();
      const bcpLang = recognitionLangCodes[liveSourceLang] || 'en-US';
      transcriptionService.startRealtime(async (update: TranscriptUpdate) => {
        const segment: TranscriptSegment = {
          meetingId: activeMeetingId,
          text: update.text,
          timestamp: update.timestamp,
          confidence: update.confidence,
          sequenceId: update.sequenceId,
          audioStartTime: update.audioStartTime,
          audioEndTime: update.audioEndTime,
          duration: update.duration,
        };
        const id = await db.transcripts.add(segment);
        segment.id = id;
        setLiveTranscripts((prev) => [...prev, segment]);

        if (isLiveTranslateEnabledRef.current) {
          translateLiveSegment(activeMeetingId, id, update.text);
        }
      }, bcpLang);
    }
  }, [liveSourceLang]);

  // Sync Meeting notes when active meeting changes
  useEffect(() => {
    if (activeMeetingId) {
      db.meetings.get(activeMeetingId).then((m) => {
        if (m) {
          setActiveMeetingNotes(m.notes || '');
          setActiveMeetingSummary(m.summary || '');
          setEditedTitle(m.title);
        }
      });
      setActiveTab('transcript');
      setAudioPlaybackTime(0);
      setTranslatedTranscripts([]);
      setShowTranslation(false);
    }
  }, [activeMeetingId]);

  // Audio level polling for visualizer
  useEffect(() => {
    if (isRecording && !isPaused) {
      const draw = () => {
        setAudioLevel(recordingService.getAudioLevel());
        visualizerAnimationFrame.current = requestAnimationFrame(draw);
      };
      draw();
    } else {
      if (visualizerAnimationFrame.current) {
        cancelAnimationFrame(visualizerAnimationFrame.current);
      }
      setAudioLevel(0);
    }

    return () => {
      if (visualizerAnimationFrame.current) {
        cancelAnimationFrame(visualizerAnimationFrame.current);
      }
    };
  }, [isRecording, isPaused]);

  const handleSpeechError = (errType: string) => {
    console.warn('Speech engine error occurred:', errType);
    if (errType === 'no-speech') {
      setRecordingError('no-speech');
    } else if (errType === 'not-allowed') {
      setRecordingError('not-allowed');
    } else {
      setRecordingError('server-offline');
    }
  };

  const handleLoginSuccess = (token: string, user: { username: string; role: string; orgId?: string }) => {
    const dbNamespace = user.orgId ? user.orgId : user.username;
    switchUserDatabase(dbNamespace); 
    setAuthToken(token);
    setCurrentUser(user);
    setViewState('app');
    localStorage.setItem('authToken', token);
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('loginTimestamp', Date.now().toString());
  };

  const handleLogout = () => {
    switchUserDatabase('default'); // revert to default public database
    setAuthToken(null);
    setCurrentUser(null);
    setViewState('homepage');
    setShowAdminConsole(false);
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('loginTimestamp');
  };

  const handleLaunchApp = () => {
    setViewState('app');
  };

  // Start Meeting / Recording
  const handleStartMeeting = async () => {
    setRecordingError(null);
    const defaultTitle = `Meeting ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const tempId = `meeting-${Date.now()}`;


    setLiveTranscripts([]);
    setRecordingDuration(0);
    setActiveMeetingId(tempId);

    // Save initial metadata in IndexedDB
    await db.meetings.add({
      id: tempId,
      title: defaultTitle,
      startTime: Date.now(),
      lastUpdated: Date.now(),
      notes: '',
      summary: '',
    });

    // Start Audio Recorder
    await recordingService.start(
      (state: RecordingState) => {
        setIsRecording(state.isRecording);
        setIsPaused(state.isPaused);
      },
      (duration: number) => {
        setRecordingDuration(duration);
      }
    );

    // Start real-time speech recognition
    const bcpLang = recognitionLangCodes[liveSourceLang] || 'en-US';
    transcriptionService.startRealtime(async (update: TranscriptUpdate) => {
      const segment: TranscriptSegment = {
        meetingId: tempId,
        text: update.text,
        timestamp: update.timestamp,
        confidence: update.confidence,
        sequenceId: update.sequenceId,
        audioStartTime: update.audioStartTime,
        audioEndTime: update.audioEndTime,
        duration: update.duration,
      };

      // Store segment in database
      const id = await db.transcripts.add(segment);
      segment.id = id;
      setLiveTranscripts((prev) => [...prev, segment]);

      if (isLiveTranslateEnabledRef.current) {
        translateLiveSegment(tempId, id, update.text);
      }
    }, bcpLang, handleSpeechError);
  };

  // Pause / Resume Recording
  const handlePauseRecording = () => {
    if (isPaused) {
      recordingService.resume();
      const bcpLang = recognitionLangCodes[liveSourceLang] || 'en-US';
      transcriptionService.startRealtime(async (update: TranscriptUpdate) => {
        if (!activeMeetingId) return;
        const segment: TranscriptSegment = {
          meetingId: activeMeetingId,
          text: update.text,
          timestamp: update.timestamp,
          confidence: update.confidence,
          sequenceId: update.sequenceId,
          audioStartTime: update.audioStartTime,
          audioEndTime: update.audioEndTime,
          duration: update.duration,
        };
        const id = await db.transcripts.add(segment);
        segment.id = id;
        setLiveTranscripts((prev) => [...prev, segment]);

        if (isLiveTranslateEnabledRef.current) {
          translateLiveSegment(activeMeetingId, id, update.text);
        }
      }, bcpLang, handleSpeechError);
    } else {
      recordingService.pause();
      transcriptionService.stopRealtime();
    }
  };

  // Stop Recording & Post-Process
  const handleStopRecording = async () => {
    transcriptionService.stopRealtime();
    setIsPostProcessing(true);
    
    try {
      const { blob, duration } = await recordingService.stop();
      
      if (activeMeetingId) {
        // Update meeting duration, audioBlob, and timestamp
        await db.meetings.update(activeMeetingId, {
          duration,
          audioBlob: blob,
          lastUpdated: Date.now(),
        });

        // Run Cloud/Local transcription if enabled
        if (transcribeProvider === 'custom' && transcribeCustomEndpoint) {
          const cloudText = await transcriptionService.transcribeWithCustomLocal(blob, transcribeCustomEndpoint);
          await processCloudTranscript(activeMeetingId, cloudText);
        } else if (transcribeProvider === 'nvidia' && (nvidiaKey || serverConfig?.hasNvidiaKey)) {
          const cloudText = await transcriptionService.transcribeWithNvidia(blob, nvidiaKey, 'nvidia/whisper-large-v3');
          await processCloudTranscript(activeMeetingId, cloudText);
        } else if (transcribeProvider === 'groq' && (groqKey || serverConfig?.hasGroqKey)) {
          const cloudText = await transcriptionService.transcribeWithGroq(blob, groqKey, groqModel);
          await processCloudTranscript(activeMeetingId, cloudText);
        } else if (transcribeProvider === 'openai' && (openaiKey || serverConfig?.hasOpenaiKey)) {
          const cloudText = await transcriptionService.transcribeWithOpenAI(blob, openaiKey);
          await processCloudTranscript(activeMeetingId, cloudText);
        }
      }

      // Success Confetti!
      canvasConfetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });

      // Open export and email logs hub modal!
      setShowPostMeetingModal(activeMeetingId);

    } catch (error) {
      console.error('Failed to complete recording processing:', error);
      setRecordingError('server-offline');
      alert('Recording stopped. Could not contact transcription server.');
    } finally {
      setIsPostProcessing(false);
      setIsRecording(false);
      setIsPaused(false);
    }
  };


  // Replace live transcripts with high-accuracy cloud transcription
  const processCloudTranscript = async (meetingId: string, fullText: string) => {
    // Clear old real-time drafts for this meeting
    await db.transcripts.where('meetingId').equals(meetingId).delete();

    // Split text roughly into sentences or paragraphs for segments
    const sentences = (fullText.match(/[^.!?]+[.!?]+(\s|$)/g) || [fullText]).map(s => s.trim()).filter(Boolean);
    let sequenceId = 0;

    const meeting = await db.meetings.get(meetingId);
    const duration = meeting?.duration || 0;
    const sentenceDuration = sentences.length > 0 ? duration / sentences.length : 5;
    
    let idx = 0;
    for (const sentence of sentences) {
      const audioStartTime = idx * sentenceDuration;
      const audioEndTime = (idx + 1) * sentenceDuration;
      await db.transcripts.add({
        meetingId,
        text: sentence,
        timestamp: new Date().toLocaleTimeString(),
        confidence: 1.0,
        sequenceId: sequenceId++,
        audioStartTime,
        audioEndTime,
        duration: sentenceDuration,
      });
      idx++;
    }
  };

  // Generate Summary using LLM
  const handleGenerateSummary = async () => {
    if (!activeMeetingId) return;
    
    setIsGeneratingSummary(true);
    setActiveMeetingSummary('');

    try {
      const segments = await db.transcripts.where('meetingId').equals(activeMeetingId).sortBy('sequenceId');
      const fullText = segments.map((s) => s.text).join('\n');

      const config: LLMConfig = {
        provider: summaryProvider,
        apiKey: summaryProvider === 'gemini' ? (geminiKey || 'server') : summaryProvider === 'openai' ? (openaiKey || 'server') : summaryProvider === 'nvidia' ? (nvidiaKey || 'server') : (groqKey || 'server'),
        model: summaryProvider === 'ollama' ? ollamaModel : summaryProvider === 'gemini' ? geminiModel : summaryProvider === 'openai' ? openaiModel : summaryProvider === 'nvidia' ? nvidiaModel : groqModel,
        customEndpoint: summaryProvider === 'ollama' ? ollamaEndpoint : undefined,
      };

      const result = await summaryService.generate(fullText, selectedTemplate, config);
      setActiveMeetingSummary(result);

      // Save summary in database
      await db.meetings.update(activeMeetingId, {
        summary: result,
        lastUpdated: Date.now(),
      });

    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Failed to generate summary.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Auto-save Notes when typed
  const handleNotesChange = (text: string) => {
    setActiveMeetingNotes(text);
    if (activeMeetingId) {
      db.meetings.update(activeMeetingId, {
        notes: text,
        lastUpdated: Date.now(),
      });
    }
  };

  // Save Meeting Title
  const handleSaveTitle = async () => {
    if (activeMeetingId && editedTitle.trim()) {
      await db.meetings.update(activeMeetingId, {
        title: editedTitle.trim(),
        lastUpdated: Date.now(),
      });
      setIsEditingTitle(false);
    }
  };

  // Delete Meeting
  const handleDeleteMeeting = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this meeting and all its transcripts?')) {
      await db.meetings.delete(id);
      await db.transcripts.where('meetingId').equals(id).delete();
      if (activeMeetingId === id) {
        setActiveMeetingId(null);
      }
    }
  };

  // Copy Summary or Transcript to clipboard
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Format Recording timer
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleSendMeetingLogEmail = async (meetingId: string, showTranslated: boolean = false, langName: string = '') => {
    setEmailSendingState(prev => ({ ...prev, [meetingId]: 'sending' }));

    try {
      const meeting = await db.meetings.get(meetingId);
      if (!meeting) throw new Error('Meeting not found.');

      const usersStr = localStorage.getItem('atlasmeet_users') || '[]';
      const users = JSON.parse(usersStr);
      const registeredUser = users.find((u: any) => u.username === currentUser?.username);
      const targetEmail = registeredUser?.email || currentUser?.username;

      if (!targetEmail || !targetEmail.includes('@')) {
        throw new Error('No valid email address is linked to your account. Update profile.');
      }

      // Fetch transcripts
      const segments = await db.transcripts.where('meetingId').equals(meetingId).sortBy('sequenceId');
      const fullTranscriptText = segments.map(s => {
        const text = showTranslated ? (s.translatedText || s.text) : s.text;
        return `[${s.timestamp}] ${text}`;
      }).join('\n');

      // Convert audio blob to base64 if it exists
      let audioBase64 = '';
      if (meeting.audioBlob) {
        const audioBlob = meeting.audioBlob;
        const reader = new FileReader();
        const readPromise = new Promise<string>((resolve) => {
          reader.onloadend = () => {
            const resultStr = reader.result as string;
            const base64Content = resultStr.split(',')[1] || '';
            resolve(base64Content);
          };
          reader.readAsDataURL(audioBlob);
        });
        audioBase64 = await readPromise;
      }

      const res = await fetch('/api/auth/send-meeting-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          username: currentUser?.username || 'Sai',
          title: showTranslated ? `${meeting.title} (Translated to ${langName})` : meeting.title,
          dateTime: new Date(meeting.startTime).toLocaleString(),
          transcript: fullTranscriptText,
          summary: meeting.summary || meeting.notes || 'No summary notes created.',
          audioBase64
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Email log dispatch failed.');
      }

      setEmailSendingState(prev => ({ ...prev, [meetingId]: 'sent' }));
      setTimeout(() => {
        setEmailSendingState(prev => ({ ...prev, [meetingId]: 'idle' }));
      }, 5000);
    } catch (err: any) {
      console.error(err);
      setEmailSendingState(prev => ({ ...prev, [meetingId]: 'error' }));
      alert(err.message || 'Failed to dispatch email.');
    }
  };

  // Post Meeting Export Modal
  const renderPostMeetingModal = () => {
    if (!showPostMeetingModal) return null;
    
    const activeMeeting = meetings?.find(m => m.id === showPostMeetingModal);
    if (!activeMeeting) return null;
    
    const formattedDate = new Date(activeMeeting.startTime).toLocaleString();
    const durationMin = Math.floor((activeMeeting.duration || 0) / 60);
    const durationSec = Math.round((activeMeeting.duration || 0) % 60);


    const handleSendLogEmail = async () => {
      setLogError('');
      setSendingLog(true);
      
      try {
        const usersStr = localStorage.getItem('atlasmeet_users') || '[]';
        const users = JSON.parse(usersStr);
        const registeredUser = users.find((u: any) => u.username === currentUser?.username);
        const targetEmail = registeredUser?.email || currentUser?.username; // fallback to username if it's an email

        if (!targetEmail || !targetEmail.includes('@')) {
          throw new Error('No valid email address is linked to your account. Update profile.');
        }

        // Fetch transcripts
        const segments = await db.transcripts.where('meetingId').equals(activeMeeting.id).sortBy('sequenceId');
        const fullTranscriptText = segments.map(s => `[${s.timestamp}] ${s.text}`).join('\n');

        // Convert audio blob to base64 if it exists
        let audioBase64 = '';
        if (activeMeeting.audioBlob) {
          const audioBlob = activeMeeting.audioBlob;
          const reader = new FileReader();
          const readPromise = new Promise<string>((resolve) => {
            reader.onloadend = () => {
              const resultStr = reader.result as string;
              const base64Content = resultStr.split(',')[1] || '';
              resolve(base64Content);
            };
            reader.readAsDataURL(audioBlob);
          });
          audioBase64 = await readPromise;
        }

        const res = await fetch('/api/auth/send-meeting-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: targetEmail,
            username: currentUser?.username || 'Sai',
            title: activeMeeting.title,
            dateTime: formattedDate,
            transcript: fullTranscriptText,
            summary: activeMeeting.summary || activeMeeting.notes || 'No summary notes created.',
            audioBase64
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || 'Email log dispatch failed.');
        }

        setLogSent(true);
        setShowConfirmEmail(false);
      } catch (err: any) {
        setLogError(err.message || 'Failed to dispatch email.');
      } finally {
        setSendingLog(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
        <div className="w-full max-w-xl bg-slate-900 border border-slate-850 p-8 rounded-3xl shadow-2xl relative space-y-6 text-slate-100">
          
          <button 
            onClick={() => {
              setShowPostMeetingModal(null);
              setLogSent(false);
              setShowConfirmEmail(false);
              setLogError('');
            }}
            className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>

          <div className="space-y-1.5 text-center">
            <div className="w-14 h-14 bg-purple-500/10 text-purple-400 rounded-full flex items-center justify-center mx-auto mb-2">
              <Sparkles size={24} />
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-wide">Meeting Complete: Export & Log Hub</h2>
            <p className="text-slate-400 text-xs">Access your recorded files, transcripts, or email a summary copy.</p>
          </div>

          {/* Meeting details metadata card */}
          <div className="bg-slate-950/50 border border-slate-850 p-5 rounded-2xl space-y-3 font-sans">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest font-mono block">Meeting Title</span>
                <span className="text-sm font-bold text-slate-200">{activeMeeting.title}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">{formattedDate}</span>
            </div>

            <div className="flex items-center space-x-6 text-[10px] text-slate-400 font-medium pt-2 border-t border-slate-900">
              <div>Duration: <strong className="text-slate-200">{durationMin}m {durationSec}s</strong></div>
              <div>Isolated DB: <strong className="text-slate-200 font-mono">{currentUser?.orgId ? 'Organization' : 'Personal'}</strong></div>
            </div>
          </div>

          {/* Action grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Action Card 1: Downloads */}
            <div className="bg-slate-950/30 border border-slate-850 p-5 rounded-2xl space-y-4 text-left">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Local Downloads</h4>
              
              <div className="space-y-2.5">
                <button
                  onClick={handleDownloadAudio}
                  className="w-full flex items-center justify-between bg-slate-900 hover:bg-slate-800 text-slate-200 p-3 rounded-xl text-xs font-bold transition-all border border-slate-850"
                >
                  <span>Download Audio File (.webm)</span>
                  <Download size={14} className="text-purple-400" />
                </button>

                <button
                  onClick={() => handleDownloadTranscript('txt')}
                  className="w-full flex items-center justify-between bg-slate-900 hover:bg-slate-800 text-slate-200 p-3 rounded-xl text-xs font-bold transition-all border border-slate-850"
                >
                  <span>Download Transcript (.txt)</span>
                  <Download size={14} className="text-purple-400" />
                </button>
              </div>
            </div>

            {/* Action Card 2: Email logs */}
            <div className="bg-slate-950/30 border border-slate-850 p-5 rounded-2xl flex flex-col justify-between text-left">
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-2">Cloud Log Emailer</h4>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Send this meeting's full transcript, date/time logs, and generated summary directly to your registered email inbox.
                </p>
              </div>

              {logError && <span className="text-[9px] text-red-400 font-semibold mt-2">{logError}</span>}

              <div className="mt-4">
                {logSent ? (
                  <div className="w-full py-3 bg-emerald-955/20 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold flex items-center justify-center space-x-2">
                    <Check size={14} />
                    <span>Summary Logs Emailed!</span>
                  </div>
                ) : showConfirmEmail ? (
                  <div className="space-y-2">
                    <span className="text-[9px] text-purple-400 font-bold block text-center">Confirm email dispatch?</span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setShowConfirmEmail(false)}
                        className="flex-1 py-2 bg-slate-900 hover:bg-slate-805 text-slate-450 rounded-xl text-xs font-bold"
                        disabled={sendingLog}
                        type="button"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSendLogEmail}
                        className="flex-1 py-2 bg-purple-650 hover:bg-purple-750 text-white rounded-xl text-xs font-bold animate-pulse"
                        disabled={sendingLog}
                        type="button"
                      >
                        {sendingLog ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowConfirmEmail(true)}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-lg shadow-purple-600/10"
                    type="button"
                  >
                    <Mail size={14} />
                    <span>Email Summary Logs</span>
                  </button>
                )}
              </div>

            </div>

          </div>

          <button
            onClick={() => setShowPostMeetingModal(null)}
            className="w-full py-3 bg-slate-950 hover:bg-slate-900 text-slate-400 rounded-xl text-xs font-bold transition-all border border-slate-900 block text-center"
          >
            Go to Meeting Workspace Editor
          </button>
        </div>
      </div>
    );
  };

  // Export DB Backup as JSON
  const handleExportDB = async () => {
    const allMeetings = await db.meetings.toArray();
    const allTranscripts = await db.transcripts.toArray();
    const backup = { meetings: allMeetings, transcripts: allTranscripts };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atlasmeet_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import DB Backup from JSON
  const handleImportDB = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.meetings && data.transcripts) {
          if (confirm('Importing will add these meetings to your local database. Continue?')) {
            for (const meeting of data.meetings) {
              await db.meetings.put(meeting);
            }
            for (const transcript of data.transcripts) {
              await db.transcripts.put(transcript);
            }
            alert('Database imported successfully!');
          }
        } else {
          alert('Invalid backup file structure.');
        }
      } catch (err) {
        alert('Failed to parse backup JSON.');
      }
    };
    reader.readAsText(file);
  };

  if (isSplashActive) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(124,58,237,0.6)] animate-pulse">
            <span className="text-white font-extrabold text-2xl">A</span>
          </div>
          <h1 className="text-white text-3xl font-extrabold tracking-wider animate-fadeIn">
            Atlas<span className="text-purple-500">Meet</span>
          </h1>
          <p className="text-slate-400 text-xs tracking-widest uppercase font-semibold">Web Assistant</p>
          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mt-4"></div>
        </div>
      </div>
    );
  }

  if (viewState === 'documentation') {
    return <Documentation onBack={() => setViewState('homepage')} />;
  }

  if (viewState === 'api') {
    return <DeveloperAPI onBack={() => setViewState('homepage')} />;
  }

  if (viewState === 'support') {
    return <SupportCenter onBack={() => setViewState('homepage')} />;
  }

  if (viewState === 'homepage') {
    return (
      <Homepage 
        onLaunchApp={handleLaunchApp} 
        isAuthenticated={!!authToken} 
        onLogout={handleLogout} 
        currentUser={currentUser} 
        onNavigateToResource={(page) => setViewState(page)}
      />
    );
  }

  if (!authToken) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  if (showAdminConsole) {
    if (currentUser?.orgId) {
      return (
        <OrgDashboard currentUser={currentUser} onClose={() => setShowAdminConsole(false)} />
      );
    } else if (currentUser?.role === 'admin' || currentUser?.role === 'assistant') {
      return (
        <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-gray-800 animate-fadeIn">
          <aside className="w-80 bg-[#0f172a] text-white flex flex-col flex-shrink-0 z-10 border-r border-slate-800 shadow-xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-purple-600 rounded-lg flex items-center justify-center font-bold text-lg shadow-md shadow-purple-600/30">
                  A
                </div>
                <div>
                  <h1 className="font-semibold text-base leading-tight tracking-wide">AtlasMeet</h1>
                  <span className="text-[10px] text-purple-400 font-medium tracking-widest uppercase">Web Assistant</span>
                </div>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col justify-between p-4">
              <div className="space-y-2">
                <button
                  onClick={() => setShowAdminConsole(false)}
                  className="w-full py-2.5 px-4 bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border border-purple-600/30 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all"
                >
                  <ArrowLeft size={14} />
                  <span>Back to Dashboard</span>
                </button>
              </div>
              
              <div className="border-t border-slate-800 pt-4 mt-auto">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-bold text-sm text-white">
                      {currentUser.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">{currentUser.username}</p>
                      <p className="text-[9px] text-purple-400 font-bold uppercase tracking-wider">{currentUser.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                    title="Log Out"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </div>
            </div>
          </aside>
          <AdminDashboard token={authToken || ''} currentUserRole={currentUser?.role || 'user'} onClose={() => setShowAdminConsole(false)} />
        </div>
      );
    }
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f3f4f6] text-gray-800 animate-fadeIn duration-500">
      
      {/* 1. LEFT SIDEBAR */}
      <aside className="w-80 bg-[#0f172a] text-white flex flex-col flex-shrink-0 z-10 border-r border-slate-800 shadow-xl">
        {/* Sidebar Header */}
        <div 
          onClick={() => setViewState('homepage')}
          className="p-6 border-b border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-900/40 transition-colors"
          title="Return to Landing Homepage"
        >
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-purple-600 rounded-lg flex items-center justify-center font-bold text-lg shadow-md shadow-purple-600/30">
              A
            </div>
            <div>
              <h1 className="font-semibold text-base leading-tight tracking-wide">AtlasMeet</h1>
              <span className="text-[10px] text-purple-400 font-medium tracking-widest uppercase">Web Assistant</span>
            </div>
          </div>
          
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors duration-200 text-slate-400 hover:text-white"
            title="Open Settings"
          >
            <SettingsIcon size={18} />
          </button>
        </div>

        {/* Start / Import Meeting Buttons */}
        <div className="p-4 space-y-2">
          <button
            onClick={handleStartMeeting}
            disabled={isRecording || isPostProcessing}
            className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl font-medium shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all duration-300 transform active:scale-[0.98]"
          >
            <Plus size={18} />
            <span>Start New Meeting</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isRecording || isPostProcessing}
            className="w-full py-2.5 px-4 border border-slate-700 hover:border-slate-500 text-slate-355 hover:text-white disabled:opacity-40 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all duration-200"
          >
            <Upload size={14} />
            <span>Import Audio File</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportAudio}
            accept="audio/*"
            className="hidden"
          />
        </div>

        {/* Meeting History List */}
        <div className="flex-1 overflow-y-auto px-3 space-y-2 pb-6">
          <div className="px-3 py-2 text-[11px] font-semibold text-slate-500 tracking-wider uppercase">
            Meeting History
          </div>
          
          {!meetings || meetings.length === 0 ? (
            <div className="text-center py-12 px-4">
              <BookOpen size={36} className="mx-auto text-slate-600 mb-3" />
              <p className="text-xs text-slate-400">No meetings recorded yet.</p>
              <p className="text-[11px] text-slate-500 mt-1">Tap the button above to begin.</p>
            </div>
          ) : (
            meetings.map((m) => {
              const isActive = activeMeetingId === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => {
                    if (!isRecording) setActiveMeetingId(m.id);
                  }}
                  className={`w-full text-left p-3.5 rounded-xl cursor-pointer group flex items-start justify-between transition-all duration-200 ${
                    isActive 
                      ? 'bg-slate-800 text-white shadow-md' 
                      : 'hover:bg-slate-850 text-slate-350 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <h3 className="text-xs font-semibold truncate leading-tight group-hover:text-white">
                      {m.title}
                    </h3>
                    <div className="flex items-center text-[10px] text-slate-500 mt-1.5 space-x-2.5">
                      <span className="flex items-center">
                        <Calendar size={10} className="mr-1" />
                        {new Date(m.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                      {m.duration && (
                        <span className="flex items-center">
                          <Clock size={10} className="mr-1" />
                          {formatTime(m.duration)}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteMeeting(m.id, e)}
                    disabled={isRecording}
                    className="text-slate-600 hover:text-red-400 p-1 rounded-md hover:bg-slate-750 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-0"
                    title="Delete meeting"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* User Profile Info & Logout */}
        {currentUser && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/30 flex-shrink-0 mt-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-bold text-xs text-white">
                  {currentUser.username.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate leading-tight">{currentUser.username}</p>
                  <p className="text-[9px] text-purple-400 font-bold uppercase tracking-wider mt-0.5">{currentUser.role}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                {(currentUser.role === 'admin' || currentUser.role === 'assistant') && (
                  <button
                    onClick={() => setShowAdminConsole(!showAdminConsole)}
                    className={`p-2 rounded-lg transition-colors ${
                      showAdminConsole 
                        ? 'bg-purple-600 text-white' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                    title="Admin Console"
                  >
                    <Layout size={15} />
                  </button>
                )}
                
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                  title="Log Out"
                >
                  <LogOut size={15} />
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-slate-50">
        


        {/* MAIN BODY AREA */}
        {isPostProcessing ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white">
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-purple-600 border-t-transparent animate-spin"></div>
            </div>
            <h2 className="text-xl font-bold text-slate-800">Transcribing audio...</h2>
            <p className="text-sm text-slate-500 mt-2 max-w-md text-center">
              Uploading and processing audio with Whisper Cloud API. This may take a few moments depending on the file size.
            </p>
          </div>
        ) : isRecording ? (
          /* Live Recording View */
          <div className="flex-1 flex flex-col bg-white overflow-hidden p-8">
            <div className="max-w-4xl mx-auto w-full flex flex-col h-full">
              <div className="border-b border-slate-100 pb-6 mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 flex items-center">
                    <Mic className="text-red-500 mr-2 animate-pulse" size={20} />
                    Live Transcript Stream
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Transcribing using browser Web Speech API. Final high-accuracy processing runs when completed.
                  </p>
                </div>
              </div>

              {/* Error Warning Overlay Banner */}
              {recordingError && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4 flex items-start space-x-3.5 text-xs text-red-900 shadow-sm animate-shake flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <AlertCircle className="text-red-650 animate-pulse" size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-red-950">
                      {recordingError === 'no-speech' && 'Sound Not Captured'}
                      {recordingError === 'not-allowed' && 'Microphone Access Blocked'}
                      {recordingError === 'server-offline' && 'Connection / API Error'}
                    </p>
                    <p className="text-red-750 mt-0.5 leading-normal">
                      {recordingError === 'no-speech' && "We haven't detected any audio speech. Make sure your microphone is plugged in, unmuted, and that you are speaking clearly."}
                      {recordingError === 'not-allowed' && "Microphone permissions are denied. Click the microphone/camera icon in the browser address bar to allow permissions."}
                      {recordingError === 'server-offline' && "The translation API or local custom transcription endpoint returned a network or server error. Check your connection."}
                    </p>
                    <button 
                      onClick={() => setRecordingError(null)}
                      className="text-[10px] text-red-700 underline font-bold mt-1.5 hover:text-red-900 block"
                    >
                      Dismiss Warning
                    </button>
                  </div>
                </div>
              )}
 
               {/* Real-time Live Translate Settings */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 mb-6 flex items-center justify-between gap-3 text-xs shadow-sm flex-shrink-0">
                <div className="flex items-center space-x-2.5">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">LIVE TRANSLATE:</span>
                  <select
                    value={liveSourceLang}
                    onChange={(e) => setLiveSourceLang(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 cursor-pointer outline-none font-semibold text-slate-700"
                  >
                    <option value="auto">Auto Detect</option>
                    <option value="English">English</option>
                    <option value="Urdu">Urdu</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Arabic">Arabic</option>
                    <option value="Mandarin">Mandarin</option>
                    <option value="Japanese">Japanese</option>
                    <option value="Tamil">Tamil</option>
                  </select>
                  
                  <span className="text-slate-400 font-bold text-[10px]">⇆</span>
                  
                  <select
                    value={liveTargetLang}
                    onChange={(e) => setLiveTargetLang(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 cursor-pointer outline-none font-semibold text-slate-700"
                  >
                    <option value="Japanese">Japanese</option>
                    <option value="English">English</option>
                    <option value="Urdu">Urdu</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Arabic">Arabic</option>
                    <option value="Mandarin">Mandarin</option>
                    <option value="Tamil">Tamil</option>
                  </select>
                </div>

                <div className="flex items-center space-x-3">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isLiveTranslateEnabled}
                      onChange={(e) => setIsLiveTranslateEnabled(e.target.checked)}
                      className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4 border-slate-300"
                    />
                    <span className="font-semibold text-slate-700">Enable Live Translate</span>
                  </label>
                  
                  {isLiveTranslateEnabled && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                    </span>
                  )}
                </div>
              </div>              {/* Scrolling transcript area */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 font-sans text-sm leading-relaxed text-slate-700 bg-slate-50 rounded-2xl p-6 border border-slate-100">
                {liveTranscripts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center animate-bounce">
                      <Mic size={20} className="text-slate-400" />
                    </div>
                    <p className="text-xs">Start speaking to see transcription stream...</p>
                  </div>
                ) : (
                  liveTranscripts.map((t, idx) => (
                    <div key={idx} className="flex items-start space-x-3 group animate-fadeIn">
                      <span className="text-[10px] text-slate-400 font-mono py-1 block">
                        {formatTime(t.audioStartTime || 0)}
                      </span>
                      <div className="flex-1">
                        <div className="bg-white py-2.5 px-4 rounded-2xl border border-slate-100 shadow-sm inline-block max-w-2xl">
                          {isLiveTranslateEnabled ? (
                            <>
                              <p className="text-purple-700 font-semibold text-sm">
                                {t.translatedText || 'Translating...'}
                              </p>
                              <p className="text-[11px] text-slate-400 mt-1 italic border-t border-slate-100 pt-1">
                                Original ({liveSourceLang}): {t.text}
                              </p>
                            </>
                          ) : (
                            <p className="text-slate-805">{t.text}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Controls card at the bottom */}
              <div className="mt-6 bg-slate-50 border border-slate-100 rounded-2xl p-5 flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className={`w-3.5 h-3.5 rounded-full ${isPaused ? 'bg-amber-500 animate-pulse' : 'bg-red-500 animate-ping'}`} />
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {isPaused ? 'Recording Paused' : 'Recording Audio'}
                    </p>
                    <p className="text-xl font-bold text-slate-800 font-mono mt-0.5">
                      {formatTime(recordingDuration)}
                    </p>
                  </div>
                </div>

                {/* Canvas voice level visualizer */}
                <div className="flex-1 max-w-xs mx-6 flex items-center justify-center">
                  <div className="flex items-end space-x-1.5 h-8 w-44">
                    {[...Array(12)].map((_, i) => {
                      const h = Math.max(10, Math.min(100, audioLevel * (0.3 + Math.random() * 0.7) + (isPaused ? 0 : 5)));
                      return (
                        <div 
                          key={i} 
                          style={{ height: `${isPaused ? 4 : h}%` }}
                          className={`w-2.5 rounded-full transition-all duration-150 ${
                            isPaused ? 'bg-slate-300' : 'bg-gradient-to-t from-indigo-500 to-purple-600'
                          }`}
                        ></div>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handlePauseRecording}
                    className={`px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all duration-200 flex items-center space-x-1.5 transform active:scale-95 ${
                      isPaused 
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                        : 'bg-slate-200 hover:bg-slate-355 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {isPaused ? (
                      <>
                        <Play size={14} className="fill-white" />
                        <span>Resume</span>
                      </>
                    ) : (
                      <>
                        <Pause size={14} className="fill-slate-700" />
                        <span>Pause</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleStopRecording}
                    className="bg-red-500 hover:bg-red-650 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm flex items-center space-x-1.5 transition-all transform active:scale-95"
                  >
                    <Square size={12} className="fill-white" />
                    <span>Stop Recording</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        ) : activeMeetingId ? (
          /* Meeting Details Workspace */
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            
            {/* Details Header */}
            <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0 bg-white">
              <div className="flex-1 min-w-0 pr-4">
                {isEditingTitle ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="border border-slate-350 focus:border-purple-600 outline-none text-lg font-bold px-3 py-1.5 rounded-lg w-full max-w-lg"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveTitle}
                      className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3.5 py-2 rounded-lg font-medium shadow-sm transition-all"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditingTitle(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs px-2 py-2"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <h2 
                    onClick={() => {
                      db.meetings.get(activeMeetingId).then((m) => {
                        if (m) {
                          setEditedTitle(m.title);
                          setIsEditingTitle(true);
                        }
                      });
                    }}
                    className="text-lg font-bold text-slate-800 cursor-pointer hover:bg-slate-50 px-2 py-1 -ml-2 rounded-lg inline-block truncate max-w-xl group relative"
                    title="Click to rename"
                  >
                    {editedTitle || 'Untitled Meeting'}
                    <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 ml-2 transition-opacity font-normal">
                      (rename)
                    </span>
                  </h2>
                )}
                
                {/* Audio Player and Download block */}
                {audioUrl && (
                  <div className="flex items-center space-x-4 mt-3 bg-slate-50 border border-slate-100 py-1.5 px-3 rounded-xl inline-flex shadow-sm max-w-md">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center">
                      <Clock size={12} className="mr-1 text-slate-400" />
                      Playback:
                    </span>
                    <audio 
                      ref={audioRef} 
                      src={audioUrl} 
                      controls 
                      className="h-7 w-52" 
                      onTimeUpdate={(e) => setAudioPlaybackTime(e.currentTarget.currentTime)}
                    />
                    <button
                      onClick={handleDownloadAudio}
                      className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-purple-600 rounded-lg transition-colors"
                      title="Download recorded audio file"
                    >
                      <Download size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Tab Navigation */}
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setActiveTab('transcript')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    activeTab === 'transcript' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Transcript
                </button>
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    activeTab === 'notes' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Notes Editor
                </button>
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    activeTab === 'summary' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  AI Summary
                </button>
              </div>
            </div>

            {/* TAB CONTENTS */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
              <div className="max-w-4xl mx-auto w-full h-full">

                {/* 1. TRANSCRIPT TAB */}
                {activeTab === 'transcript' && (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 min-h-[500px] flex flex-col">
                    
                    {/* Live Translate Block */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 mb-4 flex flex-wrap items-center justify-between gap-3 text-xs flex-shrink-0 shadow-sm">
                      <div className="flex items-center space-x-2.5">
                        <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Live Translate:</span>
                        <select
                          value={sourceLang}
                          onChange={(e) => setSourceLang(e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg px-2 py-1 cursor-pointer outline-none font-semibold text-slate-700"
                        >
                          <option value="auto">Auto Detect</option>
                          <option value="English">English</option>
                          <option value="Urdu">Urdu</option>
                          <option value="Spanish">Spanish</option>
                          <option value="French">French</option>
                          <option value="German">German</option>
                          <option value="Hindi">Hindi</option>
                          <option value="Arabic">Arabic</option>
                          <option value="Mandarin">Mandarin</option>
                          <option value="Japanese">Japanese</option>
                          <option value="Tamil">Tamil</option>
                        </select>
                        
                        <span className="text-slate-400 font-bold">⇄</span>
                        
                        <select
                          value={targetLang}
                          onChange={(e) => setTargetLang(e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg px-2 py-1 cursor-pointer outline-none font-semibold text-slate-700"
                        >
                          <option value="Urdu">Urdu</option>
                          <option value="English">English</option>
                          <option value="Spanish">Spanish</option>
                          <option value="French">French</option>
                          <option value="German">German</option>
                          <option value="Hindi">Hindi</option>
                          <option value="Arabic">Arabic</option>
                          <option value="Mandarin">Mandarin</option>
                          <option value="Japanese">Japanese</option>
                          <option value="Tamil">Tamil</option>
                        </select>
                      </div>

                      <div className="flex items-center space-x-3">
                        <button
                          onClick={handleTranslate}
                          disabled={isTranslating || !activeMeetingTranscripts || activeMeetingTranscripts.length === 0}
                          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold px-4.5 py-2 rounded-xl shadow-md transition-all transform active:scale-95 text-[11px]"
                        >
                          {isTranslating ? 'Translating...' : 'Translate'}
                        </button>
                                               {(translatedTranscripts.length > 0 || (activeMeetingTranscripts || []).some(t => !!t.translatedText)) && (
                          <div className="flex bg-slate-200/60 p-0.5 rounded-lg border border-slate-200">
                            <button
                              onClick={() => setShowTranslation(false)}
                              className={`px-3 py-1.5 rounded-md font-bold transition-all text-[10px] uppercase tracking-wider ${
                                !showTranslation ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              Original
                            </button>
                            <button
                              onClick={() => setShowTranslation(true)}
                              className={`px-3 py-1.5 rounded-md font-bold transition-all text-[10px] uppercase tracking-wider ${
                                showTranslation ? 'bg-white text-slate-855 shadow-sm text-purple-700' : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              Translated
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4 flex-shrink-0">
                      <h3 className="font-bold text-slate-800 text-sm">
                        {showTranslation ? `Meeting Transcript (${targetLang})` : 'Meeting Transcript'}
                      </h3>
                      {activeMeetingTranscripts && activeMeetingTranscripts.length > 0 && (
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => {
                              const currentTranscripts = showTranslation 
                                ? (translatedTranscripts.length > 0 
                                    ? translatedTranscripts 
                                    : (activeMeetingTranscripts || []).map(t => ({ ...t, text: t.translatedText || t.text }))
                                  )
                                : (activeMeetingTranscripts || []);
                              const fullText = currentTranscripts.map(t => `[${formatTime(t.audioStartTime || 0)}] ${t.text}`).join('\n');
                              handleCopy(fullText);
                            }}
                            className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center space-x-1"
                            title="Copy transcript to clipboard"
                          >
                            {copiedText ? <Check size={14} /> : <Copy size={14} />}
                            <span>{copiedText ? 'Copied' : 'Copy All'}</span>
                          </button>
                          
                          <div className="h-4 w-px bg-slate-200" />
                          
                          <button
                            onClick={() => handleDownloadTranscript('txt')}
                            className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center space-x-1"
                            title="Download transcript as Text file"
                          >
                            <Download size={14} />
                            <span>Download TXT</span>
                          </button>

                          <button
                            onClick={() => handleDownloadTranscript('docx')}
                            className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center space-x-1"
                            title="Download transcript as DOCX file"
                          >
                            <Download size={14} />
                            <span>Download DOCX</span>
                          </button>

                           <button
                            onClick={() => handleDownloadTranscript('pdf')}
                            className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center space-x-1"
                            title="Download transcript as PDF file"
                          >
                            <FileText size={14} className="text-purple-600" />
                            <span>Download PDF</span>
                          </button>

                          <div className="h-4 w-px bg-slate-200" />

                          <button
                            onClick={() => {
                              if (activeMeetingId) {
                                const confirmMsg = showTranslation 
                                  ? `Can I send the translated log (${targetLang}), summary, and audio via email to your registered address?`
                                  : 'Can I send the log, summary, and audio via email to your registered address?';
                                if (confirm(confirmMsg)) {
                                  handleSendMeetingLogEmail(activeMeetingId, showTranslation, targetLang);
                                }
                              }
                            }}
                            disabled={emailSendingState[activeMeetingId] === 'sending'}
                            className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center space-x-1 disabled:opacity-50"
                            title="Email summary, audio, and transcript to your registered inbox"
                          >
                            <Mail size={14} className="text-purple-600" />
                            <span>
                              {emailSendingState[activeMeetingId] === 'sending' ? 'Sending...' : 
                               emailSendingState[activeMeetingId] === 'sent' ? 'Emailed ✓' : 
                               emailSendingState[activeMeetingId] === 'error' ? 'Failed ⚠' : 'Send to Mail'}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                      {!activeMeetingTranscripts || activeMeetingTranscripts.length === 0 ? (
                        <div className="text-center py-20 text-slate-400">
                          <AlertCircle size={36} className="mx-auto mb-3 text-slate-350" />
                          <p className="text-xs">No transcripts recorded for this meeting.</p>
                        </div>
                      ) : (
                        (showTranslation 
                          ? (translatedTranscripts.length > 0 
                              ? translatedTranscripts 
                              : (activeMeetingTranscripts || []).map(t => ({ ...t, text: t.translatedText || t.text }))
                            )
                          : (activeMeetingTranscripts || [])
                        ).map((t, idx) => {
                          const isCurrentSegment = audioPlaybackTime >= (t.audioStartTime || 0) && audioPlaybackTime < (t.audioEndTime || (t.audioStartTime || 0) + 5);
                          return (
                            <div 
                              key={idx} 
                              onClick={() => {
                                if (audioRef.current && typeof t.audioStartTime === 'number') {
                                  audioRef.current.currentTime = t.audioStartTime;
                                  audioRef.current.play().catch(() => {});
                                }
                              }}
                              className="flex items-start space-x-4 group cursor-pointer"
                              title="Click to jump audio playback here"
                            >
                              <span className="text-[10px] text-slate-400 font-mono py-1 block flex-shrink-0 w-16">
                                {formatTime(t.audioStartTime || 0)}
                              </span>
                              <div className="flex-1">
                                <p 
                                  className={`text-sm leading-relaxed py-2.5 px-4 rounded-xl border transition-all duration-300 ${
                                    isCurrentSegment 
                                      ? 'bg-purple-100 text-purple-950 border-purple-300 font-medium scale-[1.01] shadow-sm shadow-purple-100/50' 
                                      : 'bg-slate-50 text-slate-700 border-slate-100 group-hover:bg-slate-100 group-hover:border-purple-200'
                                  }`}
                                >
                                  {t.text}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* 2. NOTES TAB */}
                {activeTab === 'notes' && (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 min-h-[500px] flex flex-col h-full">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                      <h3 className="font-bold text-slate-800 text-sm">Personal Notes</h3>
                      <span className="text-[10px] text-slate-400 italic">Auto-saves to IndexedDB</span>
                    </div>
                    <textarea
                      value={activeMeetingNotes}
                      onChange={(e) => handleNotesChange(e.target.value)}
                      placeholder="Type your notes or copy summary here... (supports Markdown format)"
                      className="flex-1 w-full min-h-[400px] outline-none text-sm text-slate-700 leading-relaxed border border-slate-100 rounded-xl p-4 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all font-sans resize-none"
                    />
                  </div>
                )}

                {/* 3. SUMMARY TAB */}
                {activeTab === 'summary' && (
                  <div className="space-y-6">
                    {/* Trigger controls */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h3 className="font-bold text-slate-800 text-sm">AI Summary Generator</h3>
                        <p className="text-xs text-slate-400">
                          Summarize with {summaryProvider.toUpperCase()} / {summaryProvider === 'ollama' ? ollamaModel : summaryProvider === 'gemini' ? geminiModel : summaryProvider === 'openai' ? openaiModel : groqModel}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <select
                          value={selectedTemplate}
                          onChange={(e) => setSelectedTemplate(e.target.value as SummaryTemplate)}
                          className="bg-slate-50 border border-slate-200 outline-none text-xs rounded-xl px-3 py-2.5 font-semibold text-slate-650 cursor-pointer"
                        >
                          <option value="minutes">Detailed Minutes</option>
                          <option value="action_items">Action Items</option>
                          <option value="executive">Executive Summary</option>
                        </select>

                        <button
                          onClick={handleGenerateSummary}
                          disabled={isGeneratingSummary || !activeMeetingTranscripts || activeMeetingTranscripts.length === 0}
                          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-md flex items-center space-x-1.5 transition-all transform active:scale-95"
                        >
                          <Sparkles size={14} />
                          <span>{isGeneratingSummary ? 'Summarizing...' : 'Generate'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Summary content display */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 min-h-[400px] flex flex-col">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4 flex-shrink-0">
                        <h4 className="font-bold text-slate-800 text-sm">Generated Markdown</h4>
                        {activeMeetingSummary && (
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleCopy(activeMeetingSummary)}
                              className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center space-x-1"
                            >
                              {copiedText ? <Check size={14} /> : <Copy size={14} />}
                              <span>{copiedText ? 'Copied' : 'Copy'}</span>
                            </button>
                            <button
                              onClick={() => handleDownloadSummary('docx')}
                              className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center space-x-1"
                              title="Download summary as DOCX file"
                            >
                              <Download size={14} />
                              <span>Download DOCX</span>
                            </button>
                            <button
                              onClick={() => handleDownloadSummary('pdf')}
                              className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center space-x-1"
                              title="Download summary as PDF file"
                            >
                              <FileText size={14} className="text-purple-600" />
                              <span>Download PDF</span>
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 overflow-y-auto">
                        {isGeneratingSummary ? (
                          <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
                            <div className="relative w-12 h-12">
                              <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                              <div className="absolute inset-0 rounded-full border-4 border-purple-600 border-t-transparent animate-spin"></div>
                            </div>
                            <p className="text-xs">Consulting AI model. Please stand by...</p>
                          </div>
                        ) : activeMeetingSummary ? (
                          /* Markdown Reader */
                          <div className="prose prose-sm prose-purple max-w-none text-slate-700 text-sm leading-relaxed whitespace-pre-line font-sans">
                            {activeMeetingSummary}
                          </div>
                        ) : (
                          <div className="text-center py-20 text-slate-400">
                            <Sparkles size={36} className="mx-auto mb-3 text-slate-350" />
                            <p className="text-xs">No summary generated yet.</p>
                            <p className="text-[11px] text-slate-500 mt-1">Choose a template above and click Generate.</p>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                )}

              </div>
            </div>

          </div>
        ) : (
          /* Empty State Welcome */
          <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white text-center animate-fadeIn">
            <div className="w-20 h-20 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-purple-100">
              <Mic className="text-purple-600 animate-pulse" size={36} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Welcome to AtlasMeet!</h2>
            <p className="text-slate-500 mt-2 max-w-md text-sm leading-relaxed">
              Record meetings, obtain real-time drafts, and process summaries offline or via high-accuracy cloud models. All stored locally in your browser's IndexedDB.
            </p>

            {/* Mic Check Guideline Banner */}
            <div className="mt-4 mb-6 p-4 bg-purple-50/50 border border-purple-100 rounded-2xl flex items-center space-x-3.5 max-w-sm text-left animate-fadeIn">
              <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-purple-100/80 shrink-0">
                <span className="absolute animate-ping inline-flex h-full w-full rounded-full bg-purple-400 opacity-25"></span>
                <Mic className="text-purple-655" size={16} />
              </div>
              <div>
                <h4 className="font-bold text-[10px] text-purple-950 uppercase tracking-wider">Mic Check Guide</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                  Make sure your microphone is connected. Click **Start Your First Meeting** below to start transcribing!
                </p>
              </div>
            </div>
            <button
              onClick={handleStartMeeting}
              className="mt-6 py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium shadow-md shadow-purple-600/20 flex items-center space-x-2 transition-all"
            >
              <Plus size={16} />
              <span>Start Your First Meeting</span>
            </button>
          </div>
        )}
      </main>

      {/* 3. SETTINGS MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] border border-slate-100 overflow-hidden transform scale-100 transition-all duration-300">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <SettingsIcon className="text-slate-700" size={18} />
                <h3 className="font-bold text-slate-800 text-base">Assistant Settings</h3>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 hover:bg-slate-200/50 rounded-lg text-sm"
              >
                Close
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm">
              
              {/* User Profile Settings */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-850 flex items-center">
                  <BookOpen size={16} className="mr-1.5 text-purple-600" />
                  User Profile Settings
                </h4>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Your Name (for export headers)</label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={userName}
                    onChange={(e) => {
                      setUserName(e.target.value);
                      saveSetting('userName', e.target.value);
                    }}
                    className="w-full border border-slate-200 outline-none focus:border-purple-600 rounded-lg p-2 text-xs"
                  />
                </div>
              </div>
              
              {/* Transcription Service settings */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-850 flex items-center">
                  <Mic size={16} className="mr-1.5 text-purple-600" />
                  Transcription Engine
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'webspeech', label: 'Web Speech API', desc: 'Free & Local' },
                    { id: 'nvidia', label: 'NVIDIA NIM API', desc: 'Fast Cloud' },
                    { id: 'groq', label: 'Groq Whisper', desc: 'Fast Cloud' },
                    { id: 'openai', label: 'OpenAI Whisper', desc: 'Accurate Cloud' },
                    { id: 'custom', label: 'Custom Local Server', desc: 'NeMo Parakeet / Local Whisper' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setTranscribeProvider(p.id as any);
                        saveSetting('transcribeProvider', p.id);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        transcribeProvider === p.id 
                          ? 'border-purple-600 bg-purple-50/50 text-purple-900 ring-1 ring-purple-600' 
                          : 'border-slate-200 hover:border-slate-350'
                      }`}
                    >
                      <span className="block font-semibold text-xs">{p.label}</span>
                      <span className="text-[10px] text-slate-400 mt-1 block">{p.desc}</span>
                    </button>
                  ))}
                </div>

                {transcribeProvider === 'custom' && (
                  <div className="mt-3 space-y-1 bg-slate-50 border border-slate-100 p-3 rounded-xl animate-fadeIn">
                    <label className="block text-xs font-semibold text-slate-655 mb-1">
                      Local Transcribe API Endpoint
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="e.g. http://localhost:8000/v1/audio/transcriptions"
                        value={transcribeCustomEndpoint}
                        onChange={(e) => {
                          setTranscribeCustomEndpoint(e.target.value);
                          saveSetting('transcribeCustomEndpoint', e.target.value);
                          setEndpointTestResult({ status: null, message: '' });
                        }}
                        className="flex-1 border border-slate-200 outline-none focus:border-purple-600 rounded-lg p-2 text-xs"
                      />
                      <button
                        onClick={testLocalEndpoint}
                        disabled={testingEndpoint || !transcribeCustomEndpoint}
                        className="bg-purple-650 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold px-3 py-2 rounded-lg text-xs transition-colors shrink-0"
                      >
                        {testingEndpoint ? 'Testing...' : 'Test Connection'}
                      </button>
                    </div>
                    {endpointTestResult.message && (
                      <p className={`text-[10px] font-semibold mt-2 ${
                        endpointTestResult.status === 'success' ? 'text-emerald-600' : 'text-red-500'
                      }`}>
                        {endpointTestResult.message}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-400 mt-2 leading-normal">
                      Specify an OpenAI-compatible audio transcription endpoint (e.g. a local FastAPI wrapper running NVIDIA NeMo parakeet-tdt-0.6b-v3).
                    </p>
                  </div>
                )}
              </div>

              {/* Summary Provider settings */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-850 flex items-center">
                  <Sparkles size={16} className="mr-1.5 text-purple-600" />
                  AI Summary Provider
                </h4>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { id: 'gemini', label: 'Gemini' },
                    { id: 'openai', label: 'OpenAI' },
                    { id: 'groq', label: 'Groq' },
                    { id: 'nvidia', label: 'Nvidia' },
                    { id: 'ollama', label: 'Ollama' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSummaryProvider(p.id as any);
                        saveSetting('summaryProvider', p.id);
                      }}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        summaryProvider === p.id 
                          ? 'border-purple-600 bg-purple-50/50 text-purple-900 ring-1 ring-purple-600' 
                          : 'border-slate-200 hover:border-slate-350'
                      }`}
                    >
                      <span className="block font-semibold text-xs">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* API Credentials */}
              <div className="space-y-4 border-t border-slate-100 pt-4">
                <h4 className="font-bold text-slate-850 flex items-center">
                  <Key size={16} className="mr-1.5 text-purple-600" />
                  API Credentials & Models
                </h4>
                
                {/* Conditionally show inputs */}
                {summaryProvider === 'gemini' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Gemini API Key</label>
                      <input
                        type="password"
                        placeholder="AIzaSy..."
                        value={geminiKey}
                        onChange={(e) => {
                          setGeminiKey(e.target.value);
                          saveSetting('geminiKey', e.target.value);
                        }}
                        className="w-full border border-slate-200 outline-none focus:border-purple-600 rounded-lg p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Gemini Model</label>
                      <input
                        type="text"
                        value={geminiModel}
                        onChange={(e) => {
                          setGeminiModel(e.target.value);
                          saveSetting('geminiModel', e.target.value);
                        }}
                        className="w-full border border-slate-200 outline-none focus:border-purple-600 rounded-lg p-2 text-xs"
                      />
                    </div>
                  </div>
                )}

                {(summaryProvider === 'openai' || transcribeProvider === 'openai') && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">OpenAI API Key</label>
                      <input
                        type="password"
                        placeholder="sk-..."
                        value={openaiKey}
                        onChange={(e) => {
                          setOpenaiKey(e.target.value);
                          saveSetting('openaiKey', e.target.value);
                        }}
                        className="w-full border border-slate-200 outline-none focus:border-purple-600 rounded-lg p-2 text-xs"
                      />
                    </div>
                    {summaryProvider === 'openai' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">OpenAI Chat Model</label>
                        <input
                          type="text"
                          value={openaiModel}
                          onChange={(e) => {
                            setOpenaiModel(e.target.value);
                            saveSetting('openaiModel', e.target.value);
                          }}
                          className="w-full border border-slate-200 outline-none focus:border-purple-600 rounded-lg p-2 text-xs"
                        />
                      </div>
                    )}
                  </div>
                )}

                {(summaryProvider === 'groq' || transcribeProvider === 'groq') && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Groq API Key</label>
                      <input
                        type="password"
                        placeholder="gsk_..."
                        value={groqKey}
                        onChange={(e) => {
                          setGroqKey(e.target.value);
                          saveSetting('groqKey', e.target.value);
                        }}
                        className="w-full border border-slate-200 outline-none focus:border-purple-600 rounded-lg p-2 text-xs"
                      />
                    </div>
                    {summaryProvider === 'groq' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Groq Chat Model</label>
                        <input
                          type="text"
                          value={groqModel}
                          onChange={(e) => {
                            setGroqModel(e.target.value);
                            saveSetting('groqModel', e.target.value);
                          }}
                          className="w-full border border-slate-200 outline-none focus:border-purple-600 rounded-lg p-2 text-xs"
                        />
                      </div>
                    )}
                    {transcribeProvider === 'groq' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Groq Whisper Model</label>
                        <select
                          value={groqModel}
                          onChange={(e) => {
                            setGroqModel(e.target.value);
                            saveSetting('groqModel', e.target.value);
                          }}
                          className="w-full bg-white border border-slate-200 outline-none focus:border-purple-600 rounded-lg p-2 text-xs"
                        >
                          <option value="whisper-large-v3-turbo">whisper-large-v3-turbo (Recommended)</option>
                          <option value="whisper-large-v3">whisper-large-v3</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {(summaryProvider === 'nvidia' || transcribeProvider === 'nvidia') && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">NVIDIA NIM API Key</label>
                      <input
                        type="password"
                        placeholder={serverConfig?.hasNvidiaKey ? "Configured on server via .env" : "nvapi-..."}
                        value={nvidiaKey}
                        onChange={(e) => {
                          setNvidiaKey(e.target.value);
                          saveSetting('nvidiaKey', e.target.value);
                        }}
                        className="w-full border border-slate-200 outline-none focus:border-purple-600 rounded-lg p-2 text-xs"
                      />
                    </div>
                    {summaryProvider === 'nvidia' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">NVIDIA NIM Chat Model</label>
                        <input
                          type="text"
                          value={nvidiaModel}
                          onChange={(e) => {
                            setNvidiaModel(e.target.value);
                            saveSetting('nvidiaModel', e.target.value);
                          }}
                          className="w-full border border-slate-200 outline-none focus:border-purple-600 rounded-lg p-2 text-xs"
                        />
                      </div>
                    )}
                  </div>
                )}

                {summaryProvider === 'ollama' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Ollama Local Endpoint</label>
                      <input
                        type="text"
                        value={ollamaEndpoint}
                        onChange={(e) => {
                          setOllamaEndpoint(e.target.value);
                          saveSetting('ollamaEndpoint', e.target.value);
                        }}
                        className="w-full border border-slate-200 outline-none focus:border-purple-600 rounded-lg p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Ollama Model</label>
                      <input
                        type="text"
                        placeholder="gemma2:2b"
                        value={ollamaModel}
                        onChange={(e) => {
                          setOllamaModel(e.target.value);
                          saveSetting('ollamaModel', e.target.value);
                        }}
                        className="w-full border border-slate-200 outline-none focus:border-purple-600 rounded-lg p-2 text-xs"
                      />
                    </div>
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-[11px] text-amber-800 space-y-1 leading-normal">
                      <p className="font-semibold">⚠️ Ollama CORS Configuration Required</p>
                      <p>For your browser to speak directly to Ollama, you must configure it to allow web requests. Close Ollama completely, then launch it from terminal setting the origins: </p>
                      <code className="block bg-amber-100 p-1.5 rounded font-mono mt-1 select-all text-amber-900">
                        OLLAMA_ORIGINS="*" ollama serve
                      </code>
                    </div>
                  </div>
                )}
              </div>

              {/* Database & backup utilities */}
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <h4 className="font-bold text-slate-850 flex items-center">
                  <Database size={16} className="mr-1.5 text-purple-600" />
                  Database Tools
                </h4>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleExportDB}
                    className="flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all"
                  >
                    <Download size={12} />
                    <span>Backup Database</span>
                  </button>

                  <label className="flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all">
                    <Upload size={12} />
                    <span>Restore Database</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportDB}
                      className="hidden"
                    />
                  </label>

                  <button
                    onClick={async () => {
                      if (confirm('DANGER: This will delete ALL meetings and transcripts from IndexedDB. Continue?')) {
                        await db.meetings.clear();
                        await db.transcripts.clear();
                        setActiveMeetingId(null);
                        alert('IndexedDB reset successfully.');
                      }
                    }}
                    className="flex items-center space-x-1 hover:bg-red-50 text-red-500 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ml-auto"
                  >
                    <Trash2 size={12} />
                    <span>Clear Data</span>
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {renderPostMeetingModal()}
    </div>
  );
}

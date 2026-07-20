import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { 
  Database, 
  Languages, 
  Sparkles, 
  ChevronRight, 
  Play, 
  Check, 
  Lock, 
  Activity, 
  ChevronDown, 
  ArrowRight,
  TrendingUp,
  Globe,
  Award
} from 'lucide-react';

interface HomepageProps {
  onLaunchApp: () => void;
  isAuthenticated: boolean;
  onLogout: () => void;
  currentUser: { username: string; role: string } | null;
  onNavigateToResource?: (page: 'documentation' | 'api' | 'support') => void;
}

/**
 * Reusable Spotlight Card Component
 * Combines 3D Tilt perspective, real-time mouse-spotlight radial gradient,
 * and Framer Motion spring scaling.
 */
function SpotlightCard({ 
  children, 
  className = '', 
  rotateX = 2, 
  rotateY = -2, 
  scale = 1.02 
}: { 
  children: React.ReactNode; 
  className?: string; 
  rotateX?: number; 
  rotateY?: number; 
  scale?: number; 
}) {
  const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMouseCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ 
        scale, 
        rotateX, 
        rotateY,
        borderColor: 'rgba(168, 85, 247, 0.4)',
        boxShadow: "0px 20px 40px rgba(124, 58, 237, 0.1)"
      }}
      className={`relative overflow-hidden rounded-3xl border border-slate-900 bg-slate-950/40 p-6 transition-all duration-300 ${className}`}
      style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
    >
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(350px circle at ${mouseCoords.x}px ${mouseCoords.y}px, rgba(139, 92, 246, 0.08), transparent 80%)`,
        }}
      />
      {children}
    </motion.div>
  );
}

export default function Homepage({ onLaunchApp, isAuthenticated, onLogout, currentUser, onNavigateToResource }: HomepageProps) {
  // 1. Scroll Progress Bar Configuration
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // 2. Headline Mouse Spotlight Tracking
  const [headlineMouse, setHeadlineMouse] = useState({ x: 0, y: 0 });
  const [isHeadlineHovered, setIsHeadlineHovered] = useState(false);
  const headlineRef = useRef<HTMLHeadingElement>(null);

  const handleHeadlineMouseMove = (e: React.MouseEvent<HTMLHeadingElement>) => {
    if (!headlineRef.current) return;
    const rect = headlineRef.current.getBoundingClientRect();
    setHeadlineMouse({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  // 3. Typewriter cycles
  const words = ["Live Transcription", "AI Meeting Minutes", "Real-Time Translation", "Speaker Diarization", "Enterprise Security"];
  const [wordIdx, setWordIdx] = useState(0);
  const [subIdx, setSubIdx] = useState(0);
  const [reverse, setReverse] = useState(false);

  useEffect(() => {
    if (subIdx === words[wordIdx].length + 1 && !reverse) {
      const timeout = setTimeout(() => setReverse(true), 2000);
      return () => clearTimeout(timeout);
    }

    if (subIdx === 0 && reverse) {
      setReverse(false);
      setWordIdx((prev) => (prev + 1) % words.length);
      return;
    }

    const timeout = setTimeout(() => {
      setSubIdx((prev) => prev + (reverse ? -1 : 1));
    }, reverse ? 30 : 60);

    return () => clearTimeout(timeout);
  }, [subIdx, wordIdx, reverse]);

  // 4. Interactive displays
  const [activeDemoTab, setActiveDemoTab] = useState<'transcript' | 'summary' | 'logs'>('transcript');
  const [activeShowcaseTab, setActiveShowcaseTab] = useState<'editor' | 'history'>('editor');
  const [expandedFeature, setExpandedFeature] = useState<number | null>(null);

  // How it works pipeline state
  const [activeStep, setActiveStep] = useState(0);
  const [autoplayTimeline, setAutoplayTimeline] = useState(true);

  useEffect(() => {
    if (!autoplayTimeline) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 5);
    }, 4500);
    return () => clearInterval(interval);
  }, [autoplayTimeline]);

  const eqBars = Array.from({ length: 36 });
  
  // Real language catalog supported by AtlasMeet API
  const supportedLanguages = [
    { name: 'English', code: 'EN', flag: '🇬🇧' },
    { name: 'Urdu', code: 'UR', flag: '🇵🇰' },
    { name: 'Spanish', code: 'ES', flag: '🇪🇸' },
    { name: 'French', code: 'FR', flag: '🇫🇷' },
    { name: 'German', code: 'DE', flag: '🇩🇪' },
    { name: 'Hindi', code: 'HI', flag: '🇮🇳' },
    { name: 'Arabic', code: 'AR', flag: '🇸🇦' },
    { name: 'Mandarin', code: 'ZH', flag: '🇨🇳' },
    { name: 'Japanese', code: 'JA', flag: '🇯🇵' },
    { name: 'Tamil', code: 'TA', flag: '🇱🇰' }
  ];

  const auditLogs = [
    { time: '18:43:02', type: 'SEC_INIT', msg: 'Isolated Dexie instance generated for active user.' },
    { time: '18:43:02', type: 'DB_SEC', msg: 'AtlasMeetDB_user established. Dynamic namespace locked.' },
    { time: '18:43:05', type: 'SMTP_SOC', msg: 'SMTP handshake successful with smtp.gmail.com:587.' },
    { time: '18:43:05', type: 'OTP_DISP', msg: '2FA authentication OTP successfully dispatched.' },
    { time: '18:43:09', type: 'AUTH_COMP', msg: 'JWT token validation completed. Isolated session active.' }
  ];

  // Sticky Scroll Storytelling steps
  const stickyStory = [
    {
      title: "Isolated Identity",
      tagline: "Your credentials, encrypted locally",
      desc: "Every login creates a sandboxed browser profile. Credentials and reset requests are routed locally inside localStorage registers, gated by secure SMTP 2-step logins.",
      indicator: "1"
    },
    {
      title: "Dynamic Segregation",
      tagline: "Data remains strictly on-device",
      desc: "Logging in calls switchUserDatabase() which instantly allocates a dedicated SQLite-powered Dexie IndexedDB named AtlasMeetDB_<username>. One client cannot view another user's reports.",
      indicator: "2"
    },
    {
      title: "Confidentiality Audit",
      tagline: "Zero data transit to public clouds",
      desc: "Meeting speech, transcripts, summaries, and edits are stored entirely on the device. No servers harvest your data to train cloud models.",
      indicator: "3"
    }
  ];

  // Framer Motion parent container variants for staggered children reveals
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans overflow-x-hidden selection:bg-purple-650/30 selection:text-purple-300 relative">
      
      {/* Scroll Progress Indicator Bar */}
      <motion.div 
        style={{ scaleX }}
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 origin-left z-50 shadow-[0_0_10px_rgba(139,92,246,0.5)]" 
      />

      {/* Aurora Background Floating Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-purple-900/10 blur-[130px]"
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.05, 1]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute -top-[10%] -right-[5%] w-[60%] h-[60%] rounded-full bg-indigo-900/10 blur-[130px]"
          animate={{
            x: [0, -40, 0],
            y: [0, 40, 0],
            scale: [1, 1.08, 1]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Navigation Header */}
      <nav className="border-b border-slate-900/60 bg-[#020617]/85 backdrop-blur-xl sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3 group cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center font-extrabold text-lg shadow-lg shadow-purple-600/25 transition-transform duration-300 group-hover:scale-105">
              A
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
                Atlas<span className="text-purple-500">Meet</span>
              </span>
              <span className="text-[9px] bg-purple-950/50 text-purple-400 border border-purple-900/50 px-2 py-0.5 rounded-full font-bold uppercase ml-2 tracking-widest">
                v2.0
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated && currentUser ? (
              <div className="flex items-center space-x-3 bg-slate-950/80 border border-slate-800/80 px-4 py-2 rounded-2xl text-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-slate-400 font-semibold tracking-wider">{currentUser.username}</span>
                <button 
                  onClick={onLogout}
                  className="text-red-400 hover:text-red-300 font-bold ml-2 border-l border-slate-800 pl-2 transition-colors duration-200 outline-none"
                >
                  Logout
                </button>
              </div>
            ) : null}
            
            <button
              onClick={onLaunchApp}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/30 flex items-center space-x-2 transition-all transform hover:scale-[1.02]"
            >
              <span>{isAuthenticated ? 'Enter Console' : 'Launch Workspace'}</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto text-center space-y-8 relative z-10">
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center space-x-2.5 bg-slate-950/60 border border-slate-800/80 px-4 py-1.5 rounded-full text-xs text-purple-300 font-semibold uppercase tracking-widest shadow-md"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            <span>Enterprise-grade local AI</span>
          </motion.div>

          {/* Mouse-following spotlight text */}
          <h1 
            ref={headlineRef}
            onMouseMove={handleHeadlineMouseMove}
            onMouseEnter={() => setIsHeadlineHovered(true)}
            onMouseLeave={() => setIsHeadlineHovered(false)}
            className="text-4xl md:text-7xl font-black tracking-tight leading-[1.08] cursor-default select-none"
            style={{
              backgroundImage: isHeadlineHovered 
                ? `radial-gradient(circle 140px at ${headlineMouse.x}px ${headlineMouse.y}px, #c084fc 0%, #818cf8 50%, #ffffff 100%)`
                : 'linear-gradient(to right, #ffffff, #94a3b8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              transition: 'background-image 0.1s ease',
            }}
          >
            Secure, Privacy-First <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400">
              {words[wordIdx].substring(0, subIdx)}
            </span>
            <span className="animate-pulse text-purple-500">|</span>
          </h1>

          <p className="text-slate-400 text-sm md:text-lg max-w-3xl mx-auto leading-relaxed">
            AtlasMeet is the leading client-side meeting intelligence platform designed for regulated industries. Transcribe conversations, translate dialogues, and summarize sessions completely offline, backed by Gmail SMTP 2FA security.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={onLaunchApp}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-2xl shadow-purple-600/20 flex items-center justify-center space-x-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>{isAuthenticated ? 'Open Meeting Console' : 'Access Workspace'}</span>
              <ChevronRight size={16} />
            </button>
            <a
              href="#sandbox"
              className="w-full sm:w-auto px-8 py-4 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all"
            >
              <Play size={14} className="fill-slate-300" />
              <span>Explore Live Sandbox</span>
            </a>
          </div>

          {/* Audio Waveform Animation */}
          <div className="flex items-end justify-center space-x-1.5 h-24 opacity-20 pointer-events-none pt-12">
            {eqBars.map((_, i) => (
              <motion.div
                key={i}
                className="w-1.5 bg-gradient-to-t from-purple-600 via-indigo-500 to-transparent rounded-full"
                animate={{
                  height: [8, Math.random() * 80 + 8, 8],
                }}
                transition={{
                  duration: 1.1 + Math.random() * 0.9,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>

        </div>
      </section>

      {/* Sandbox Section */}
      <section id="sandbox" className="px-6 py-12 max-w-5xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="bg-slate-950/90 border border-slate-800/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl relative"
        >
          <div className="absolute top-4 left-6 flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          </div>
          
          <div className="text-center pb-6 border-b border-slate-900 text-[10px] text-slate-500 uppercase tracking-widest font-extrabold flex items-center justify-center space-x-2">
            <Activity size={12} className="text-purple-500 animate-pulse" />
            <span>Interactive sandbox terminal</span>
          </div>

          {/* Tabs header */}
          <div className="flex justify-center space-x-2 mt-6">
            <button
              onClick={() => setActiveDemoTab('transcript')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeDemoTab === 'transcript'
                  ? 'bg-purple-600/10 border border-purple-500/20 text-purple-400 shadow-md'
                  : 'text-slate-500 hover:text-slate-350 hover:bg-slate-900/50'
              }`}
            >
              🎙️ Live Transcript
            </button>
            <button
              onClick={() => setActiveDemoTab('summary')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeDemoTab === 'summary'
                  ? 'bg-purple-600/10 border border-purple-500/20 text-purple-400 shadow-md'
                  : 'text-slate-500 hover:text-slate-350 hover:bg-slate-900/50'
              }`}
            >
              🧠 AI Summary & Actions
            </button>
            <button
              onClick={() => setActiveDemoTab('logs')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeDemoTab === 'logs'
                  ? 'bg-purple-600/10 border border-purple-500/20 text-purple-400 shadow-md'
                  : 'text-slate-500 hover:text-slate-350 hover:bg-slate-900/50'
              }`}
            >
              🔒 Security Audit Logs
            </button>
          </div>

          <div className="mt-8 min-h-[220px] bg-slate-950 border border-slate-900 rounded-2xl p-6 flex flex-col justify-center">
            <AnimatePresence mode="wait">
              {activeDemoTab === 'transcript' && (
                <motion.div
                  key="transcript"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4 text-xs md:text-sm leading-relaxed"
                >
                  <div className="flex items-start space-x-2">
                    <span className="text-purple-400 font-bold tracking-wide shrink-0">CEO [Sandeep]:</span>
                    <p className="text-slate-300">Welcome to the AtlasMeet Review. All transcripts are generated locally on the CPU.</p>
                  </div>
                  <div className="flex items-start space-x-2 border-l-2 border-slate-800 pl-4 py-1">
                    <span className="text-indigo-400 text-xs tracking-wider uppercase font-bold shrink-0">ES Translation:</span>
                    <p className="text-slate-400 text-xs italic">Bienvenido a la Revisión de AtlasMeet. Todos los transcritos se generan localmente en la CPU.</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-purple-400 font-bold tracking-wide shrink-0">CTO [Leo]:</span>
                    <p className="text-slate-300">Offline Whisper core loaded. Database switcher active for total user-data segregation.</p>
                  </div>
                </motion.div>
              )}

              {activeDemoTab === 'summary' && (
                <motion.div
                  key="summary"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4 text-xs md:text-sm"
                >
                  <div className="bg-slate-900/50 p-4 border border-slate-850/80 rounded-xl space-y-2">
                    <span className="font-extrabold text-[10px] text-purple-400 uppercase tracking-widest flex items-center">
                      <Sparkles size={12} className="mr-1" />
                      Executive Summary
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      AtlasMeet provides completely local meeting intelligence. Data remains in the browser profile using username-isolated IndexedDB database names.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="font-extrabold text-[10px] text-slate-500 uppercase tracking-widest">Action Items</span>
                    <ul className="space-y-1.5 text-slate-400">
                      <li className="flex items-center"><Check size={14} className="text-purple-500 mr-2 shrink-0" /> Confirm SMTP Gmail 2FA handshake.</li>
                      <li className="flex items-center"><Check size={14} className="text-purple-500 mr-2 shrink-0" /> Verify zero network traffic on meeting save.</li>
                    </ul>
                  </div>
                </motion.div>
              )}

              {activeDemoTab === 'logs' && (
                <motion.div
                  key="logs"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-2.5 font-mono text-[11px]"
                >
                  {auditLogs.map((log, i) => (
                    <div key={i} className="flex items-center justify-between text-slate-400 border-b border-slate-900/60 pb-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-600">[{log.time}]</span>
                        <span className="text-purple-400 font-bold uppercase">{log.type}:</span>
                        <span>{log.msg}</span>
                      </div>
                      <span className="text-[9px] bg-slate-900 text-emerald-400 border border-slate-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">OK</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </section>

      {/* Bento Grid layout for Features using Spotlight Cards */}
      <section className="max-w-6xl mx-auto px-6 py-20 space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight animate-fadeIn">The AtlasMeet Bento Workspace</h2>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Privacy-First Architecture</p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Card 1: Col-span-2 spotlight card */}
          <SpotlightCard className="md:col-span-2 min-h-[280px] flex flex-col justify-between">
            <div className="space-y-3 relative z-10">
              <span className="p-2.5 rounded-xl bg-purple-500/10 inline-block"><Database className="text-purple-400" size={20} /></span>
              <h3 className="text-xl font-bold text-slate-100">Isolated Local SQLite-indexedDB</h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-lg">
                Unlike cloud assistants that harvest conversation details to train centralized models, AtlasMeet initializes a dynamically namespaced browser storage pipeline named `AtlasMeetDB_&lt;username&gt;`. Data remains 105% on your device.
              </p>
            </div>
            <div className="relative z-10 flex items-center space-x-2 text-[10px] text-purple-400 font-mono tracking-widest uppercase pt-6">
              <span>Dynamic Segregation Gated</span>
              <span>&bull;</span>
              <span>AES-256 Storage</span>
            </div>
          </SpotlightCard>

          {/* Card 2: Col-span-1 spotlight card */}
          <SpotlightCard className="min-h-[280px] flex flex-col justify-between">
            <div className="space-y-3 relative z-10">
              <span className="p-2.5 rounded-xl bg-indigo-500/10 inline-block"><Globe className="text-indigo-400" size={20} /></span>
              <h3 className="text-lg font-bold text-slate-100">Dynamic Language Registry</h3>
              <p className="text-xs text-slate-450 leading-relaxed">
                Seamless real-time translation and transcript synchronization for 10 active languages:
              </p>
            </div>

            <div className="grid grid-cols-5 gap-2 pt-4 relative z-10">
              {supportedLanguages.map((lang, idx) => (
                <div 
                  key={idx} 
                  className="bg-slate-950/80 border border-slate-900 p-2 rounded-xl text-center group cursor-help hover:border-purple-500/40 transition-colors"
                  title={`${lang.name} translation supported`}
                >
                  <span className="text-sm block">{lang.flag}</span>
                  <span className="text-[8px] font-mono font-bold text-slate-500 group-hover:text-purple-400 mt-1 block uppercase">{lang.code}</span>
                </div>
              ))}
            </div>
          </SpotlightCard>

        </motion.div>
      </section>

      {/* Redesigned How It Works Process */}
      <section id="timeline" className="max-w-6xl mx-auto px-6 py-24 space-y-16">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight">How AtlasMeet Works</h2>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Interactive offline pipeline</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left selectors list */}
          <div className="lg:col-span-5 space-y-4">
            {[
              {
                title: "01. Capture Audio",
                desc: "Microphone streams PCM audio blocks directly into browser memory.",
                icon: "🎙️"
              },
              {
                title: "02. Local Transcription",
                desc: "Whisper speech engine transcribes offline with 98.7% accuracy.",
                icon: "⚙️"
              },
              {
                title: "03. Live Translation",
                desc: "Subtitles translate instantly to 10 supported global languages.",
                icon: "🌐"
              },
              {
                title: "04. AI Summarization",
                desc: "Local LLM core extracts action items and executive summaries.",
                icon: "🧠"
              },
              {
                title: "05. Isolated Export",
                desc: "Saves files directly to your user-isolated IndexedDB database.",
                icon: "💾"
              }
            ].map((step, idx) => (
              <motion.div
                key={idx}
                onClick={() => {
                  setActiveStep(idx);
                  setAutoplayTimeline(false);
                }}
                whileHover={{ scale: 1.01, x: 4 }}
                className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex items-start space-x-4 ${
                  activeStep === idx
                    ? 'bg-purple-950/20 border-purple-500/40 shadow-lg shadow-purple-950/40'
                    : 'bg-slate-900/10 border-slate-900/60 hover:border-slate-850 hover:bg-slate-900/20'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                  activeStep === idx ? 'bg-purple-650/20 text-purple-400' : 'bg-slate-900 text-slate-500'
                }`}>
                  {step.icon}
                </div>
                <div className="space-y-1">
                  <h4 className={`font-bold text-sm ${activeStep === idx ? 'text-purple-400' : 'text-slate-200'}`}>
                    {step.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right interactive visual monitor */}
          <div className="lg:col-span-7 bg-slate-950/90 border border-slate-855/80 rounded-3xl p-8 shadow-2xl relative min-h-[340px] flex flex-col justify-center overflow-hidden">
            <div className="absolute top-4 left-6 flex space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-800"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-slate-800"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-slate-800"></div>
            </div>

            <AnimatePresence mode="wait">
              {activeStep === 0 && (
                <motion.div
                  key="timeline-capture"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center space-y-6 text-center"
                >
                  <div className="w-20 h-20 bg-purple-600/10 border border-purple-500/20 rounded-full flex items-center justify-center relative">
                    <span className="animate-ping absolute inset-0 rounded-full bg-purple-500/20 opacity-75"></span>
                    <span className="text-2xl animate-pulse">🎙️</span>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm font-bold text-slate-200">Listening to Microphone Stream</p>
                    <p className="text-xs text-slate-500">Live PCM audio channels buffered locally in web workers</p>
                  </div>
                </motion.div>
              )}

              {activeStep === 1 && (
                <motion.div
                  key="timeline-transcribe"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-4"
                >
                  <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest block font-mono">Whisper Speech Processing</span>
                  <div className="bg-slate-900/50 border border-slate-850 p-5 rounded-2xl space-y-3 font-mono text-xs leading-relaxed">
                    <p className="text-slate-400">[00:03] <span className="text-slate-200 font-bold">speaker:</span> Loading Whisper core model...</p>
                    <p className="text-slate-400">[00:06] <span className="text-slate-200 font-bold">speaker:</span> Ready to transcribe meeting transcripts locally.</p>
                  </div>
                </motion.div>
              )}

              {activeStep === 2 && (
                <motion.div
                  key="timeline-translate"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-4"
                >
                  <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest block font-mono">Real-Time Subtitle Translation</span>
                  <div className="bg-slate-900/50 border border-slate-850 p-5 rounded-2xl space-y-3">
                    <div className="flex items-center space-x-2 pb-2.5 border-b border-slate-800/80">
                      <span className="text-xs">🇬🇧 English</span>
                      <span className="text-slate-600">⇆</span>
                      <span className="text-xs">🇪🇸 Spanish</span>
                    </div>
                    <p className="text-xs text-slate-355 leading-relaxed italic text-slate-300 font-sans">
                      "Confirming isolated database namespace switch." <br />
                      <span className="text-purple-400 font-bold text-[10px] block mt-1.5">→ "Confirmando el cambio de espacio de nombres de la base de datos aislada."</span>
                    </p>
                  </div>
                </motion.div>
              )}

              {activeStep === 3 && (
                <motion.div
                  key="timeline-summary"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-4"
                >
                  <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest block font-mono">AI summaries generation</span>
                  <div className="space-y-3 bg-slate-900/50 border border-slate-850 p-5 rounded-2xl">
                    <p className="text-xs text-slate-200 font-bold">📝 Action Items Compiled:</p>
                    <ul className="space-y-2 text-xs text-slate-400">
                      <li className="flex items-center"><Check size={12} className="text-purple-500 mr-2" /> Setup dynamic database namespaces.</li>
                      <li className="flex items-center"><Check size={12} className="text-purple-500 mr-2" /> Verify SMTP Gmail TLS handshake.</li>
                    </ul>
                  </div>
                </motion.div>
              )}

              {activeStep === 4 && (
                <motion.div
                  key="timeline-export"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center space-y-4 text-center"
                >
                  <div className="w-16 h-16 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 animate-bounce">
                    <span>💾</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-200">IndexedDB Storage Complete</p>
                    <p className="text-xs text-slate-500 font-mono">Saved under namespace AtlasMeetDB_default</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Sticky Scroll Storytelling Section */}
      <section className="max-w-6xl mx-auto px-6 py-24 border-t border-slate-900">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          
          {/* Left Side: Sticky Visualizer Card */}
          <div className="md:sticky md:top-32 h-[340px] bg-slate-950/50 border border-slate-850 p-8 rounded-3xl flex flex-col justify-center items-center shadow-xl relative overflow-hidden">
            <div className="absolute top-4 left-6 flex space-x-2 z-10">
              <div className="w-2 h-2 rounded-full bg-purple-500/60"></div>
              <div className="w-2 h-2 rounded-full bg-indigo-500/60"></div>
              <div className="w-2 h-2 rounded-full bg-blue-500/60"></div>
            </div>
            
            <div className="w-20 h-20 bg-gradient-to-tr from-purple-600/10 to-indigo-600/10 border border-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400 mb-4 animate-pulse relative z-10">
              <Lock size={32} />
            </div>
            <p className="text-slate-300 font-bold text-sm tracking-wide z-10">Secure Vault Encryption Active</p>
            <p className="text-[10px] text-slate-500 font-mono mt-1 z-10">AtlasMeet SOC Operations &bull; Air-Gapped Mode</p>
            
            <motion.div 
              className="absolute -bottom-1/3 -right-1/3 w-64 h-64 bg-purple-650/5 rounded-full blur-[80px] z-0"
              animate={{ rotate: 360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            />
          </div>

          {/* Right Side: Scrollable narrative blocks */}
          <div className="space-y-16">
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block font-mono">Technical story</span>
              <h3 className="text-3xl font-extrabold tracking-tight">The Security Operations Ledger</h3>
            </div>

            <div className="space-y-12">
              {stickyStory.map((story, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6 }}
                  className="space-y-3 border-l-2 border-purple-950 hover:border-purple-500 pl-6 py-2 transition-all duration-300"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-md bg-purple-600/10 text-purple-400 font-mono text-[10px] font-bold flex items-center justify-center border border-purple-500/20">
                      {story.indicator}
                    </span>
                    <span className="text-xs text-purple-400 font-bold tracking-wide uppercase font-mono">{story.tagline}</span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-100">{story.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{story.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* Product Showcase Interactive Carousel */}
      <section className="px-6 py-16 bg-slate-950/20 border-t border-slate-900">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight">The Modern Control Console</h2>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Preview dashboard layouts</p>
          </div>

          {/* Selector Tabs */}
          <div className="flex justify-center space-x-2">
            <button
              onClick={() => setActiveShowcaseTab('editor')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeShowcaseTab === 'editor'
                  ? 'bg-purple-600 text-white shadow-xl shadow-purple-600/10'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              📝 Meeting Editor Workspace
            </button>
            <button
              onClick={() => setActiveShowcaseTab('history')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeShowcaseTab === 'history'
                  ? 'bg-purple-600 text-white shadow-xl shadow-purple-600/10'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              📁 Meeting History Registry
            </button>
          </div>

          <div className="bg-slate-900/60 border border-slate-850 p-6 rounded-3xl shadow-2xl max-w-5xl mx-auto min-h-[300px] flex flex-col justify-between">
            <AnimatePresence mode="wait">
              {activeShowcaseTab === 'editor' && (
                <motion.div
                  key="editor"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="font-bold text-xs text-slate-300">Meeting: Q3 Alignment Session &bull; Editor</span>
                    <span className="text-[10px] bg-slate-950 text-slate-500 border border-slate-850 px-2 py-0.5 rounded font-mono">ID: meeting-17983</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-2">
                      <span className="text-[9px] font-bold text-purple-400 uppercase tracking-wider block">Meeting Notes</span>
                      <p className="text-xs text-slate-355 leading-relaxed font-mono">
                        # Topic: DB Segregation<br />
                        - Switched Dexie to AtlasMeetDB_&lt;username&gt;<br />
                        - Isolated data folders confirmed offline.<br />
                        - Added custom SMTP 2FA security.
                      </p>
                    </div>
                    <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-2">
                      <span className="text-[9px] font-bold text-purple-400 uppercase tracking-wider block">Live Subtitles translation</span>
                      <p className="text-xs text-slate-400 leading-relaxed italic">
                        "Confirming isolated directory switcher is active. Verified local sandbox works."
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeShowcaseTab === 'history' && (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="font-bold text-xs text-slate-355">Meeting History Log</span>
                    <span className="text-[10px] text-slate-500">Local Browser Storage Only</span>
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex justify-between bg-slate-950 border border-slate-850 p-3 rounded-xl">
                      <div>
                        <p className="text-xs font-bold text-slate-300">Q3 Planning Call</p>
                        <p className="text-[9px] text-slate-500 mt-0.5">Saves directly to user-isolated database</p>
                      </div>
                      <span className="text-[10px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-purple-400 font-bold self-center">36 segments</span>
                    </div>
                    <div className="flex justify-between bg-slate-950 border border-slate-850 p-3 rounded-xl">
                      <div>
                        <p className="text-xs font-bold text-slate-300">Security Handshake &bull; 2FA</p>
                        <p className="text-[9px] text-slate-500 mt-0.5">SMTP verification verified</p>
                      </div>
                      <span className="text-[10px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-purple-400 font-bold self-center">14 segments</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </section>

      {/* Feature Expandable Spotlight Cards */}
      <section className="max-w-6xl mx-auto px-6 py-24 space-y-16">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight">Core Product Capabilities</h2>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-bold font-mono">Expand each feature to read details</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <SpotlightCard 
            className="cursor-pointer space-y-3"
          >
            <div 
              onClick={() => setExpandedFeature(expandedFeature === 0 ? null : 0)}
              className="space-y-3"
            >
              <div className="flex justify-between items-center">
                <span className="p-2 rounded-xl bg-purple-500/10 inline-block"><Database className="text-purple-400" size={18} /></span>
                <ChevronDown size={16} className={`text-slate-500 transition-transform duration-300 ${expandedFeature === 0 ? 'rotate-180 text-purple-400' : ''}`} />
              </div>
              <h4 className="font-bold text-slate-200">Local User Database</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Meetings and transcripts are saved inside local user-isolated databases.</p>
            </div>
            
            <AnimatePresence>
              {expandedFeature === 0 && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden pt-2 text-[11px] text-slate-500 leading-relaxed"
                >
                  By namespacing Dexie databases as `AtlasMeetDB_&lt;username&gt;`, user profiles on the same computer are entirely isolated. Data never syncs to external clouds.
                </motion.div>
              )}
            </AnimatePresence>
          </SpotlightCard>

          <SpotlightCard 
            className="cursor-pointer space-y-3"
          >
            <div 
              onClick={() => setExpandedFeature(expandedFeature === 1 ? null : 1)}
              className="space-y-3"
            >
              <div className="flex justify-between items-center">
                <span className="p-2 rounded-xl bg-indigo-500/10 inline-block"><Lock className="text-indigo-400" size={18} /></span>
                <ChevronDown size={16} className={`text-slate-500 transition-transform duration-300 ${expandedFeature === 1 ? 'rotate-180 text-indigo-400' : ''}`} />
              </div>
              <h4 className="font-bold text-slate-200">2FA SMTP Verification</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Protected with Gmail SMTP 2-step verification codes sent directly to your inbox.</p>
            </div>
            
            <AnimatePresence>
              {expandedFeature === 1 && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden pt-2 text-[11px] text-slate-500 leading-relaxed"
                >
                  On startup, our custom server middleware connects to Gmail SMTP to send 2FA OTP codes. User login sessions are locked until the code is validated.
                </motion.div>
              )}
            </AnimatePresence>
          </SpotlightCard>

          <SpotlightCard 
            className="cursor-pointer space-y-3"
          >
            <div 
              onClick={() => setExpandedFeature(expandedFeature === 2 ? null : 2)}
              className="space-y-3"
            >
              <div className="flex justify-between items-center">
                <span className="p-2 rounded-xl bg-blue-500/10 inline-block"><Languages className="text-blue-400" size={18} /></span>
                <ChevronDown size={16} className={`text-slate-500 transition-transform duration-300 ${expandedFeature === 2 ? 'rotate-180 text-blue-400' : ''}`} />
              </div>
              <h4 className="font-bold text-slate-200">Real-Time Subtitle Translation</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Translates speech to secondary languages on the fly.</p>
            </div>
            
            <AnimatePresence>
              {expandedFeature === 2 && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden pt-2 text-[11px] text-slate-500 leading-relaxed"
                >
                  Subtitle overlays align with microphone inputs, offering translation features for multi-lingual corporate environments.
                </motion.div>
              )}
            </AnimatePresence>
          </SpotlightCard>

        </div>
      </section>

      {/* Industry Use-Cases Grid using Spotlight Cards */}
      <section className="max-w-6xl mx-auto px-6 py-12 space-y-16">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight">Tailored for Regulated Industries</h2>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Compliance across sectors</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <SpotlightCard className="space-y-3">
            <h4 className="font-bold text-slate-200 flex items-center">
              <TrendingUp size={16} className="text-purple-400 mr-2" />
              Banking & Finance
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Transcribe sensitive transaction discussions offline. Zero data leakage ensures strict SEC and SOC compliance.
            </p>
          </SpotlightCard>

          <SpotlightCard className="space-y-3">
            <h4 className="font-bold text-slate-200 flex items-center">
              <Globe size={16} className="text-purple-400 mr-2" />
              Government & Public Sector
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Deploy in isolated, secure air-gapped networks. Transcribe classified briefings without cloud dependencies.
            </p>
          </SpotlightCard>

          <SpotlightCard className="space-y-3">
            <h4 className="font-bold text-slate-200 flex items-center">
              <Award size={16} className="text-purple-400 mr-2" />
              Healthcare & Legal
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Conduct patient assessments and legal consultations. Local browser encryption aligns with HIPAA and GDPR requirements.
            </p>
          </SpotlightCard>

        </div>
      </section>

      {/* Security Dashboard & Compliance Registry */}
      <section className="bg-slate-950 border-t border-slate-900 py-24 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-6">
            <h3 className="text-3xl font-extrabold tracking-tight">Visual Security & Compliance Matrix</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Because AtlasMeet compiles and runs entirely client-side, your workspace satisfies global privacy mandates natively.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/50 p-4 border border-slate-850 rounded-xl text-center space-y-1">
                <span className="text-xs font-bold text-purple-400 block uppercase font-mono">GDPR</span>
                <span className="text-[10px] text-slate-500 font-semibold">100% Compliant</span>
              </div>
              <div className="bg-slate-900/50 p-4 border border-slate-855 rounded-xl text-center space-y-1">
                <span className="text-xs font-bold text-purple-400 block uppercase font-mono">HIPAA</span>
                <span className="text-[10px] text-slate-550 text-slate-550 font-semibold">Offline Gated</span>
              </div>
            </div>
          </div>

          {/* Access badges card */}
          <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl space-y-4">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block font-mono">Security Access Protocols</span>
            
            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-900 pb-2">
                <div>
                  <p className="font-bold text-slate-200">Primary Administrator</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">Approves resets, views password directory</p>
                </div>
                <span className="text-[10px] bg-purple-950 text-purple-400 border border-purple-900 px-2 py-0.5 rounded font-bold uppercase self-center font-mono">Full Access</span>
              </div>

              <div className="flex justify-between border-b border-slate-900 pb-2">
                <div>
                  <p className="font-bold text-slate-200">System Assistant</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">Accesses CPU dials and user logs</p>
                </div>
                <span className="text-[10px] bg-blue-950 text-blue-400 border border-blue-900 px-2 py-0.5 rounded font-bold uppercase self-center font-mono">Monitor Only</span>
              </div>

              <div className="flex justify-between">
                <div>
                  <p className="font-bold text-slate-200">Client / User Profile</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">Standard editor and offline storage</p>
                </div>
                <span className="text-[10px] bg-slate-950 text-slate-500 border border-slate-850 px-2 py-0.5 rounded font-bold uppercase self-center font-mono">Workspace Only</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Final Call-To-Action (CTA) */}
      <section className="relative py-24 px-6 overflow-hidden border-t border-slate-900">
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-950/20 via-slate-950 to-indigo-950/20 opacity-80 pointer-events-none"></div>
        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          
          <h2 className="text-3xl md:text-5xl font-black tracking-tight">Ready for Private Meeting Intelligence?</h2>
          <p className="text-slate-400 text-xs md:text-sm max-w-xl mx-auto leading-relaxed">
            Create user-isolated databases, setup SMTP 2-step verification codes, and transcribe/translate offline.
          </p>

          <div className="pt-4">
            <button
              onClick={onLaunchApp}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-xl shadow-purple-600/10 flex items-center justify-center space-x-2 mx-auto transition-all transform hover:scale-[1.02]"
            >
              <span>{isAuthenticated ? 'Enter Application Console' : 'Launch Workspace Free'}</span>
              <ArrowRight size={16} />
            </button>
          </div>

        </div>
      </section>

      {/* Upgraded Premium AI SaaS Footer */}
      <footer className="border-t border-slate-900 bg-[#020617] py-16 px-6 text-xs text-slate-400 relative overflow-hidden">
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-600/5 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-8 mb-12 relative z-10">
          
          {/* Logo & Pitch */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 bg-gradient-to-tr from-purple-650 to-indigo-650 rounded-lg flex items-center justify-center font-bold text-white text-sm shadow-md shadow-purple-500/20">
                A
              </div>
              <span className="font-extrabold text-sm text-slate-200">AtlasMeet</span>
            </div>
            <p className="text-xs text-slate-450 leading-relaxed max-w-xs">
              Secure, client-side meeting minutes web assistant. Your private audio transcripts never leave your browser sandbox.
            </p>
            
            {/* Social Links */}
            <div className="flex items-center space-x-4 pt-2">
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-purple-400 transition-colors" title="LinkedIn">
                <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <h5 className="font-bold text-slate-200 uppercase tracking-widest text-[9px] font-mono">Product</h5>
            <ul className="space-y-2 text-xs">
              <li><button onClick={onLaunchApp} className="hover:text-purple-400 transition-colors text-left outline-none">Launch Workspace</button></li>
              <li><a href="#sandbox" className="hover:text-purple-400 transition-colors">Interactive Sandbox</a></li>
              <li><a href="#timeline" className="hover:text-purple-400 transition-colors">Timeline Pipeline</a></li>
            </ul>
          </div>

          {/* Security Links */}
          <div className="space-y-3">
            <h5 className="font-bold text-slate-200 uppercase tracking-widest text-[9px] font-mono">Security</h5>
            <ul className="space-y-2 text-xs">
              <li><span className="text-slate-400 cursor-default">100% Client-Side DB</span></li>
              <li><span className="text-slate-400 cursor-default">Isolated Namespaces</span></li>
              <li><span className="text-slate-400 cursor-default">SMTP 2FA Verification</span></li>
            </ul>
          </div>

          {/* Resources Links */}
          <div className="space-y-3">
            <h5 className="font-bold text-slate-200 uppercase tracking-widest text-[9px] font-mono">Resources</h5>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => onNavigateToResource?.('documentation')} className="hover:text-purple-400 transition-colors text-left outline-none animate-fadeIn">Documentation</button></li>
              <li><button onClick={() => onNavigateToResource?.('api')} className="hover:text-purple-400 transition-colors text-left outline-none animate-fadeIn">Developer API</button></li>
              <li><button onClick={() => onNavigateToResource?.('support')} className="hover:text-purple-400 transition-colors text-left outline-none animate-fadeIn">Support Center</button></li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="space-y-3">
            <h5 className="font-bold text-slate-200 uppercase tracking-widest text-[9px] font-mono">Company</h5>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-purple-400 transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-purple-400 transition-colors">SaaS Security</a></li>
              <li><a href="mailto:noreply.atlasmeet@gmail.com" className="hover:text-purple-400 transition-colors">Contact Support</a></li>
            </ul>
          </div>

        </div>

        {/* Footer Sub-Bar */}
        <div className="max-w-6xl mx-auto pt-8 border-t border-slate-900/60 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] relative z-10">
          
          <div></div>

          <div className="text-center md:text-right space-y-1.5 text-slate-500">
            <p>&copy; {new Date().getFullYear()} AtlasMeet. All rights reserved.</p>
            <p>For support or inquiries: <a href="mailto:noreply.atlasmeet@gmail.com" className="text-purple-400 hover:underline">noreply.atlasmeet@gmail.com</a></p>
          </div>

        </div>
      </footer>

    </div>
  );
}

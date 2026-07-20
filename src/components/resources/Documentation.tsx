import { ArrowLeft, BookOpen, Database, Lock } from 'lucide-react';

export default function Documentation({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-purple-650/30 selection:text-purple-300 relative pb-24">
      {/* Background Aurora */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-purple-950/10 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Navigation Header */}
      <nav className="border-b border-slate-900 bg-[#020617]/80 backdrop-blur-xl sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button 
            onClick={onBack}
            className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors text-xs font-bold font-mono outline-none"
          >
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </button>
          <div className="flex items-center space-x-2">
            <BookOpen size={16} className="text-purple-400" />
            <span className="text-xs font-extrabold tracking-wider uppercase font-mono text-slate-300">AtlasMeet Documentation</span>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-6 pt-16 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Sidebar Index */}
        <aside className="md:col-span-1 space-y-3 md:sticky md:top-24 h-fit">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Sections</h4>
          <ul className="space-y-2 text-xs font-medium">
            <li><a href="#overview" className="text-purple-400 hover:text-purple-300 block">Overview</a></li>
            <li><a href="#whisper" className="text-slate-400 hover:text-white block">Speech-to-Text Core</a></li>
            <li><a href="#segregation" className="text-slate-400 hover:text-white block">Storage Isolation</a></li>
            <li><a href="#smtp2fa" className="text-slate-400 hover:text-white block">SMTP 2-Step Auth</a></li>
          </ul>
        </aside>

        {/* Content Body */}
        <div className="md:col-span-3 space-y-12">
          
          {/* Header */}
          <header className="space-y-4">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400 text-transparent">
              Documentation
            </h1>
            <p className="text-sm text-slate-450 leading-relaxed max-w-xl">
              Learn how AtlasMeet implements client-side meeting minutes extraction, real-time subtitle translation, and cryptographic user database sandboxing.
            </p>
          </header>

          {/* Section: Overview */}
          <section id="overview" className="space-y-4 border-t border-slate-900 pt-8">
            <h3 className="text-xl font-bold text-slate-100 flex items-center">
              <span className="w-5 h-5 rounded bg-purple-500/10 text-purple-400 text-[10px] font-bold font-mono flex items-center justify-center mr-2 border border-purple-500/20">01</span>
              System Overview
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              AtlasMeet is designed for environments requiring absolute privacy controls. Unlike traditional assistants that record conversations and stream raw audio data to remote clusters, AtlasMeet transcribes and compiles meeting notes completely inside the local browser context.
            </p>
            <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 space-y-2 font-mono text-[11px] text-slate-400 leading-relaxed">
              <p className="text-purple-400 font-bold">&bull; 100% Offline execution fallback</p>
              <p className="text-purple-400 font-bold">&bull; Dynamic IndexedDB isolation namespaces</p>
              <p className="text-purple-400 font-bold">&bull; Gmail SMTP configured 2FA handshakes</p>
            </div>
          </section>

          {/* Section: Whisper Speech Core */}
          <section id="whisper" className="space-y-4 border-t border-slate-900 pt-8">
            <h3 className="text-xl font-bold text-slate-100 flex items-center">
              <span className="w-5 h-5 rounded bg-purple-500/10 text-purple-400 text-[10px] font-bold font-mono flex items-center justify-center mr-2 border border-purple-500/20">02</span>
              Speech-to-Text Pipeline
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Meeting audio is captured via the standard MediaDevices API. AtlasMeet supports two runtime models for transcription:
            </p>
            <ul className="space-y-3 pl-4 text-xs text-slate-400 list-disc">
              <li>
                <strong>Web Speech Core:</strong> Native browser API running speech-to-text directly on the local operating system without external API consumption.
              </li>
              <li>
                <strong>Local Whisper Endpoint:</strong> Connects to a custom, air-gapped OpenAI-compatible transcription server (e.g., local Whisper.cpp or Faster-Whisper instances) over secure TCP channels.
              </li>
            </ul>
          </section>

          {/* Section: Storage Isolation */}
          <section id="segregation" className="space-y-4 border-t border-slate-900 pt-8">
            <h3 className="text-xl font-bold text-slate-100 flex items-center">
              <span className="w-5 h-5 rounded bg-purple-500/10 text-purple-400 text-[10px] font-bold font-mono flex items-center justify-center mr-2 border border-purple-500/20">03</span>
              IndexedDB Storage Isolation
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              When a user logs in, the active Dexie database swaps instantly. Database schemas are namespaced as <code>AtlasMeetDB_&lt;username&gt;</code>. This prevents data contamination:
            </p>
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex items-start space-x-3 text-xs">
              <Database className="text-purple-400 shrink-0 mt-0.5" size={16} />
              <div>
                <strong className="text-slate-200 block mb-1">Namespaced Gating</strong>
                <span className="text-slate-450 leading-relaxed">
                  Only the validated user session can construct the specific Dexie handler. Other users on the same machine cannot inspect database blocks from alternate profiles.
                </span>
              </div>
            </div>
          </section>

          {/* Section: SMTP 2FA */}
          <section id="smtp2fa" className="space-y-4 border-t border-slate-900 pt-8">
            <h3 className="text-xl font-bold text-slate-100 flex items-center">
              <span className="w-5 h-5 rounded bg-purple-500/10 text-purple-400 text-[10px] font-bold font-mono flex items-center justify-center mr-2 border border-purple-500/20">04</span>
              SMTP 2-Step Authentication
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              To prevent unauthorized database entry on shared workstations, a two-step validation is enforced:
            </p>
            <div className="bg-slate-950 border border-slate-855 p-5 rounded-2xl space-y-3">
              <div className="flex items-center space-x-2 text-xs text-slate-200">
                <Lock className="text-indigo-400" size={16} />
                <span>Handshake Protocol Flow</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-mono">
                1. User requests login credentials.<br />
                2. Backend generates a cryptographically random 6-digit OTP.<br />
                3. Mailer dispatch connects to Gmail SMTP via TLS to deliver OTP.<br />
                4. Session remains locked until the verified OTP is submitted.
              </p>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}

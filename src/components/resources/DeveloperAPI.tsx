import { ArrowLeft, Code, Play, Terminal } from 'lucide-react';

export default function DeveloperAPI({ onBack }: { onBack: () => void }) {
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
            <Code size={16} className="text-purple-400" />
            <span className="text-xs font-extrabold tracking-wider uppercase font-mono text-slate-300">Developer portal</span>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-6 pt-16 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Sidebar Index */}
        <aside className="md:col-span-1 space-y-3 md:sticky md:top-24 h-fit">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Endpoints</h4>
          <ul className="space-y-2 text-xs font-medium font-mono text-slate-400">
            <li><a href="#custom-whisper" className="text-purple-400 hover:text-purple-300 block">POST /transcriptions</a></li>
            <li><a href="#local-ollama" className="hover:text-white block">POST /chat/completions</a></li>
            <li><a href="#payloads" className="hover:text-white block">Export Schemas</a></li>
          </ul>
        </aside>

        {/* Content Body */}
        <div className="md:col-span-3 space-y-12">
          
          {/* Header */}
          <header className="space-y-4">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400 text-transparent">
              Developer API
            </h1>
            <p className="text-sm text-slate-450 leading-relaxed max-w-xl">
              Configure custom speech endpoints and parse local IndexedDB data payloads for automated workspace flows.
            </p>
          </header>

          {/* Section: Custom Whisper */}
          <section id="custom-whisper" className="space-y-4 border-t border-slate-900 pt-8">
            <h3 className="text-lg font-bold text-slate-100 flex items-center">
              <Terminal size={18} className="text-purple-400 mr-2" />
              Custom Whisper Transcriptions
            </h3>
            <p className="text-xs text-slate-450 leading-relaxed">
              If running in a container or hosting a private Whisper instance, point the system configuration to your custom endpoint:
            </p>
            
            <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 space-y-2 font-mono text-[11px] text-slate-300">
              <span className="text-purple-400">POST</span> http://localhost:8000/v1/audio/transcriptions
              <div className="border-t border-slate-900 my-3 pt-3 text-slate-400">
                <strong>Headers:</strong><br />
                Content-Type: multipart/form-data<br />
                Authorization: Bearer [optional_local_token]
              </div>
            </div>
          </section>

          {/* Section: Local Ollama */}
          <section id="local-ollama" className="space-y-4 border-t border-slate-900 pt-8">
            <h3 className="text-lg font-bold text-slate-100 flex items-center">
              <Code size={18} className="text-indigo-400 mr-2" />
              Ollama Local Completions
            </h3>
            <p className="text-xs text-slate-450 leading-relaxed">
              Meetings can be summarized using completely offline llama/gemma weights running inside Ollama.
            </p>
            <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 space-y-2 font-mono text-[11px] text-slate-300">
              <span className="text-indigo-400">POST</span> http://localhost:11434/api/generate
              <div className="border-t border-slate-900 my-3 pt-3 text-slate-400">
                <strong>Request Payload:</strong>
                <pre className="text-[10px] text-slate-500 mt-2">
{`{
  "model": "gemma2:2b",
  "prompt": "Summarize this meeting:...",
  "stream": false
}`}
                </pre>
              </div>
            </div>
          </section>

          {/* Section: Payload Schemas */}
          <section id="payloads" className="space-y-4 border-t border-slate-900 pt-8">
            <h3 className="text-lg font-bold text-slate-100 flex items-center">
              <Play size={16} className="text-emerald-400 mr-2" />
              JSON Export Data Schema
            </h3>
            <p className="text-xs text-slate-450 leading-relaxed">
              IndexedDB data structure for custom exports and meeting minutes parses:
            </p>
            <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 font-mono text-[10px] text-slate-400 leading-relaxed">
              <pre>
{`{
  "id": "meeting_1798302188",
  "title": "Q3 Planning Call",
  "timestamp": 1784405392,
  "segments": [
    {
      "id": 1,
      "text": "Loading isolated Dexie database namespaces.",
      "start": 0.00,
      "end": 4.50,
      "speaker": "CEO Sandeep"
    }
  ],
  "summary": "Isolated data directory verified... ",
  "notes": "- Checked Dexie database switcher works."
}`}
              </pre>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}

import { useState } from 'react';
import { ArrowLeft, HelpCircle, Mail, MessageSquare } from 'lucide-react';

export default function SupportCenter({ onBack }: { onBack: () => void }) {
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDetails, setTicketDetails] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSent(true);
    
    const mailtoUrl = `mailto:noreply.atlasmeet@gmail.com?subject=AtlasMeet Support: ${encodeURIComponent(ticketSubject)}&body=${encodeURIComponent(ticketDetails)}`;
    // Dispatch synchronously to avoid browser security block on async redirects
    window.location.href = mailtoUrl;
  };

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
            <MessageSquare size={16} className="text-purple-400" />
            <span className="text-xs font-extrabold tracking-wider uppercase font-mono text-slate-300">Support center</span>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-6 pt-16 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Left: FAQs */}
        <div className="md:col-span-2 space-y-8">
          <header className="space-y-4">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400 text-transparent">
              Support FAQs
            </h1>
            <p className="text-sm text-slate-450 leading-relaxed">
              Find instant answers to common questions about setup, local IndexedDB directories, and SMTP authentication protocols.
            </p>
          </header>

          <div className="space-y-6">
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-200 flex items-center">
                <HelpCircle size={14} className="text-purple-400 mr-1.5 shrink-0" />
                Why are my OTP codes not arriving?
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed pl-5">
                Verify that your <code>.env</code> contains a valid <code>SMTP_PASS</code> (App Password, not the account master password) and that the SMTP service is running locally on target port 3001.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-200 flex items-center">
                <HelpCircle size={14} className="text-purple-400 mr-1.5 shrink-0" />
                Where is my meeting data stored?
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed pl-5">
                Data is stored in IndexedDB under the database namespace <code>AtlasMeetDB_&lt;username&gt;</code>. Cleared browser storage will erase saved meetings.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Submit Support Ticket Form */}
        <div className="md:col-span-2 bg-slate-900/20 border border-slate-900 p-6 rounded-3xl space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-900">
            <Mail size={16} className="text-purple-400" />
            <h3 className="font-bold text-slate-200 text-sm">Dispatched Support Ticket</h3>
          </div>

          <form onSubmit={handleSubmitTicket} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">Ticket Subject</label>
              <input 
                type="text" 
                required
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="e.g. SMTP Handshake failed"
                className="w-full bg-slate-950 border border-slate-850 px-3.5 py-2.5 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">Problem Details</label>
              <textarea 
                required
                rows={4}
                value={ticketDetails}
                onChange={(e) => setTicketDetails(e.target.value)}
                placeholder="Explain the error message or issue details..."
                className="w-full bg-slate-950 border border-slate-850 px-3.5 py-2.5 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500/50 resize-none"
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-purple-650 to-indigo-650 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 rounded-xl text-xs transition-all outline-none"
            >
              Open Mail Client to Dispatch
            </button>
          </form>

          {isSent && (
            <div className="text-center text-[10px] text-slate-400 font-bold space-y-2 mt-4 pt-4 border-t border-slate-900">
              <p className="text-purple-400">Mail client triggered. Dispatching to: <span className="underline">noreply.atlasmeet@gmail.com</span></p>
              <p className="text-slate-500">If your mail app didn't open automatically, click below to send manually:</p>
              <a 
                href={`mailto:noreply.atlasmeet@gmail.com?subject=AtlasMeet Support: ${encodeURIComponent(ticketSubject)}&body=${encodeURIComponent(ticketDetails)}`}
                className="inline-flex items-center space-x-1 bg-purple-650/15 border border-purple-500/30 px-3 py-1.5 rounded-lg text-purple-300 hover:bg-purple-600/30 transition-colors"
              >
                <span>Send Support Email Manually</span>
              </a>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}

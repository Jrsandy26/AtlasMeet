# 🌌 AtlasMeet: Corporate Meeting Intelligence Platform

AtlasMeet is a modern, enterprise-grade meeting intelligence and transcription platform. Designed for seamless workspace organization, real-time speech-to-text processing, and intelligent AI translation/summarization, it empowers teams to transcribe, translate, summarize, and export corporate meeting logs securely and efficiently.

---

## ✨ Key Features

*   **🏢 Organization Workspaces & RBAC**:
    *   Dynamic workspace isolation between personal accounts and corporate organization networks.
    *   Role-Based Access Control (RBAC): Admin, Member, and Viewer tiers.
    *   Secure invitation workflow with dynamic join links and company email verification.
*   **🎙️ Hybrid Speech-to-Text (STT)**:
    *   *Real-time Streaming*: Powered by the browser Web Speech API (zero latency, zero cost) aligning automatically to selected speaker languages (e.g. English, Japanese, Urdu, Spanish, French, etc.).
    *   *High-Accuracy Cloud Transcription*: Post-recording Whisper transcription using state-of-the-art models via **NVIDIA NIM API**, **Groq Whisper**, or **OpenAI Whisper**.
*   **🌐 Bulletproof Multi-Tier AI Translation**:
    *   *Tier 1 (Primary)*: Keyless batched translation using the MyMemory API.
    *   *Tier 2 (Fallback)*: Google Translate Free API (`translate.googleapis.com`) serving as an immediate high-speed backup.
    *   *Tier 3 (Enterprise Fallback)*: Full-context translation using **OpenRouter**, **NVIDIA NIM**, **Gemini**, **OpenAI**, or **Groq** LLMs.
    *   *Stop-Recording Sync*: Automatically translates post-processed Cloud Whisper transcriptions if Live Translate was enabled, showing the bilingual translation immediately.
*   **📧 Automated Email Dispatch & File Exports**:
    *   Export summaries, notes, and transcripts locally as **TXT**, **PDF**, or **DOCX** (Word-compatible HTML).
    *   "Send to Mail" triggers automated SMTP dispatches sending full meeting summary logs directly to user inboxes with:
        1.  `_audio.webm` (Raw voice recording file)
        2.  `_transcript.txt` (Text transcript segments)
        3.  `_minutes.docx` (Rich-text formatted Word summary minutes)
*   **🔒 Corporate Security & Session Control**:
    *   **6-Hour Session Expiry**: Active session duration limit.
    *   **Single Session Enforcement**: Restricts a user to one active login. Logging in elsewhere terminates old session tokens.
    *   **30-Minute Inactivity Timeout**: Automatically logs users out after 30 minutes of keyboard, mouse, or scroll inactivity.
    *   **Brute-Force Lockout**: Enforces a 15-minute account lock after 5 failed login attempts.
    *   **Email OTP Throttle**: Restricts OTP dispatches to a maximum of 3 requests within 10 minutes.
*   **⚡ Serverless & Server-Side Proxies**:
    *   Secure proxy routes `/api/groq/*`, `/api/nvidia/*`, and `/api/openrouter/*` wrap and inject server-side `.env` keys so they are never exposed to the client browser.
    *   **Vercel Serverless Function** entry points mapped inside `/api` for rapid cloud deployment.
    *   **Nginx Load Balancer Upstream configuration** ready to distribute connections across multiple backend ports (e.g. 3000, 3001) for 30-50 simultaneous enterprise users.

---

## 🛠️ Tech Stack

*   **Frontend**: React (v19), Vite, TailwindCSS, Framer Motion, Lucide icons, Dexie.js (IndexedDB).
*   **Backend**: Node.js, Express, Nodemailer, Vercel Serverless Functions.
*   **APIs Supported**: OpenRouter, Groq, OpenAI, Google Gemini, NVIDIA NIM, Ollama.
*   **Database**: Supabase (Security logging & Session Tokens), IndexedDB (Local user database namespaces).
*   **Server**: Nginx (configured for upstream load balancing).

---

## 🚀 Getting Started

### Prerequisites

*   Node.js (v18 or higher)
*   npm or yarn

### 1. Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/Jrsandy26/AtlasMeet.git
cd AtlasMeet
npm install
```

### 2. Environment Variables Setup

Create a `.env` file in the root directory and add your credentials:

```ini
# Server Port Configuration
PORT=3000

# Supabase Configurations
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
SUPABASE_JWKS_URL=https://your-project.supabase.co/auth/v1/.well-known/jwks.json

# SMTP Mail Server Credentials (used for OTP, Invites, and Summary Logs)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_EMAIL=your-company-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password

# LLM API Keys (Optional - secure proxy handlers inject these on demand)
GROQ_API_KEY=gsk_...
OPENROUTER_API_KEY=sk-or-...
NVIDIA_API_KEY=nvapi-...
OPENAI_API_KEY=sk-proj-...
GEMINI_API_KEY=AIzaSy...
```

### 3. Running the Application

#### Development Mode (with Vite Dev Server and SMTP Mail Middlewares)
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

#### Production Build & Server Start
To build the React assets and compile the SMTP backend services:
```bash
npm run build
node server.js
```
The server will bind to the configured `PORT` and run at [http://localhost:3000](http://localhost:3000).

---

## ☁️ Deployment

### Vercel Deployment
This application is fully optimized for serverless deployment on **Vercel**:
1. Install the Vercel CLI: `npm install -g vercel`
2. Run `vercel` in the project root.
3. Configure your Environment Variables in the Vercel Project Dashboard.

---

## 📂 Project Structure

```
├── api/                   # Vercel Serverless Function entry points (Proxies & config)
├── dist/                  # Compiled React production bundle
├── netlify/               # Netlify configuration and serverless functions
├── src/
│   ├── components/        # UI components (Workspace selectors, Settings panels)
│   ├── services/          # Client-side API handlers
│   │   ├── transcriptionService.ts # Web Speech API / Whisper transcription
│   │   └── summaryService.ts       # AI translation, summary, templates
│   ├── App.tsx            # Main application logic
│   ├── db.ts              # Dexie IndexedDB schemas & namespace swapper
│   └── main.tsx           # React mounting point
├── vercel.json            # Vercel deployment routes mapping
├── server.js              # Express production entry point & API proxies
├── smtpService.ts         # Nodemailer email SMTP triggers (transpiled to .js on build)
├── nginx.conf             # Production Nginx upstream load balancer config
├── package.json           # Scripts & project dependencies
└── README.md              # Project documentation
```

---

## 📄 License

This project is proprietary and confidential. Built for corporate meeting intelligence operations.
Corporate Security Operations Center (SOC) • Hosur, India.

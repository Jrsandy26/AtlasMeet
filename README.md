# 🌌 AtlasMeet: Corporate Meeting Intelligence Platform

AtlasMeet is a modern, enterprise-grade meeting intelligence and transcription platform. Designed for seamless workspace organization, real-time speech-to-text processing, and intelligent AI translation/summarization, it empowers teams to transcribe, translate, summarize, and export corporate meeting logs securely and efficiently.

---

## ✨ Key Features

*   **🏢 Organization Workspaces & RBAC**:
    *   Dynamic workspace isolation between personal accounts and corporate organization networks.
    *   Role-Based Access Control (RBAC): Admin, Member, and Viewer tiers.
    *   Secure invitation workflow with dynamic join links and company email verification.
*   **🎙️ Hybrid Speech-to-Text (STT)**:
    *   *Real-time Streaming*: Powered by the browser Web Speech API (zero latency, zero cost) aligning automatically to selected speaker languages.
    *   *High-Accuracy Cloud Transcription*: Optional post-processing whisper transcribing using state-of-the-art models via **NVIDIA NIM API**, **Groq Whisper**, or **OpenAI Whisper**.
*   **🌐 Intelligent AI Translation**:
    *   *Batched Free Translation*: Leverages the MyMemory translation API using advanced 10-line batching to reduce latency and bypass rate limits by 90%.
    *   *Enterprise Translation*: Translation using **NVIDIA NIM**, **Gemini**, **OpenAI**, or **Groq** LLMs.
    *   *Translation Persistence*: Translations write back to IndexedDB so they persist across browser reloads.
*   **📧 Automated Email Dispatch & File Exports**:
    *   Export summaries, notes, and transcripts locally as **TXT**, **PDF**, or **DOCX** (Word-compatible HTML).
    *   "Send to Mail" triggers automated SMTP dispatches sending full meeting summary logs directly to user inboxes with:
        1.  `_audio.webm` (Raw voice recording file)
        2.  `_transcript.txt` (Text transcript segments)
        3.  `_minutes.docx` (Rich-text formatted Word summary minutes)
*   **🔒 Security & Session Persistence**:
    *   Automatic **6-hour session token persistence** bypassing 2-step OTP verification for active daily users.
    *   Cross-Origin Resource Sharing (CORS) resolution using specialized backend proxy routing for NVIDIA NIM and cloud APIs.
*   **⚡ Production Scaling & Load Balancing**:
    *   Node/Express backend serving client-side assets and routing proxy requests.
    *   **Nginx Load Balancer Upstream configuration** ready to distribute connections across multiple backend ports (e.g. 3000, 3001) for 30-50 simultaneous enterprise users.

---

## 🛠️ Tech Stack

*   **Frontend**: React (v19), Vite, TailwindCSS, Framer Motion, Lucide icons, Dexie.js (IndexedDB).
*   **Backend**: Node.js, Express, Nodemailer.
*   **APIs Supported**: NVIDIA NIM, Groq, OpenAI, Google Gemini, Ollama.
*   **Database**: IndexedDB (User-specific namespace isolated databases).
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

# SMTP Mail Server Credentials (used for OTP, Invites, and Summary Logs)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_EMAIL=your-company-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
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

## ⚖️ Production Scaling & Load Balancing

For deploying in environments supporting 30-50 concurrent active users, run multiple Node server instances (e.g., on ports 3000 and 3001) behind the included **Nginx Load Balancer configuration** (`nginx.conf`).

The load balancer handles proxying traffic and API endpoints smoothly:

```nginx
upstream express_mail_backend {
    server 127.0.0.1:3000 max_fails=3 fail_timeout=10s;
    server 127.0.0.1:3001 max_fails=3 fail_timeout=10s;
}
```

---

## 📂 Project Structure

```
├── dist/                  # Compiled React production bundle
├── src/
│   ├── components/        # UI components (Workspace selectors, Settings panels)
│   ├── services/          # Client-side API handlers
│   │   ├── transcriptionService.ts # Web Speech API / Whisper transcription
│   │   └── summaryService.ts       # AI translation, summary, templates
│   ├── App.tsx            # Main application logic
│   ├── db.ts              # Dexie IndexedDB schemas & namespace swapper
│   └── main.tsx           # React mounting point
├── server.js              # Express production entry point & API proxies
├── smtpService.ts         # Nodemailer email SMTP triggers (transpiled to .js on build)
├── nginx.conf             # Production Nginx upstream load balancer config
├── package.json           # Scripts & project dependencies
└── README.md              # Project documentation
```

---

## 📄 License

This project is proprietary and confidential. Built for corporate meeting intelligence operations.

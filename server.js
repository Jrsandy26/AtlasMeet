import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();
import { sendOtpEmail, sendResetEmail, sendInviteEmail, sendMeetingLogEmail } from './smtpService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve static frontend assets from dist folder
app.use(express.static(path.join(__dirname, 'dist')));

// API Routes
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    await sendOtpEmail(email, otp);
    res.json({ success: true });
  } catch (err) {
    console.error('API Send OTP Error:', err);
    res.status(500).json({ success: false, detail: err.message });
  }
});

app.post('/api/auth/send-reset-code', async (req, res) => {
  try {
    const { email, username, code } = req.body;
    await sendResetEmail(email, username, code);
    res.json({ success: true });
  } catch (err) {
    console.error('API Send Reset Error:', err);
    res.status(500).json({ success: false, detail: err.message });
  }
});

app.post('/api/auth/send-invite', async (req, res) => {
  try {
    const { email, orgName, inviteLink } = req.body;
    await sendInviteEmail(email, orgName, inviteLink);
    res.json({ success: true });
  } catch (err) {
    console.error('API Send Invite Error:', err);
    res.status(500).json({ success: false, detail: err.message });
  }
});

app.post('/api/auth/send-meeting-log', async (req, res) => {
  try {
    const { email, username, title, dateTime, transcript, summary, audioBase64 } = req.body;
    await sendMeetingLogEmail(email, username, title, dateTime, transcript, summary, audioBase64);
    res.json({ success: true });
  } catch (err) {
    console.error('API Send Meeting Log Error:', err);
    res.status(500).json({ success: false, detail: err.message });
  }
});

app.get('/api/config', (req, res) => {
  res.json({
    hasNvidiaKey: !!process.env.NVIDIA_API_KEY,
    hasOpenaiKey: !!process.env.OPENAI_API_KEY,
    hasGroqKey: !!process.env.GROQ_API_KEY,
    hasGeminiKey: !!process.env.GEMINI_API_KEY
  });
});

app.post('/api/nvidia/chat', async (req, res) => {
  try {
    let apiKey = req.headers['authorization'];
    
    // Fallback to server-side .env key if client key is missing
    if (!apiKey || apiKey === 'Bearer ' || apiKey === 'Bearer null' || apiKey === 'Bearer undefined' || apiKey === 'Bearer ""') {
      if (process.env.NVIDIA_API_KEY) {
        apiKey = `Bearer ${process.env.NVIDIA_API_KEY}`;
      } else {
        return res.status(401).json({ success: false, detail: 'NVIDIA NIM API Key not configured on client or server.' });
      }
    }

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey
      },
      body: JSON.stringify(req.body)
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = { detail: responseText };
    }

    if (!response.ok) {
      throw new Error(data?.error?.message || data?.detail || `NVIDIA NIM Chat failed: ${response.statusText}`);
    }
    res.json(data);
  } catch (err) {
    console.error('NVIDIA Chat Proxy Error:', err);
    res.status(500).json({ success: false, detail: err.message });
  }
});

app.post('/api/nvidia/transcribe', async (req, res) => {
  try {
    const { audioBase64, model } = req.body;
    let apiKey = req.headers['authorization'];
    
    // Fallback to server-side .env key if client key is missing
    if (!apiKey || apiKey === 'Bearer ' || apiKey === 'Bearer null' || apiKey === 'Bearer undefined' || apiKey === 'Bearer ""') {
      if (process.env.NVIDIA_API_KEY) {
        apiKey = `Bearer ${process.env.NVIDIA_API_KEY}`;
      } else {
        return res.status(401).json({ success: false, detail: 'NVIDIA NIM API Key not configured on client or server.' });
      }
    }

    if (!audioBase64) {
      return res.status(400).json({ success: false, detail: 'audioBase64 is required' });
    }

    const buffer = Buffer.from(audioBase64, 'base64');
    const formData = new FormData();
    formData.append('file', new Blob([buffer], { type: 'audio/webm' }), 'audio.webm');
    formData.append('model', model || 'nvidia/parakeet-tdt-0.6b-v3');
    formData.append('response_format', 'json');

    const response = await fetch('https://integrate.api.nvidia.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': apiKey
      },
      body: formData
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = { detail: responseText };
    }

    if (!response.ok) {
      throw new Error(data?.error?.message || data?.detail || `NVIDIA NIM transcription failed: ${response.statusText}`);
    }
    res.json(data);
  } catch (err) {
    console.error('NVIDIA Transcribe Proxy Error:', err);
    res.status(500).json({ success: false, detail: err.message });
  }
});

// Fallback all other routes to index.html (for React SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Production server running on port ${PORT}`);
  console.log(`Access application at http://localhost:${PORT}`);
});

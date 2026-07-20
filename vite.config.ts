import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import dotenv from 'dotenv'
import { sendOtpEmail, sendResetEmail, sendInviteEmail, sendMeetingLogEmail } from './smtpService.js'

dotenv.config()

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'smtp-mail-sender',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const url = req.url || '';
          
          if (req.method === 'GET' && url.startsWith('/api/config')) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              hasNvidiaKey: !!process.env.NVIDIA_API_KEY,
              hasOpenaiKey: !!process.env.OPENAI_API_KEY,
              hasGroqKey: !!process.env.GROQ_API_KEY,
              hasGeminiKey: !!process.env.GEMINI_API_KEY
            }));
            return;
          }

          if (req.method === 'POST' && (url.startsWith('/api/auth/send-otp') || url.startsWith('/api/auth/send-reset-code') || url.startsWith('/api/auth/send-invite') || url.startsWith('/api/auth/send-meeting-log'))) {
            let body = '';
            req.on('data', chunk => {
              body += chunk;
            });
            
            req.on('end', async () => {
              try {
                const parsed = JSON.parse(body);
                const { email, username, code, otp, orgName, inviteLink, title, dateTime, transcript, summary, audioBase64 } = parsed;

                if (url.startsWith('/api/auth/send-otp')) {
                  await sendOtpEmail(email, otp);
                } else if (url.startsWith('/api/auth/send-reset-code')) {
                  await sendResetEmail(email, username, code);
                } else if (url.startsWith('/api/auth/send-invite')) {
                  await sendInviteEmail(email, orgName, inviteLink);
                } else if (url.startsWith('/api/auth/send-meeting-log')) {
                  await sendMeetingLogEmail(email, username, title, dateTime, transcript, summary, audioBase64);
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
              } catch (err: any) {
                console.error('SMTP Middleware Mailer Error:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, detail: err.message || 'SMTP transmission failure' }));
              }
            });
            return;
          }

          if (req.method === 'POST' && url.startsWith('/api/nvidia/')) {
            let body = '';
            req.on('data', chunk => {
              body += chunk;
            });
            
            req.on('end', async () => {
              try {
                const parsed = JSON.parse(body);
                let apiKey = req.headers['authorization'];

                if (!apiKey || apiKey === 'Bearer ' || apiKey === 'Bearer null' || apiKey === 'Bearer undefined' || apiKey === 'Bearer ""') {
                  if (process.env.NVIDIA_API_KEY) {
                    apiKey = `Bearer ${process.env.NVIDIA_API_KEY}`;
                  } else {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, detail: 'NVIDIA NIM API Key not configured on client or server.' }));
                    return;
                  }
                }

                if (url.startsWith('/api/nvidia/chat')) {
                  const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': apiKey
                    },
                    body: JSON.stringify(parsed)
                  });
                  const responseText = await response.text();
                  let data;
                  try {
                    data = JSON.parse(responseText);
                  } catch (e) {
                    data = { detail: responseText };
                  }
                  res.writeHead(response.status, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify(data));
                } else if (url.startsWith('/api/nvidia/transcribe')) {
                  const { audioBase64, model } = parsed;
                  const buffer = Buffer.from(audioBase64, 'base64');
                  const formData = new FormData();
                  formData.append('file', new Blob([buffer], { type: 'audio/webm' }), 'audio.webm');
                  formData.append('model', model || 'nvidia/whisper-large-v3');
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
                  res.writeHead(response.status, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify(data));
                }
              } catch (err: any) {
                console.error('NVIDIA Dev Proxy Error:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, detail: err.message || 'NVIDIA Proxy Error' }));
              }
            });
            return;
          }
          next();
        });
      }
    }
  ],
})

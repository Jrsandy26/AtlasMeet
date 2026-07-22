import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import dotenv from 'dotenv'
import { sendOtpEmail, sendResetEmail, sendInviteEmail, sendMeetingLogEmail } from './smtpService.js'
import { createAdminClient } from '@supabase/server/core'

dotenv.config()

let supabaseAdmin: any = null;
function getSupabaseAdmin() {
  if (supabaseAdmin) return supabaseAdmin;
  try {
    const secretKey = process.env.SUPABASE_SECRET_KEY;
    if (secretKey && secretKey.includes('•')) {
      console.error('\n========================================================================\n' +
                    'ERROR: SUPABASE_SECRET_KEY in your .env contains bullet points (••••).\n' +
                    'Please replace it with your actual unmasked Secret/Service Key from the\n' +
                    'Supabase API Settings for database requests to succeed.\n' +
                    '========================================================================\n');
      return null;
    }
    supabaseAdmin = createAdminClient();
    return supabaseAdmin;
  } catch (e) {
    console.error('Failed to initialize Supabase Admin Client. Check env keys.', e);
    return null;
  }
}

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
              hasGeminiKey: !!process.env.GEMINI_API_KEY,
              hasOpenrouterKey: !!process.env.OPENROUTER_API_KEY
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
                  let response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': apiKey
                    },
                    body: JSON.stringify(parsed)
                  });
                  let responseText = await response.text();
                  let data;
                  try {
                    data = JSON.parse(responseText);
                  } catch (e) {
                    data = { detail: responseText };
                  }

                  const requestedModel = parsed.model;
                  if (!response.ok && requestedModel !== 'meta/llama-3.3-70b-instruct') {
                    console.warn(`[Dev Proxy] NVIDIA NIM Chat failed for ${requestedModel}. Falling back to meta/llama-3.3-70b-instruct...`);
                    const fallbackBody = { ...parsed, model: 'meta/llama-3.3-70b-instruct' };
                    response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': apiKey
                      },
                      body: JSON.stringify(fallbackBody)
                    });
                    responseText = await response.text();
                    try {
                      data = JSON.parse(responseText);
                    } catch (e) {
                      data = { detail: responseText };
                    }
                  }

                  res.writeHead(response.status, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify(data));
                } else if (url.startsWith('/api/nvidia/transcribe')) {
                  const { audioBase64, model } = parsed;
                  const buffer = Buffer.from(audioBase64, 'base64');
                  let activeModel = model || 'nvidia/parakeet-tdt-0.6b-v3';

                  const makeTranscribeRequest = async (modelName: string) => {
                    const formData = new FormData();
                    formData.append('file', new Blob([buffer], { type: 'audio/webm' }), 'audio.webm');
                    formData.append('model', modelName);
                    formData.append('response_format', 'json');

                    return fetch('https://integrate.api.nvidia.com/v1/audio/transcriptions', {
                      method: 'POST',
                      headers: {
                        'Authorization': apiKey
                      },
                      body: formData
                    });
                  };

                  let response = await makeTranscribeRequest(activeModel);
                  let responseText = await response.text();
                  let data;
                  try {
                    data = JSON.parse(responseText);
                  } catch (e) {
                    data = { detail: responseText };
                  }

                  if (!response.ok && activeModel !== 'nvidia/parakeet-tdt-0.6b-v3') {
                    console.warn(`[Dev Proxy] NVIDIA NIM Transcription failed for ${activeModel}. Falling back to nvidia/parakeet-tdt-0.6b-v3...`);
                    response = await makeTranscribeRequest('nvidia/parakeet-tdt-0.6b-v3');
                    responseText = await response.text();
                    try {
                      data = JSON.parse(responseText);
                    } catch (e) {
                      data = { detail: responseText };
                    }
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

          if (req.method === 'POST' && url.startsWith('/api/groq/')) {
            let body = '';
            req.on('data', chunk => {
              body += chunk;
            });
            
            req.on('end', async () => {
              try {
                const parsed = JSON.parse(body);
                let apiKey = req.headers['authorization'];

                if (!apiKey || apiKey === 'Bearer ' || apiKey === 'Bearer null' || apiKey === 'Bearer undefined' || apiKey === 'Bearer ""' || apiKey === 'Bearer "server"' || apiKey === 'Bearer server') {
                  if (process.env.GROQ_API_KEY) {
                    apiKey = `Bearer ${process.env.GROQ_API_KEY}`;
                  } else {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, detail: 'Groq API Key not configured on client or server.' }));
                    return;
                  }
                }

                if (url.startsWith('/api/groq/chat')) {
                  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
                } else if (url.startsWith('/api/groq/transcribe')) {
                  const { audioBase64, model } = parsed;
                  const buffer = Buffer.from(audioBase64, 'base64');
                  const formData = new FormData();
                  formData.append('file', new Blob([buffer], { type: 'audio/webm' }), 'audio.webm');
                  formData.append('model', model || 'whisper-large-v3-turbo');
                  formData.append('response_format', 'json');

                  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
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
                console.error('Groq Dev Proxy Error:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, detail: err.message || 'Groq Proxy Error' }));
              }
            });
            return;
          }

          if (req.method === 'POST' && url.startsWith('/api/openrouter/')) {
            let body = '';
            req.on('data', chunk => {
              body += chunk;
            });
            
            req.on('end', async () => {
              try {
                const parsed = JSON.parse(body);
                let apiKey = req.headers['authorization'];

                if (!apiKey || apiKey === 'Bearer ' || apiKey === 'Bearer null' || apiKey === 'Bearer undefined' || apiKey === 'Bearer ""' || apiKey === 'Bearer "server"' || apiKey === 'Bearer server') {
                  if (process.env.OPENROUTER_API_KEY) {
                    apiKey = `Bearer ${process.env.OPENROUTER_API_KEY}`;
                  } else {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, detail: 'OpenRouter API Key not configured on client or server.' }));
                    return;
                  }
                }

                const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': apiKey,
                    'HTTP-Referer': req.headers['referer'] || 'http://localhost:5173',
                    'X-Title': 'AtlasMeet'
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
              } catch (err: any) {
                console.error('OpenRouter Dev Proxy Error:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, detail: err.message || 'OpenRouter Proxy Error' }));
              }
            });
            return;
          }

          // Supabase database endpoints
          if (url.startsWith('/api/auth/users') || url.startsWith('/api/auth/login-logs') || url.startsWith('/api/auth/mail-logs') || url.startsWith('/api/auth/reset-requests')) {
            const supabase = getSupabaseAdmin();
            if (!supabase) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Supabase client not initialized. Check console logs.' }));
              return;
            }

            if (req.method === 'GET') {
              try {
                let data, error;
                if (url.startsWith('/api/auth/users')) {
                  ({ data, error } = await supabase.from('users').select('*'));
                } else if (url.startsWith('/api/auth/login-logs')) {
                  ({ data, error } = await supabase.from('login_logs').select('*').order('timestamp', { ascending: false }).limit(100));
                } else if (url.startsWith('/api/auth/mail-logs')) {
                  ({ data, error } = await supabase.from('mail_logs').select('*').order('timestamp', { ascending: false }).limit(100));
                } else if (url.startsWith('/api/auth/reset-requests')) {
                  ({ data, error } = await supabase.from('reset_requests').select('*'));
                }
                
                if (error) {
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: error.message }));
                  return;
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(data || []));
              } catch (err: any) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
              }
              return;
            }

            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk; });
              req.on('end', async () => {
                try {
                  const parsed = JSON.parse(body);
                  let data, error;
                  if (url.startsWith('/api/auth/users')) {
                    ({ data, error } = await supabase.from('users').upsert(parsed).select());
                  } else if (url.startsWith('/api/auth/login-logs')) {
                    ({ data, error } = await supabase.from('login_logs').insert(parsed).select());
                  } else if (url.startsWith('/api/auth/mail-logs')) {
                    ({ data, error } = await supabase.from('mail_logs').insert(parsed).select());
                  } else if (url.startsWith('/api/auth/reset-requests')) {
                    ({ data, error } = await supabase.from('reset_requests').upsert(parsed).select());
                  }

                  if (error) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: error.message }));
                    return;
                  }
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify(data ? (data[0] || data) : {}));
                } catch (err: any) {
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: err.message }));
                }
              });
              return;
            }

            if (req.method === 'DELETE') {
              try {
                let error;
                if (url.startsWith('/api/auth/users/')) {
                  const id = url.split('/').pop();
                  ({ error } = await supabase.from('users').delete().eq('id', id));
                } else if (url.startsWith('/api/auth/reset-requests/')) {
                  const id = url.split('/').pop();
                  ({ error } = await supabase.from('reset_requests').delete().eq('id', id));
                }
                
                if (error) {
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: error.message }));
                  return;
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
              } catch (err: any) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
              }
              return;
            }
          }

          next();
        });
      }
    }
  ],
})

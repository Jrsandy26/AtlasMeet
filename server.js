import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();
import { sendOtpEmail, sendResetEmail, sendInviteEmail, sendMeetingLogEmail } from './smtpService.js';
import { createAdminClient } from '@supabase/server/core';

let supabaseAdmin = null;
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
    console.error('Failed to initialize Supabase Admin Client. Check your env keys.', e);
    return null;
  }
}

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
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    hasOpenrouterKey: !!process.env.OPENROUTER_API_KEY
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

    let response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey
      },
      body: JSON.stringify(req.body)
    });

    let responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = { detail: responseText };
    }

    const requestedModel = req.body.model;
    if (!response.ok && requestedModel !== 'meta/llama-3.3-70b-instruct') {
      console.warn(`NVIDIA NIM Chat failed for ${requestedModel}. Falling back to meta/llama-3.3-70b-instruct...`);
      const fallbackBody = { ...req.body, model: 'meta/llama-3.3-70b-instruct' };
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
    let activeModel = model || 'nvidia/parakeet-tdt-0.6b-v3';

    const makeTranscribeRequest = async (modelName) => {
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
      console.warn(`NVIDIA NIM Transcription failed for ${activeModel}. Falling back to nvidia/parakeet-tdt-0.6b-v3...`);
      response = await makeTranscribeRequest('nvidia/parakeet-tdt-0.6b-v3');
      responseText = await response.text();
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        data = { detail: responseText };
      }
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

app.post('/api/groq/chat', async (req, res) => {
  try {
    let apiKey = req.headers['authorization'];
    if (!apiKey || apiKey === 'Bearer ' || apiKey === 'Bearer null' || apiKey === 'Bearer undefined' || apiKey === 'Bearer ""' || apiKey === 'Bearer "server"' || apiKey === 'Bearer server') {
      if (process.env.GROQ_API_KEY) {
        apiKey = `Bearer ${process.env.GROQ_API_KEY}`;
      } else {
        return res.status(401).json({ success: false, detail: 'Groq API Key not configured on client or server.' });
      }
    }
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey
      },
      body: JSON.stringify(req.body)
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return res.status(response.status).json(errData);
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Groq chat proxy error:', err);
    res.status(500).json({ detail: err.message });
  }
});

app.post('/api/groq/transcribe', async (req, res) => {
  try {
    const { audioBase64, model } = req.body;
    let apiKey = req.headers['authorization'];
    if (!apiKey || apiKey === 'Bearer ' || apiKey === 'Bearer null' || apiKey === 'Bearer undefined' || apiKey === 'Bearer ""' || apiKey === 'Bearer "server"' || apiKey === 'Bearer server') {
      if (process.env.GROQ_API_KEY) {
        apiKey = `Bearer ${process.env.GROQ_API_KEY}`;
      } else {
        return res.status(401).json({ success: false, detail: 'Groq API Key not configured on client or server.' });
      }
    }

    if (!audioBase64) {
      return res.status(400).json({ success: false, detail: 'audioBase64 is required' });
    }

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

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return res.status(response.status).json(errData);
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Groq transcription proxy error:', err);
    res.status(500).json({ detail: err.message });
  }
});

// Supabase Database API Routes
app.get('/api/auth/users', async (req, res) => {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase client not initialized. Check server logs.' });
  }
  try {
    const { data, error } = await supabase.from('users').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/users', async (req, res) => {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase client not initialized. Check server logs.' });
  }
  try {
    const user = req.body;
    const { data, error } = await supabase.from('users').upsert(user).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data ? (data[0] || data) : {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/auth/users/:id', async (req, res) => {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase client not initialized. Check server logs.' });
  }
  try {
    const { id } = req.params;
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/login-logs', async (req, res) => {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase client not initialized. Check server logs.' });
  }
  try {
    const { data, error } = await supabase.from('login_logs').select('*').order('timestamp', { ascending: false }).limit(100);
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login-logs', async (req, res) => {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase client not initialized. Check server logs.' });
  }
  try {
    const log = req.body;
    const { data, error } = await supabase.from('login_logs').insert(log).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data ? (data[0] || data) : {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/mail-logs', async (req, res) => {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase client not initialized. Check server logs.' });
  }
  try {
    const { data, error } = await supabase.from('mail_logs').select('*').order('timestamp', { ascending: false }).limit(100);
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/mail-logs', async (req, res) => {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase client not initialized. Check server logs.' });
  }
  try {
    const log = req.body;
    const { data, error } = await supabase.from('mail_logs').insert(log).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data ? (data[0] || data) : {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/reset-requests', async (req, res) => {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase client not initialized. Check server logs.' });
  }
  try {
    const { data, error } = await supabase.from('reset_requests').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/reset-requests', async (req, res) => {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase client not initialized. Check server logs.' });
  }
  try {
    const request = req.body;
    const { data, error } = await supabase.from('reset_requests').upsert(request).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data ? (data[0] || data) : {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/auth/reset-requests/:id', async (req, res) => {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase client not initialized. Check server logs.' });
  }
  try {
    const { id } = req.params;
    const { error } = await supabase.from('reset_requests').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/openrouter/chat', async (req, res) => {
  try {
    let apiKey = req.headers['authorization'];
    if (!apiKey || apiKey === 'Bearer ' || apiKey === 'Bearer null' || apiKey === 'Bearer undefined' || apiKey === 'Bearer ""' || apiKey === 'Bearer "server"' || apiKey === 'Bearer server') {
      if (process.env.OPENROUTER_API_KEY) {
        apiKey = `Bearer ${process.env.OPENROUTER_API_KEY}`;
      } else {
        return res.status(401).json({ success: false, detail: 'OpenRouter API Key not configured on client or server.' });
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
      body: JSON.stringify(req.body)
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return res.status(response.status).json(errData);
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('OpenRouter chat proxy error:', err);
    res.status(500).json({ detail: err.message });
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

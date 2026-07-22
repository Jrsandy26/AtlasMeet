import { sendMeetingLogEmail } from '../../smtpService.js';
import dotenv from 'dotenv';
dotenv.config();

export async function handler(event, context) {
  const path = event.path;
  const method = event.httpMethod;
  const headers = event.headers;

  // Set CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (method === 'OPTIONS') {
    return { 
      statusCode: 200, 
      headers: corsHeaders, 
      body: '' 
    };
  }

  try {
    // 1. GET /api/config
    if (method === 'GET' && path.endsWith('/api/config')) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          hasNvidiaKey: !!process.env.NVIDIA_API_KEY,
          hasGroqKey: !!process.env.GROQ_API_KEY,
          hasOpenaiKey: !!process.env.OPENAI_API_KEY,
          hasGeminiKey: !!process.env.GEMINI_API_KEY,
          hasOpenrouterKey: !!process.env.OPENROUTER_API_KEY
        })
      };
    }

    // 2. POST /api/nvidia/chat
    if (method === 'POST' && path.endsWith('/api/nvidia/chat')) {
      let apiKey = headers['authorization'];
      if (!apiKey || apiKey === 'Bearer ' || apiKey === 'Bearer null' || apiKey === 'Bearer undefined' || apiKey === 'Bearer ""') {
        if (process.env.NVIDIA_API_KEY) {
          apiKey = `Bearer ${process.env.NVIDIA_API_KEY}`;
        } else {
          return {
            statusCode: 401,
            headers: corsHeaders,
            body: JSON.stringify({ success: false, detail: 'NVIDIA NIM API Key not configured on client or server.' })
          };
        }
      }

      const body = JSON.parse(event.body || '{}');
      let response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': apiKey
        },
        body: JSON.stringify(body)
      });

      let responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        data = { detail: responseText };
      }

      const requestedModel = body.model;
      if (!response.ok && requestedModel !== 'meta/llama-3.3-70b-instruct') {
        console.warn(`[Netlify Function] NVIDIA NIM Chat failed for ${requestedModel}. Falling back to meta/llama-3.3-70b-instruct...`);
        const fallbackBody = { ...body, model: 'meta/llama-3.3-70b-instruct' };
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

      return {
        statusCode: response.status,
        headers: corsHeaders,
        body: JSON.stringify(data)
      };
    }

    // 3. POST /api/nvidia/transcribe
    if (method === 'POST' && path.endsWith('/api/nvidia/transcribe')) {
      const { audioBase64, model } = JSON.parse(event.body || '{}');
      let apiKey = headers['authorization'];
      
      if (!apiKey || apiKey === 'Bearer ' || apiKey === 'Bearer null' || apiKey === 'Bearer undefined' || apiKey === 'Bearer ""') {
        if (process.env.NVIDIA_API_KEY) {
          apiKey = `Bearer ${process.env.NVIDIA_API_KEY}`;
        } else {
          return {
            statusCode: 401,
            headers: corsHeaders,
            body: JSON.stringify({ success: false, detail: 'NVIDIA NIM API Key not configured on client or server.' })
          };
        }
      }

      if (!audioBase64) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, detail: 'audioBase64 is required' })
        };
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
        console.warn(`[Netlify Function] NVIDIA NIM Transcription failed for ${activeModel}. Falling back to nvidia/parakeet-tdt-0.6b-v3...`);
        response = await makeTranscribeRequest('nvidia/parakeet-tdt-0.6b-v3');
        responseText = await response.text();
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          data = { detail: responseText };
        }
      }

      return {
        statusCode: response.status,
        headers: corsHeaders,
        body: JSON.stringify(data)
      };
    }

    // 4. POST /api/send-log
    if (method === 'POST' && path.endsWith('/api/send-log')) {
      const { email, username, title, dateTime, transcript, summary, audioBase64 } = JSON.parse(event.body || '{}');
      await sendMeetingLogEmail(email, username, title, dateTime, transcript, summary, audioBase64);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, message: 'Email sent successfully' })
      };
    }

    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, detail: `Route ${method} ${path} not found` })
    };

  } catch (err) {
    console.error('Netlify API Handler Error:', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, detail: err.message })
    };
  }
}

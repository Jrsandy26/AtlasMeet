export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ detail: 'Method Not Allowed' });
  }

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
      console.warn(`[Vercel Serverless] NVIDIA NIM Transcription failed for ${activeModel}. Falling back to nvidia/parakeet-tdt-0.6b-v3...`);
      response = await makeTranscribeRequest('nvidia/parakeet-tdt-0.6b-v3');
      responseText = await response.text();
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        data = { detail: responseText };
      }
    }

    return res.status(response.status).json(data);
  } catch (err) {
    console.error('Vercel NVIDIA Transcribe Proxy Error:', err);
    return res.status(500).json({ success: false, detail: err.message });
  }
}

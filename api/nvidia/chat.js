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
      console.warn(`[Vercel Serverless] NVIDIA NIM Chat failed for ${requestedModel}. Falling back to meta/llama-3.3-70b-instruct...`);
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

    return res.status(response.status).json(data);
  } catch (err) {
    console.error('Vercel NVIDIA Chat Proxy Error:', err);
    return res.status(500).json({ success: false, detail: err.message });
  }
}

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

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = { detail: responseText };
    }

    return res.status(response.status).json(data);
  } catch (err) {
    console.error('Vercel OpenRouter Chat Proxy Error:', err);
    return res.status(500).json({ success: false, detail: err.message });
  }
}

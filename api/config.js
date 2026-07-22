export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ detail: 'Method Not Allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  res.status(200).json({
    hasNvidiaKey: !!process.env.NVIDIA_API_KEY,
    hasGroqKey: !!process.env.GROQ_API_KEY,
    hasOpenaiKey: !!process.env.OPENAI_API_KEY,
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    hasOpenrouterKey: !!process.env.OPENROUTER_API_KEY
  });
}

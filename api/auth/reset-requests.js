import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabase = getSupabase();
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase client not initialized. Check SUPABASE_URL and SUPABASE_SECRET_KEY env vars.' });
  }

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('reset_requests').select('*');
      if (error) return res.status(500).json({ error: error.message });
      return res.json(data || []);
    }

    if (req.method === 'POST') {
      const request = req.body;
      const { data, error } = await supabase.from('reset_requests').upsert(request).select();
      if (error) return res.status(500).json({ error: error.message });
      return res.json(data ? (data[0] || data) : {});
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

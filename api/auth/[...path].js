import { createClient } from '@supabase/supabase-js';
import { sendOtpEmail, sendResetEmail, sendInviteEmail, sendMeetingLogEmail } from '../../smtpService.js';

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

  // Resolve the sub-path from the catch-all segment
  // e.g. /api/auth/users -> ['users']
  // e.g. /api/auth/users/123 -> ['users', '123']
  const pathSegments = Array.isArray(req.query.path)
    ? req.query.path
    : req.query.path
    ? [req.query.path]
    : [];

  const route = pathSegments[0] || '';
  const subId = pathSegments[1] || null;
  const method = req.method;

  // ─── SMTP ROUTES (no Supabase needed) ───────────────────────────────────────

  if (route === 'send-otp' && method === 'POST') {
    try {
      const { email, otp } = req.body;
      await sendOtpEmail(email, otp);
      return res.json({ success: true });
    } catch (err) {
      console.error('Send OTP Error:', err);
      return res.status(500).json({ success: false, detail: err.message });
    }
  }

  if (route === 'send-reset-code' && method === 'POST') {
    try {
      const { email, username, code } = req.body;
      await sendResetEmail(email, username, code);
      return res.json({ success: true });
    } catch (err) {
      console.error('Send Reset Code Error:', err);
      return res.status(500).json({ success: false, detail: err.message });
    }
  }

  if (route === 'send-invite' && method === 'POST') {
    try {
      const { email, orgName, inviteLink } = req.body;
      await sendInviteEmail(email, orgName, inviteLink);
      return res.json({ success: true });
    } catch (err) {
      console.error('Send Invite Error:', err);
      return res.status(500).json({ success: false, detail: err.message });
    }
  }

  if (route === 'send-meeting-log' && method === 'POST') {
    try {
      const { email, username, title, dateTime, transcript, summary, audioBase64 } = req.body;
      await sendMeetingLogEmail(email, username, title, dateTime, transcript, summary, audioBase64);
      return res.json({ success: true });
    } catch (err) {
      console.error('Send Meeting Log Error:', err);
      return res.status(500).json({ success: false, detail: err.message });
    }
  }

  // ─── SUPABASE ROUTES ────────────────────────────────────────────────────────

  const supabase = getSupabase();
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not initialized. Check SUPABASE_URL and SUPABASE_SECRET_KEY.' });
  }

  try {
    // ── /api/auth/users ──
    if (route === 'users') {
      if (subId && method === 'DELETE') {
        const { error } = await supabase.from('users').delete().eq('id', subId);
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ success: true });
      }
      if (method === 'GET') {
        const { data, error } = await supabase.from('users').select('*');
        if (error) return res.status(500).json({ error: error.message });
        return res.json(data || []);
      }
      if (method === 'POST') {
        const { data, error } = await supabase.from('users').upsert(req.body).select();
        if (error) return res.status(500).json({ error: error.message });
        return res.json(data ? (data[0] || data) : {});
      }
    }

    // ── /api/auth/login-logs ──
    if (route === 'login-logs') {
      if (method === 'GET') {
        const { data, error } = await supabase
          .from('login_logs').select('*')
          .order('timestamp', { ascending: false }).limit(100);
        if (error) return res.status(500).json({ error: error.message });
        return res.json(data || []);
      }
      if (method === 'POST') {
        const { data, error } = await supabase.from('login_logs').insert(req.body).select();
        if (error) return res.status(500).json({ error: error.message });
        return res.json(data ? (data[0] || data) : {});
      }
    }

    // ── /api/auth/mail-logs ──
    if (route === 'mail-logs') {
      if (method === 'GET') {
        const { data, error } = await supabase
          .from('mail_logs').select('*')
          .order('timestamp', { ascending: false }).limit(100);
        if (error) return res.status(500).json({ error: error.message });
        return res.json(data || []);
      }
      if (method === 'POST') {
        const { data, error } = await supabase.from('mail_logs').insert(req.body).select();
        if (error) return res.status(500).json({ error: error.message });
        return res.json(data ? (data[0] || data) : {});
      }
    }

    // ── /api/auth/reset-requests ──
    if (route === 'reset-requests') {
      if (subId && method === 'DELETE') {
        const { error } = await supabase.from('reset_requests').delete().eq('id', subId);
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ success: true });
      }
      if (method === 'GET') {
        const { data, error } = await supabase.from('reset_requests').select('*');
        if (error) return res.status(500).json({ error: error.message });
        return res.json(data || []);
      }
      if (method === 'POST') {
        const { data, error } = await supabase.from('reset_requests').upsert(req.body).select();
        if (error) return res.status(500).json({ error: error.message });
        return res.json(data ? (data[0] || data) : {});
      }
    }

    return res.status(404).json({ error: `Unknown auth route: ${route}` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

import { sendMeetingLogEmail } from '../../../smtpService.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { email, username, title, dateTime, transcript, summary, audioBase64 } = req.body;
    await sendMeetingLogEmail(email, username, title, dateTime, transcript, summary, audioBase64);
    return res.json({ success: true });
  } catch (err) {
    console.error('Send Meeting Log Error:', err);
    return res.status(500).json({ success: false, detail: err.message });
  }
}

import { sendInviteEmail } from '../../../smtpService.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { email, orgName, inviteLink } = req.body;
    await sendInviteEmail(email, orgName, inviteLink);
    return res.json({ success: true });
  } catch (err) {
    console.error('Send Invite Error:', err);
    return res.status(500).json({ success: false, detail: err.message });
  }
}

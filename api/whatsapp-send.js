// Vercel serverless function — sends WhatsApp message via Twilio
// POST /api/whatsapp-send
// Body (JSON): { to: "+61412345678", body: "Hello!" }
//
// Required env vars:
//   TWILIO_ACCOUNT_SID
//   TWILIO_AUTH_TOKEN
//   TWILIO_WHATSAPP_FROM  — e.g. "whatsapp:+14155238886"

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }

  let body = '';
  await new Promise((resolve) => {
    req.on('data', chunk => { body += chunk; });
    req.on('end', resolve);
  });

  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    res.status(400).json({ error: 'Invalid JSON' });
    return;
  }

  const { to, message } = payload;
  if (!to || !message) {
    res.status(400).json({ error: 'Missing to or message' });
    return;
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  const from       = process.env.TWILIO_WHATSAPP_FROM; // e.g. "whatsapp:+14155238886"

  if (!accountSid || !authToken || !from) {
    res.status(500).json({ error: 'Missing Twilio env vars' });
    return;
  }

  const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  const params = new URLSearchParams({
    From: from,
    To:   toNumber,
    Body: message,
  });

  const response = await fetch(twilioUrl, {
    method:  'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type':  'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const result = await response.json();

  if (!response.ok) {
    console.error('[whatsapp-send] Twilio error:', result);
    res.status(500).json({ error: result.message || 'Twilio send failed' });
    return;
  }

  res.status(200).json({ ok: true, sid: result.sid });
}

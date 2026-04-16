// Vercel serverless function — receives Twilio WhatsApp webhooks
// POST https://nomaad-ai-platform.vercel.app/api/whatsapp
//
// Required env vars (set in Vercel dashboard + .env.local):
//   SUPABASE_URL            — same as VITE_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY — from Supabase Settings → API (never expose client-side)
//   NOMAAD_OWNER_USER_ID    — your Supabase user UUID (for single-user test)

import { createClient } from '@supabase/supabase-js';

export const config = { api: { bodyParser: false } };

function parseFormBody(raw) {
  const params = new URLSearchParams(raw);
  const obj = {};
  for (const [k, v] of params.entries()) obj[k] = v;
  return obj;
}

export default async function handler(req, res) {
  // Only accept POST from Twilio
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }

  // Read raw body (Twilio sends application/x-www-form-urlencoded)
  const raw = await new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });

  const { From, To, Body: MsgBody, MessageSid } = parseFormBody(raw);

  if (!From || !MsgBody) {
    res.status(200).setHeader('Content-Type', 'text/xml').send('<Response/>');
    return;
  }

  // Init Supabase with service role (bypasses RLS so webhook can write)
  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Identify the Nomaad user who owns this Twilio number
  // For single-user test: set NOMAAD_OWNER_USER_ID in env
  // For multi-user production: look up by whatsapp_number in profiles
  let userId = process.env.NOMAAD_OWNER_USER_ID;

  if (!userId) {
    // Multi-user: look up by registered whatsapp_number
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('whatsapp_number', To)
      .single();

    if (!profile) {
      console.error('No Nomaad user found for WhatsApp number:', To);
      res.status(200).setHeader('Content-Type', 'text/xml').send('<Response/>');
      return;
    }
    userId = profile.id;
  }

  // Sender display name: strip "whatsapp:" prefix
  const senderPhone = From.replace('whatsapp:', '');
  const senderName  = senderPhone; // can be enriched later via Twilio lookup

  // Find or create a WhatsApp channel for this sender
  let { data: channel, error: chanErr } = await supabase
    .from('channels')
    .select('id')
    .eq('user_id', userId)
    .eq('platform', 'whatsapp')
    .eq('external_phone', senderPhone)
    .single();

  if (!channel) {
    const { data: newChan, error: newChanErr } = await supabase
      .from('channels')
      .insert({
        user_id:        userId,
        name:           senderPhone,
        platform:       'whatsapp',
        external_phone: senderPhone,
        is_direct:      true,
        members:        [senderPhone],
      })
      .select()
      .single();

    if (newChanErr) {
      console.error('Failed to create channel:', newChanErr);
      res.status(200).setHeader('Content-Type', 'text/xml').send('<Response/>');
      return;
    }
    channel = newChan;
  }

  // Insert the message
  const { error: msgErr } = await supabase.from('messages').insert({
    channel_id:         channel.id,
    user_id:            userId,
    content:            MsgBody,
    sender_name:        senderName,
    sender_phone:       senderPhone,
    platform:           'whatsapp',
    twilio_message_sid: MessageSid,
  });

  if (msgErr) {
    console.error('Failed to insert message:', msgErr);
  }

  // Return empty TwiML — no auto-reply for now
  res.status(200).setHeader('Content-Type', 'text/xml').send('<Response/>');
}

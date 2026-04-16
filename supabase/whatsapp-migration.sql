-- WhatsApp integration migration
-- Run in: Supabase Dashboard → SQL Editor

-- Add WhatsApp fields to channels
ALTER TABLE public.channels
  ADD COLUMN IF NOT EXISTS platform text DEFAULT 'internal',
  ADD COLUMN IF NOT EXISTS external_phone text;

-- Add WhatsApp fields to messages
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS sender_phone text,
  ADD COLUMN IF NOT EXISTS platform text DEFAULT 'internal',
  ADD COLUMN IF NOT EXISTS twilio_message_sid text;

-- Add WhatsApp number to profiles (for multi-user matching)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS whatsapp_number text;

-- Allow service role inserts from webhook (RLS already allows user_id match;
-- the webhook uses service role key so RLS is bypassed — no extra policy needed)

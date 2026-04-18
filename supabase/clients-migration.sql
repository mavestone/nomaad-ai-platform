-- ============================================================
-- NOMAAD — Clients Lifecycle Migration
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Rename prospect stages to full lifecycle stages
ALTER TABLE public.prospects DROP CONSTRAINT IF EXISTS prospects_stage_check;
ALTER TABLE public.prospects ADD CONSTRAINT prospects_stage_check
  CHECK (stage IN ('lead', 'contacted', 'proposal', 'active', 'done', 'lost'));

-- Migrate old stage values → new
UPDATE public.prospects SET stage = 'lead'   WHERE stage = 'new';
UPDATE public.prospects SET stage = 'active' WHERE stage IN ('qualified', 'negotiation', 'won');

-- 2. Add phone + source to prospects (richer client records)
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS phone text;

-- 3. Link projects → client
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.prospects(id) ON DELETE SET NULL;

-- 4. Link invoices → client
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.prospects(id) ON DELETE SET NULL;

-- 5. Create waitlist_signups table (for landing page)
CREATE TABLE IF NOT EXISTS public.waitlist_signups (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  source text default 'landing',
  created_at timestamptz default now()
);
ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Anyone can join waitlist"ON public.waitlist_signups FOR INSERT WITH CHECK (true);

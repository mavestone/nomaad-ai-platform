-- Full profiles table migration
-- Run this in Supabase Dashboard → SQL Editor

-- Core profile fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT 'away';

-- JSONB fields (social links + portfolio)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS portfolio_projects JSONB DEFAULT '[]'::jsonb;

-- Username (unique subdomain handle)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS profiles_username_idx ON profiles(username);

-- Username rate-limit tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username_changed_at TIMESTAMPTZ;

-- Enable RLS (idempotent)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Public read policy (for username.nomaad.ai pages)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles'
    AND policyname = 'Public profiles are viewable by everyone'
  ) THEN
    CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);
  END IF;
END
$$;

-- Users can update their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles'
    AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
  END IF;
END
$$;

-- Force PostgREST schema cache refresh
NOTIFY pgrst, 'reload schema';

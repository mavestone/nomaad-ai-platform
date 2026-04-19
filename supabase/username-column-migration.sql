-- Add username column to profiles table for username.nomaad.ai subdomain routing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS profiles_username_idx ON profiles(username);

-- Enable RLS (safe to run even if already enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read public profiles
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

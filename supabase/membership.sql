-- Add membership columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_member BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS member_since TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS member_expires_at TIMESTAMPTZ;

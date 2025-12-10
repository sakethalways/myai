-- Add is_discoverable column to profiles table if it doesn't exist
-- PostgreSQL syntax for Supabase
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_discoverable boolean DEFAULT true;

-- Update existing rows to be discoverable by default
UPDATE profiles
SET is_discoverable = true
WHERE is_discoverable IS NULL;

-- Create an index on is_discoverable for faster search queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_discoverable ON profiles(is_discoverable);

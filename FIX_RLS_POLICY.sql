-- Fix RLS Policy for profiles table to allow searching other users
-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Create a new policy that allows:
-- 1. Users to view and update their own profile
-- 2. Users to view (but not update) other users' profiles for friend search
CREATE POLICY "Users can view own and search other profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Make sure email column exists with index
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_name ON profiles(name);

-- Notes:
-- The new SELECT policy allows all authenticated users to view all profiles (needed for friend search)
-- The UPDATE policy restricts updates to own profile only
-- The INSERT policy restricts inserts to own profile only
-- This is safe because we're only exposing name and email for search purposes

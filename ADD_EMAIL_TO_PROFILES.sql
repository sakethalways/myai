-- Add email column to profiles table
ALTER TABLE profiles ADD COLUMN email TEXT;

-- Add index on email for faster search
CREATE INDEX idx_profiles_email ON profiles(email);

-- Notes:
-- After adding this column, you'll need to:
-- 1. Update the app to store user email in profiles table when they sign up
-- 2. Modify RLS policy if needed to allow email visibility for search functionality

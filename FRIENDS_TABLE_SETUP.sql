-- Friendships table for Connect to Friends feature
CREATE TABLE friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

-- Enable RLS on friendships table
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- RLS Policy - Users can only see their own friendships
CREATE POLICY "Users can view own friendships" ON friendships 
  FOR ALL USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_friendships_user_id ON friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON friendships(friend_id);

-- Notes:
-- - The UNIQUE constraint ensures no duplicate friendships
-- - The CHECK constraint prevents a user from being friends with themselves
-- - RLS ensures users can only see/manage their own friendships
-- - Indexes improve query performance for friend lookups

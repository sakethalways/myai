-- Fix RLS Policies to allow friend data viewing
-- This allows authenticated users to view other users' data for friend feature while keeping own data updates restricted

-- 1. Fix daily_entries RLS
DROP POLICY IF EXISTS "Users can view own daily entries" ON daily_entries;
CREATE POLICY "Users can view own and friends' daily entries" ON daily_entries
  FOR SELECT USING (auth.uid() = user_id OR user_id IN (
    SELECT friend_id FROM friendships WHERE user_id = auth.uid()
  ));
CREATE POLICY "Users can insert own daily entries" ON daily_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own daily entries" ON daily_entries
  FOR UPDATE USING (auth.uid() = user_id);

-- 2. Fix goals RLS
DROP POLICY IF EXISTS "Users can view own goals" ON goals;
CREATE POLICY "Users can view own and friends' goals" ON goals
  FOR SELECT USING (auth.uid() = user_id OR user_id IN (
    SELECT friend_id FROM friendships WHERE user_id = auth.uid()
  ));
CREATE POLICY "Users can insert own goals" ON goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON goals
  FOR UPDATE USING (auth.uid() = user_id);

-- 3. Fix ai_analyses RLS (if needed)
DROP POLICY IF EXISTS "Users can view own analyses" ON ai_analyses;
CREATE POLICY "Users can view own analyses" ON ai_analyses
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own analyses" ON ai_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own analyses" ON ai_analyses
  FOR UPDATE USING (auth.uid() = user_id);

-- 4. Make sure friendships RLS is correct
DROP POLICY IF EXISTS "Users can view own friendships" ON friendships;
CREATE POLICY "Users can view own friendships" ON friendships
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own friendships" ON friendships
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own friendships" ON friendships
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);

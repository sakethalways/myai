-- Fix goals table structure to prevent 409 conflicts
-- Make sure the table has proper primary key and constraints

-- Check if goals table exists and has proper structure
-- Run this SQL in Supabase to ensure goals table is correctly configured

-- 1. Ensure the goals table exists with correct columns
CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('short-term', 'long-term')),
  deadline DATE,
  completed BOOLEAN DEFAULT false,
  progress INTEGER DEFAULT 0,
  tasks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(user_id, id)
);

-- 2. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_type ON goals(type);
CREATE INDEX IF NOT EXISTS idx_goals_completed ON goals(completed);

-- 3. Enable RLS (Row Level Security)
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies if they don't exist
-- Users can view their own goals
CREATE POLICY "Users can view their own goals"
  ON goals FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own goals
CREATE POLICY "Users can insert their own goals"
  ON goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own goals
CREATE POLICY "Users can update their own goals"
  ON goals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own goals
CREATE POLICY "Users can delete their own goals"
  ON goals FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Create trigger to update updated_at on changes
DROP TRIGGER IF EXISTS update_goals_updated_at_trigger ON goals;
CREATE TRIGGER update_goals_updated_at_trigger
BEFORE UPDATE ON goals
FOR EACH ROW
EXECUTE FUNCTION update_goals_updated_at();

-- 7. Verify the table structure
-- Run this query to check everything is correct:
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'goals' 
-- ORDER BY ordinal_position;

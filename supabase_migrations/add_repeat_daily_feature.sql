-- Add repeat_daily column to daily_entries table for "Repeat Daily" feature

ALTER TABLE daily_entries 
ADD COLUMN IF NOT EXISTS repeat_daily BOOLEAN DEFAULT false;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_daily_entries_repeat_daily 
ON daily_entries(user_id, repeat_daily) 
WHERE repeat_daily = true;

-- Update existing entries to have repeat_daily = false
UPDATE daily_entries 
SET repeat_daily = false 
WHERE repeat_daily IS NULL;

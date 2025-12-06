# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1QFMwhA9rPHgWxJHMIbkFVfkGyL8e3tN_

## Prerequisites
- Node.js
- Supabase account and project

## Setup Supabase
1. Create a new Supabase project.
2. Go to Settings > API to get your `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
3. Run the following SQL in your Supabase SQL Editor to create the tables:

```sql
-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  age TEXT,
  height TEXT,
  weight TEXT
);

-- Daily entries table
CREATE TABLE daily_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  todos JSONB DEFAULT '[]',
  journal TEXT DEFAULT '',
  mood_score INTEGER DEFAULT 0,
  completed_count INTEGER DEFAULT 0,
  total_count INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);

-- Goals table
CREATE TABLE goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('short-term', 'long-term')),
  deadline DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  progress REAL DEFAULT 0,
  tasks JSONB DEFAULT '[]'
);

-- AI analyses table
CREATE TABLE ai_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('weekly', 'monthly')),
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE
);

-- User settings table for UI preferences (like popup tracking)
CREATE TABLE user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL,
  setting_value TEXT,
  UNIQUE(user_id, setting_key)
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can view own daily entries" ON daily_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own goals" ON goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own analyses" ON ai_analyses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own settings" ON user_settings FOR ALL USING (auth.uid() = user_id);
```

## Run Locally

1. Install dependencies:
   `npm install`
2. Create a `.env.local` file in the root directory with:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
3. Run the app:
   `npm run dev`

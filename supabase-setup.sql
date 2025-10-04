-- Create user_profiles table for QualifyFirst
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS user_profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  -- Demographics
  age TEXT,
  gender TEXT,
  location TEXT,
  employment TEXT,
  income TEXT,
  education TEXT,
  household_size TEXT,
  
  -- Technology & Media
  smartphone TEXT,
  social_media TEXT[],
  streaming TEXT[],
  
  -- Shopping & Consumer Behavior
  shopping_frequency TEXT,
  shopping_platforms TEXT[],
  purchase_influence TEXT,
  
  -- Lifestyle & Interests
  hobbies TEXT[],
  exercise TEXT,
  dietary TEXT,
  
  -- Health & Wellness
  health_concerns TEXT[],
  
  -- Financial
  financial_products TEXT[],
  
  -- Automotive
  vehicle TEXT,
  
  -- Travel
  travel_frequency TEXT
);

-- Create RLS policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for better performance (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at (drop and recreate if exists)
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
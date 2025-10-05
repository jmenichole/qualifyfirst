-- QualifyFirst Database Setup
-- Run this complete SQL script in your Supabase SQL Editor

-- Create user_profiles table
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

-- Create surveys table
CREATE TABLE IF NOT EXISTS surveys (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  provider TEXT NOT NULL,
  payout DECIMAL(10,2) NOT NULL,
  estimated_time INTEGER NOT NULL, -- minutes
  description TEXT,
  affiliate_url TEXT NOT NULL,
  min_age INTEGER,
  max_age INTEGER,
  required_gender TEXT[],
  required_countries TEXT[],
  required_employment TEXT[],
  required_income_min TEXT,
  required_hobbies TEXT[],
  active BOOLEAN DEFAULT true,
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create survey clicks tracking table
CREATE TABLE IF NOT EXISTS survey_clicks (
  id SERIAL PRIMARY KEY,
  survey_id INTEGER REFERENCES surveys(id),
  profile_id INTEGER REFERENCES user_profiles(id),
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_clicks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Anyone can view active surveys" ON surveys;
DROP POLICY IF EXISTS "Users can insert survey clicks" ON survey_clicks;
DROP POLICY IF EXISTS "Users can view own survey clicks" ON survey_clicks;

-- User Profiles Policies
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Surveys Policies (public read access for active surveys)
CREATE POLICY "Anyone can view active surveys" ON surveys
  FOR SELECT USING (active = true);

-- Survey Clicks Policies
CREATE POLICY "Users can insert survey clicks" ON survey_clicks
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = survey_clicks.profile_id 
    AND user_profiles.user_id = auth.uid()
  ));

CREATE POLICY "Users can view own survey clicks" ON survey_clicks
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = survey_clicks.profile_id 
    AND user_profiles.user_id = auth.uid()
  ));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_surveys_active ON surveys(active);
CREATE INDEX IF NOT EXISTS idx_surveys_payout ON surveys(payout DESC);
CREATE INDEX IF NOT EXISTS idx_survey_clicks_survey_id ON survey_clicks(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_clicks_profile_id ON survey_clicks(profile_id);

-- Functions with secure search_path
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_survey_clicks(survey_id INTEGER)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE surveys 
    SET clicks = clicks + 1 
    WHERE id = survey_id;
END;
$$;

-- Triggers
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_surveys_updated_at ON surveys;
CREATE TRIGGER update_surveys_updated_at 
  BEFORE UPDATE ON surveys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  profile_id INTEGER REFERENCES user_profiles(id),
  properties JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for analytics
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp DESC);

-- RLS for analytics
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own analytics events" ON analytics_events;
CREATE POLICY "Users can insert own analytics events" ON analytics_events
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Insert sample survey data for testing
INSERT INTO surveys (title, provider, payout, estimated_time, description, affiliate_url, min_age, max_age, required_gender, required_countries, required_employment, required_hobbies) VALUES
('Gaming Habits Survey', 'SurveyMonkey', 5.50, 15, 'Share your gaming preferences and habits', 'https://example.com/gaming-survey', 18, 65, ARRAY['Male', 'Female'], ARRAY['United States', 'Canada'], ARRAY['Full-time employed', 'Part-time employed', 'Student'], ARRAY['Gaming']),
('Online Shopping Preferences', 'Qualtrics', 3.25, 10, 'Help us understand your online shopping behavior', 'https://example.com/shopping-survey', 21, null, null, ARRAY['United States'], null, null),
('Health & Fitness Study', 'Research Co', 8.00, 20, 'Participate in our health and wellness research', 'https://example.com/health-survey', 25, 55, null, ARRAY['United States', 'United Kingdom'], ARRAY['Full-time employed'], ARRAY['Fitness', 'Sports']),
('Technology Usage Survey', 'TechInsights', 4.75, 12, 'Share how you use technology in daily life', 'https://example.com/tech-survey', 18, null, null, null, null, ARRAY['Technology', 'Gaming']),
('Travel Preferences Study', 'Travel Research Inc', 6.25, 18, 'Tell us about your travel habits and preferences', 'https://example.com/travel-survey', 25, null, null, null, null, ARRAY['Travel']),
('Food & Cooking Survey', 'Culinary Insights', 4.00, 8, 'Share your cooking and dining preferences', 'https://example.com/food-survey', 18, null, null, null, null, ARRAY['Cooking']),
('Music Streaming Habits', 'Audio Analytics', 3.50, 7, 'Help us understand music consumption patterns', 'https://example.com/music-survey', 16, 45, null, ARRAY['United States', 'Canada', 'United Kingdom'], null, ARRAY['Music']),
('Work From Home Study', 'Workplace Research', 7.50, 25, 'Share your remote work experiences', 'https://example.com/wfh-survey', 22, null, null, null, ARRAY['Full-time employed', 'Self-employed'], null)
ON CONFLICT DO NOTHING;
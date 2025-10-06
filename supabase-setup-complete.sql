-- QualifyFirst Database Setup
-- Run this complete SQL script in your Supabase SQL Editor

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id SERIAL PRIMARY -- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id SERIAL PRIMARY KEY,
  referrer_id INTEGER REFERENCES user_profiles(id),
  referred_user_id UUID REFERENCES auth.users(id),
  referral_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  reward_amount DECIMAL(10,2) DEFAULT 2.50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create tax information table for 1099 reporting
CREATE TABLE IF NOT EXISTS tax_information (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  legal_name TEXT NOT NULL,
  ssn_ein TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  tax_classification TEXT NOT NULL CHECK (tax_classification IN ('individual', 'sole_proprietor', 'partnership', 'corporation', 'llc')),
  w9_submitted BOOLEAN DEFAULT false,
  submission_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create earnings tracking table for tax reporting
CREATE TABLE IF NOT EXISTS user_earnings (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  year INTEGER NOT NULL,
  total_earnings DECIMAL(10,2) DEFAULT 0.00,
  survey_earnings DECIMAL(10,2) DEFAULT 0.00,
  referral_earnings DECIMAL(10,2) DEFAULT 0.00,
  tax_form_issued BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, year)
);

-- Create pending earnings table (for amounts below minimum payout)
CREATE TABLE IF NOT EXISTS pending_earnings (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  amount DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL,
  source_id INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payout transactions table
CREATE TABLE IF NOT EXISTS payout_transactions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  amount DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('survey_completion', 'referral_bonus', 'manual_payout')),
  method TEXT NOT NULL CHECK (method IN ('justthetip_balance', 'wallet', 'split')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  transaction_id TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create AI feedback table for survey matching
CREATE TABLE IF NOT EXISTS survey_completion_feedback (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  survey_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('completed', 'disqualified', 'abandoned')),
  time_spent INTEGER DEFAULT 0,
  reward_earned DECIMAL(10,2) DEFAULT 0.00,
  user_attributes JSONB DEFAULT '{}',
  survey_attributes JSONB DEFAULT '{}',
  match_score DECIMAL(3,2),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create survey clicks with AI data
CREATE TABLE IF NOT EXISTS ai_survey_clicks (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  survey_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  expected_reward DECIMAL(10,2),
  match_score DECIMAL(3,2),
  confidence_score DECIMAL(3,2),
  demographic_match DECIMAL(3,2),
  interest_match DECIMAL(3,2),
  completion_history DECIMAL(3,2),
  provider_performance DECIMAL(3,2),
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);_id UUID REFERENCES auth.users(id),
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
  travel_frequency TEXT,
  
  -- Referral system
  referral_code TEXT UNIQUE,
  total_referrals INTEGER DEFAULT 0,
  completed_referrals INTEGER DEFAULT 0,
  
  -- JustTheTip Integration
  discord_id TEXT UNIQUE,
  wallet_address TEXT,
  payout_preference TEXT DEFAULT 'justthetip' CHECK (payout_preference IN ('justthetip', 'wallet', 'both')),
  minimum_payout DECIMAL(10,2) DEFAULT 5.00
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
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_information ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_earnings ENABLE ROW LEVEL SECURITY;

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
CREATE INDEX IF NOT EXISTS idx_user_profiles_referral_code ON user_profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_surveys_active ON surveys(active);
CREATE INDEX IF NOT EXISTS idx_surveys_payout ON surveys(payout DESC);
CREATE INDEX IF NOT EXISTS idx_survey_clicks_survey_id ON survey_clicks(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_clicks_profile_id ON survey_clicks(profile_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user_id ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);

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

-- Functions for earnings management
CREATE OR REPLACE FUNCTION increment_user_earnings(
  p_user_id UUID,
  p_year INTEGER,
  p_amount DECIMAL,
  p_type TEXT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO user_earnings (user_id, year, total_earnings, survey_earnings, referral_earnings)
  VALUES (
    p_user_id, 
    p_year, 
    p_amount, 
    CASE WHEN p_type = 'survey' THEN p_amount ELSE 0 END,
    CASE WHEN p_type = 'referral' THEN p_amount ELSE 0 END
  )
  ON CONFLICT (user_id, year)
  DO UPDATE SET
    total_earnings = user_earnings.total_earnings + p_amount,
    survey_earnings = user_earnings.survey_earnings + CASE WHEN p_type = 'survey' THEN p_amount ELSE 0 END,
    referral_earnings = user_earnings.referral_earnings + CASE WHEN p_type = 'referral' THEN p_amount ELSE 0 END,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

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

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id SERIAL PRIMARY KEY,
  referrer_id INTEGER REFERENCES user_profiles(id),
  referred_user_id UUID REFERENCES auth.users(id),
  referral_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  reward_earned DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
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

-- Referral Policies
DROP POLICY IF EXISTS "Users can view referrals they made" ON referrals;
DROP POLICY IF EXISTS "Users can insert referrals" ON referrals;

CREATE POLICY "Users can view referrals they made" ON referrals
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = referrals.referrer_id 
    AND user_profiles.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert referrals" ON referrals
  FOR INSERT WITH CHECK (true); -- Anyone can insert referrals

-- Tax Information Policies
CREATE POLICY "Users can view own tax info" ON tax_information
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tax info" ON tax_information
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tax info" ON tax_information
  FOR UPDATE USING (auth.uid() = user_id);

-- User Earnings Policies
CREATE POLICY "Users can view own earnings" ON user_earnings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own earnings" ON user_earnings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own earnings" ON user_earnings
  FOR UPDATE USING (auth.uid() = user_id);

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
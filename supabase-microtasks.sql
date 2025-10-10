-- Microtask System for QualifyFirst
-- Add this to your Supabase SQL Editor

-- Create microtasks table
CREATE TABLE IF NOT EXISTS microtasks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  instructions TEXT NOT NULL,
  task_type TEXT NOT NULL CHECK (task_type IN ('data_verification', 'content_moderation', 'image_tagging', 'text_transcription', 'link_validation', 'social_media_engagement', 'feedback_collection', 'quality_assurance')),
  payout DECIMAL(10,2) NOT NULL CHECK (payout >= 0.10 AND payout <= 50.00),
  estimated_minutes INTEGER NOT NULL CHECK (estimated_minutes >= 1 AND estimated_minutes <= 60),
  total_slots INTEGER NOT NULL DEFAULT 1,
  completed_slots INTEGER DEFAULT 0,
  required_accuracy DECIMAL(3,2) DEFAULT 0.85 CHECK (required_accuracy >= 0.00 AND required_accuracy <= 1.00),
  active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Task-specific data stored as JSON
  task_data JSONB DEFAULT '{}',
  -- Validation rules
  validation_rules JSONB DEFAULT '{}'
);

-- Create microtask completions table
CREATE TABLE IF NOT EXISTS microtask_completions (
  id SERIAL PRIMARY KEY,
  microtask_id INTEGER REFERENCES microtasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  profile_id INTEGER REFERENCES user_profiles(id),
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'approved', 'rejected', 'pending_review')),
  submission_data JSONB NOT NULL,
  validation_score DECIMAL(3,2),
  payout_amount DECIMAL(10,2) NOT NULL,
  payout_status TEXT DEFAULT 'pending' CHECK (payout_status IN ('pending', 'completed', 'failed')),
  review_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  time_spent_seconds INTEGER,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(microtask_id, user_id)
);

-- Create microtask categories table (for organizing tasks)
CREATE TABLE IF NOT EXISTS microtask_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junction table for microtask-category relationships
CREATE TABLE IF NOT EXISTS microtask_category_assignments (
  microtask_id INTEGER REFERENCES microtasks(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES microtask_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (microtask_id, category_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_microtasks_active ON microtasks(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_microtasks_task_type ON microtasks(task_type);
CREATE INDEX IF NOT EXISTS idx_microtasks_expires_at ON microtasks(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_microtask_completions_user_id ON microtask_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_microtask_completions_microtask_id ON microtask_completions(microtask_id);
CREATE INDEX IF NOT EXISTS idx_microtask_completions_status ON microtask_completions(status);
CREATE INDEX IF NOT EXISTS idx_microtask_completions_payout_status ON microtask_completions(payout_status);

-- Enable Row Level Security
ALTER TABLE microtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE microtask_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE microtask_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE microtask_category_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for microtasks
DROP POLICY IF EXISTS "Anyone can view active microtasks" ON microtasks;
CREATE POLICY "Anyone can view active microtasks" ON microtasks
  FOR SELECT USING (active = true AND (expires_at IS NULL OR expires_at > NOW()));

DROP POLICY IF EXISTS "Authenticated users can view all microtasks" ON microtasks;
CREATE POLICY "Authenticated users can view all microtasks" ON microtasks
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS Policies for microtask completions
DROP POLICY IF EXISTS "Users can view own completions" ON microtask_completions;
CREATE POLICY "Users can view own completions" ON microtask_completions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own completions" ON microtask_completions;
CREATE POLICY "Users can insert own completions" ON microtask_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own pending completions" ON microtask_completions;
CREATE POLICY "Users can update own pending completions" ON microtask_completions
  FOR UPDATE USING (auth.uid() = user_id AND status = 'submitted');

-- RLS Policies for categories
DROP POLICY IF EXISTS "Anyone can view active categories" ON microtask_categories;
CREATE POLICY "Anyone can view active categories" ON microtask_categories
  FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "Anyone can view category assignments" ON microtask_category_assignments;
CREATE POLICY "Anyone can view category assignments" ON microtask_category_assignments
  FOR SELECT USING (true);

-- Function to update microtask completion count
CREATE OR REPLACE FUNCTION update_microtask_completion_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    UPDATE microtasks 
    SET completed_slots = completed_slots + 1
    WHERE id = NEW.microtask_id;
  ELSIF OLD.status = 'approved' AND NEW.status != 'approved' THEN
    UPDATE microtasks 
    SET completed_slots = GREATEST(0, completed_slots - 1)
    WHERE id = NEW.microtask_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger for completion count
DROP TRIGGER IF EXISTS trigger_update_microtask_completion_count ON microtask_completions;
CREATE TRIGGER trigger_update_microtask_completion_count
  AFTER INSERT OR UPDATE OF status ON microtask_completions
  FOR EACH ROW
  EXECUTE FUNCTION update_microtask_completion_count();

-- Function to auto-approve simple microtasks based on validation score
CREATE OR REPLACE FUNCTION auto_approve_microtask_completion()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  task_record RECORD;
BEGIN
  -- Get microtask details
  SELECT * INTO task_record FROM microtasks WHERE id = NEW.microtask_id;
  
  -- Auto-approve if validation score meets requirement
  IF NEW.validation_score IS NOT NULL AND NEW.validation_score >= task_record.required_accuracy THEN
    NEW.status := 'approved';
    NEW.reviewed_at := NOW();
  ELSE
    NEW.status := 'pending_review';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for auto-approval
DROP TRIGGER IF EXISTS trigger_auto_approve_microtask ON microtask_completions;
CREATE TRIGGER trigger_auto_approve_microtask
  BEFORE INSERT ON microtask_completions
  FOR EACH ROW
  EXECUTE FUNCTION auto_approve_microtask_completion();

-- Insert default categories
INSERT INTO microtask_categories (name, description, icon, sort_order) VALUES
  ('Data Entry', 'Simple data entry and verification tasks', '📝', 1),
  ('Content Review', 'Review and moderate user-generated content', '🔍', 2),
  ('Image Tasks', 'Image tagging, classification, and quality checks', '🖼️', 3),
  ('Text Tasks', 'Transcription, translation, and text verification', '📄', 4),
  ('Social Media', 'Social media engagement and validation tasks', '📱', 5),
  ('Quality Assurance', 'Test and verify features or content quality', '✅', 6),
  ('Research', 'Web research and information gathering', '🔬', 7),
  ('Feedback', 'Provide feedback on products or services', '💬', 8)
ON CONFLICT (name) DO NOTHING;

-- Update payout_transactions type to include microtasks
ALTER TABLE payout_transactions 
  DROP CONSTRAINT IF EXISTS payout_transactions_type_check;

ALTER TABLE payout_transactions 
  ADD CONSTRAINT payout_transactions_type_check 
  CHECK (type IN ('survey_completion', 'referral_bonus', 'manual_payout', 'microtask_completion'));

-- Sample microtasks for testing
INSERT INTO microtasks (title, description, instructions, task_type, payout, estimated_minutes, total_slots, task_data, validation_rules) VALUES
  (
    'Verify Survey Provider Links',
    'Check if survey provider affiliate links are working correctly',
    'Click each link and verify it opens correctly. Report any broken or incorrect links. Do NOT complete the survey, just check if the link works.',
    'link_validation',
    0.25,
    2,
    100,
    '{"links_to_check": 5, "check_requirements": ["loads", "no_errors", "correct_destination"]}',
    '{"required_fields": ["link_status", "error_message"], "validation_criteria": {"link_status": ["working", "broken", "redirect"]}}'
  ),
  (
    'Tag Survey Categories',
    'Review survey descriptions and assign appropriate category tags',
    'Read the survey description and assign relevant categories from the provided list. Select all that apply.',
    'data_verification',
    0.50,
    3,
    50,
    '{"available_tags": ["health", "technology", "shopping", "entertainment", "food", "travel", "finance", "gaming"], "surveys_to_tag": 5}',
    '{"required_fields": ["survey_id", "tags"], "min_tags": 1, "max_tags": 4}'
  ),
  (
    'Social Media Profile Check',
    'Verify that social media profile information is accurate and complete',
    'Review the provided social media profile and verify: username, follower count, bio, and profile picture. Mark any discrepancies.',
    'content_moderation',
    0.75,
    4,
    30,
    '{"platforms": ["twitter", "instagram", "facebook"], "check_fields": ["username", "followers", "bio", "avatar"]}',
    '{"required_fields": ["profile_complete", "issues_found"], "accuracy_threshold": 0.90}'
  ),
  (
    'Transcribe Short Audio Clip',
    'Listen to a 30-second audio clip and transcribe it accurately',
    'Listen carefully to the audio and type out exactly what you hear. Include punctuation and proper capitalization.',
    'text_transcription',
    1.00,
    5,
    20,
    '{"audio_duration_seconds": 30, "language": "en", "audio_quality": "high"}',
    '{"required_fields": ["transcription"], "min_length": 50, "accuracy_threshold": 0.95}'
  ),
  (
    'Rate Survey Quality',
    'Complete a survey and provide feedback on the experience',
    'Take the assigned survey and rate: clarity of questions, time accuracy, difficulty level, and overall experience. Provide brief comments.',
    'feedback_collection',
    2.50,
    10,
    25,
    '{"rating_criteria": ["clarity", "time_accuracy", "difficulty", "overall"], "comment_required": true}',
    '{"required_fields": ["clarity_rating", "time_rating", "difficulty_rating", "overall_rating", "comments"], "rating_scale": [1, 5]}'
  )
ON CONFLICT DO NOTHING;

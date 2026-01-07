-- Add improvement tracking to prompts
ALTER TABLE prompts 
  ADD COLUMN IF NOT EXISTS improvement_summary TEXT,
  ADD COLUMN IF NOT EXISTS best_for TEXT[] DEFAULT '{}';

-- Add pinned prompt to problems
ALTER TABLE problems 
  ADD COLUMN IF NOT EXISTS pinned_prompt_id UUID REFERENCES prompts(id);

-- Add onboarding and reputation to profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS onboarding_step INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reputation INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS upvotes_received INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS forks_received INT DEFAULT 0;

-- Create prompt_reviews table for criteria-based voting
CREATE TABLE IF NOT EXISTS prompt_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  criteria_met TEXT[] DEFAULT '{}',
  criteria_failed TEXT[] DEFAULT '{}',
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prompt_id, user_id)
);;

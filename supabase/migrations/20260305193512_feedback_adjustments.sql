-- ==========================================
-- 0. Define validate_content_safety
-- (Needed for local resets if missing from prior migrations)
-- ==========================================
CREATE OR REPLACE FUNCTION public.validate_content_safety(p_content text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Check for common XSS patterns
  IF p_content ~* '<script|javascript:|onerror=|onload=|<iframe|eval\(' THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- ==========================================
-- 1. Relax improvement_summary check
-- ==========================================
ALTER TABLE prompts
  DROP CONSTRAINT IF EXISTS prompts_improvement_summary_required;

ALTER TABLE prompts
  ADD CONSTRAINT prompts_improvement_summary_required 
  CHECK (parent_prompt_id IS NULL OR improvement_summary IS NOT NULL);

-- ==========================================
-- 2. Fix user_prompt_template check contradiction
-- ==========================================
-- Drop existing variations that might exist
ALTER TABLE prompts
  DROP CONSTRAINT IF EXISTS prompts_user_prompt_safe,
  DROP CONSTRAINT IF EXISTS prompts_user_prompt_template_check;

ALTER TABLE prompts
  ADD CONSTRAINT prompts_user_prompt_safe 
  CHECK (validate_content_safety(user_prompt_template));

-- ==========================================
-- 3. Uniqueness Constraints
-- ==========================================
-- Prompts Slug Uniqueness
ALTER TABLE prompts
  DROP CONSTRAINT IF EXISTS prompts_problem_id_slug_key;

ALTER TABLE prompts
  ADD CONSTRAINT prompts_problem_id_slug_key UNIQUE (problem_id, slug);

-- Problem Members Uniqueness
ALTER TABLE problem_members
  DROP CONSTRAINT IF EXISTS problem_members_problem_id_user_id_key;

ALTER TABLE problem_members
  ADD CONSTRAINT problem_members_problem_id_user_id_key UNIQUE (problem_id, user_id);

-- Prompt Reviews Uniqueness
ALTER TABLE prompt_reviews
  DROP CONSTRAINT IF EXISTS prompt_reviews_prompt_id_user_id_key;

ALTER TABLE prompt_reviews
  ADD CONSTRAINT prompt_reviews_prompt_id_user_id_key UNIQUE (prompt_id, user_id);

-- ==========================================
-- 4. Add Indexes for Performance
-- ==========================================
-- Prompts
CREATE INDEX IF NOT EXISTS idx_prompts_problem_id ON prompts(problem_id);
CREATE INDEX IF NOT EXISTS idx_prompts_workspace_id ON prompts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_prompts_parent_prompt_id ON prompts(parent_prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON prompts(created_at);

-- Prompt Reviews
CREATE INDEX IF NOT EXISTS idx_prompt_reviews_prompt_id_created_at ON prompt_reviews(prompt_id, created_at);

-- Votes
CREATE INDEX IF NOT EXISTS idx_votes_prompt_id ON votes(prompt_id);

-- Workspace Members
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON workspace_members(workspace_id);

-- Problem Members
CREATE INDEX IF NOT EXISTS idx_problem_members_problem_id ON problem_members(problem_id);

-- Search (GIN Indexes for Full Text Search)
CREATE INDEX IF NOT EXISTS idx_prompts_fts ON prompts USING GIN (fts);
CREATE INDEX IF NOT EXISTS idx_problems_fts ON problems USING GIN (fts);

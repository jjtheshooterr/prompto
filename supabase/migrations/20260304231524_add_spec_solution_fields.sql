-- ============================================================================
-- Add Spec & Solution fields to `problems` and `prompts` tables
-- ============================================================================

--
-- 1. Add Spec Fields to Problems
--
ALTER TABLE problems
  ADD COLUMN IF NOT EXISTS real_world_context TEXT,
  ADD COLUMN IF NOT EXISTS known_failure_modes TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),
  ADD COLUMN IF NOT EXISTS example_input TEXT,
  ADD COLUMN IF NOT EXISTS expected_output TEXT;

--
-- 2. Add Solution Fields to Prompts
--
ALTER TABLE prompts
  ADD COLUMN IF NOT EXISTS tradeoffs TEXT,
  ADD COLUMN IF NOT EXISTS fix_summary TEXT,
  ADD COLUMN IF NOT EXISTS usage_context TEXT;

--
-- 3. Enforce Data Integrity for Forks and Summaries
--

-- 3a. Backfill existing `improvement_summary` values to avoid violating NOT NULL check
UPDATE prompts 
SET improvement_summary = 'Initial version' 
WHERE improvement_summary IS NULL;

-- 3b. Add constraint: improvement_summary is always required
ALTER TABLE prompts
  DROP CONSTRAINT IF EXISTS prompts_improvement_summary_required,
  ADD CONSTRAINT prompts_improvement_summary_required CHECK (improvement_summary IS NOT NULL);

-- 3c. Backfill existing `fix_summary` values for forks to avoid violating NOT NULL check
UPDATE prompts 
SET fix_summary = 'Initial fork' 
WHERE parent_prompt_id IS NOT NULL AND fix_summary IS NULL;

-- 3d. Add constraint: a prompt with a parent must have a fix summary
ALTER TABLE prompts
  DROP CONSTRAINT IF EXISTS prompts_fork_fix_summary_required,
  ADD CONSTRAINT prompts_fork_fix_summary_required CHECK (
    parent_prompt_id IS NULL OR fix_summary IS NOT NULL
  );

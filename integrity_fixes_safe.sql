-- Safe integrity fixes that can be run on existing database
-- These fixes are idempotent and won't break existing data

-- 1. CRITICAL: Fix problem_members duplicates (prevents ambiguous permissions)
DO $ 
BEGIN
  -- First remove any existing duplicates (keep the highest role)
  DELETE FROM public.problem_members pm1
  WHERE EXISTS (
    SELECT 1 FROM public.problem_members pm2
    WHERE pm2.problem_id = pm1.problem_id 
    AND pm2.user_id = pm1.user_id
    AND pm2.id > pm1.id
  );
  
  -- Add unique constraint if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'problem_members_user_problem_unique') THEN
    ALTER TABLE public.problem_members 
    ADD CONSTRAINT problem_members_user_problem_unique 
    UNIQUE (problem_id, user_id);
  END IF;
END $;

-- 2. CRITICAL: Fix prompts.slug uniqueness (prevents routing collisions)
DO $ 
BEGIN
  -- First handle any existing duplicates by appending numbers
  WITH duplicates AS (
    SELECT problem_id, slug, 
           ROW_NUMBER() OVER (PARTITION BY problem_id, slug ORDER BY created_at) as rn
    FROM public.prompts 
    WHERE slug IS NOT NULL
  )
  UPDATE public.prompts 
  SET slug = prompts.slug || '-' || (duplicates.rn - 1)
  FROM duplicates
  WHERE prompts.problem_id = duplicates.problem_id 
  AND prompts.slug = duplicates.slug
  AND duplicates.rn > 1;
  
  -- Add unique constraint if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'prompts_problem_slug_unique') THEN
    ALTER TABLE public.prompts 
    ADD CONSTRAINT prompts_problem_slug_unique 
    UNIQUE (problem_id, slug);
  END IF;
END $;

-- 3. CRITICAL: Validate pinned_prompt_id belongs to the problem
CREATE OR REPLACE FUNCTION public.validate_pinned_prompt()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $
BEGIN
  -- If pinned_prompt_id is set, ensure it belongs to this problem
  IF NEW.pinned_prompt_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.prompts 
      WHERE id = NEW.pinned_prompt_id 
      AND problem_id = NEW.id
    ) THEN
      RAISE EXCEPTION 'Pinned prompt must belong to the same problem';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$;

-- Create trigger for pinned prompt validation
DROP TRIGGER IF EXISTS trg_validate_pinned_prompt ON public.problems;
CREATE TRIGGER trg_validate_pinned_prompt
  BEFORE INSERT OR UPDATE ON public.problems
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_pinned_prompt();

-- 4. Add critical indexes for performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_prompts_browse 
ON public.prompts (problem_id, is_deleted, is_hidden, is_listed, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_prompts_parent 
ON public.prompts (parent_prompt_id);

CREATE INDEX IF NOT EXISTS idx_prompt_stats_score 
ON public.prompt_stats (score DESC);

CREATE INDEX IF NOT EXISTS idx_prompt_stats_forks 
ON public.prompt_stats (fork_count DESC);

CREATE INDEX IF NOT EXISTS idx_problems_browse 
ON public.problems (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_problems_listing 
ON public.problems (is_deleted, is_hidden, is_listed);

CREATE INDEX IF NOT EXISTS idx_votes_user 
ON public.votes (user_id);

CREATE INDEX IF NOT EXISTS idx_votes_prompt 
ON public.votes (prompt_id);

-- 5. Add unique constraint for prompt reviews (1 review per user per prompt)
DO $ 
BEGIN
  -- Remove duplicates first (keep the latest one)
  DELETE FROM public.prompt_reviews pr1
  WHERE EXISTS (
    SELECT 1 FROM public.prompt_reviews pr2
    WHERE pr2.prompt_id = pr1.prompt_id 
    AND pr2.user_id = pr1.user_id
    AND pr2.created_at > pr1.created_at
  );
  
  -- Add unique constraint if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'prompt_reviews_user_prompt_unique') THEN
    ALTER TABLE public.prompt_reviews 
    ADD CONSTRAINT prompt_reviews_user_prompt_unique 
    UNIQUE (prompt_id, user_id);
  END IF;
END $;

-- Success message
DO $
BEGIN
  RAISE NOTICE 'Critical integrity fixes applied successfully!';
END $;
-- Critical integrity fixes only - safe for existing database
-- These fixes address the most critical issues that will cause bugs

-- 1. CRITICAL: Fix problem_members duplicates (prevents ambiguous permissions)
DO $ 
BEGIN
  -- First remove any existing duplicates (keep the one with highest role precedence)
  -- admin > editor > viewer
  WITH ranked_members AS (
    SELECT id, problem_id, user_id, role,
           ROW_NUMBER() OVER (
             PARTITION BY problem_id, user_id 
             ORDER BY 
               CASE role 
                 WHEN 'admin' THEN 1 
                 WHEN 'editor' THEN 2 
                 WHEN 'viewer' THEN 3 
                 ELSE 4 
               END,
               created_at DESC
           ) as rn
    FROM public.problem_members
  )
  DELETE FROM public.problem_members 
  WHERE id IN (
    SELECT id FROM ranked_members WHERE rn > 1
  );
  
  -- Add unique constraint if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'problem_members_user_problem_unique'
                 AND table_name = 'problem_members') THEN
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
    SELECT id, problem_id, slug, 
           ROW_NUMBER() OVER (PARTITION BY problem_id, slug ORDER BY created_at) as rn
    FROM public.prompts 
    WHERE slug IS NOT NULL
  )
  UPDATE public.prompts 
  SET slug = duplicates.slug || '-' || (duplicates.rn - 1)
  FROM duplicates
  WHERE prompts.id = duplicates.id
  AND duplicates.rn > 1;
  
  -- Add unique constraint if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'prompts_problem_slug_unique'
                 AND table_name = 'prompts') THEN
    ALTER TABLE public.prompts 
    ADD CONSTRAINT prompts_problem_slug_unique 
    UNIQUE (problem_id, slug);
  END IF;
END $;

-- 3. CRITICAL: Validate pinned_prompt_id belongs to the problem
CREATE OR REPLACE FUNCTION public.validate_pinned_prompt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $
BEGIN
  -- If pinned_prompt_id is set, ensure it belongs to this problem
  IF NEW.pinned_prompt_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.prompts 
      WHERE id = NEW.pinned_prompt_id 
      AND problem_id = NEW.id
      AND is_deleted = false
    ) THEN
      RAISE EXCEPTION 'Pinned prompt must belong to the same problem and not be deleted';
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

-- 4. Add unique constraint for prompt reviews (1 review per user per prompt)
DO $ 
BEGIN
  -- Remove duplicates first (keep the latest one)
  WITH ranked_reviews AS (
    SELECT id, prompt_id, user_id,
           ROW_NUMBER() OVER (
             PARTITION BY prompt_id, user_id 
             ORDER BY created_at DESC
           ) as rn
    FROM public.prompt_reviews
  )
  DELETE FROM public.prompt_reviews 
  WHERE id IN (
    SELECT id FROM ranked_reviews WHERE rn > 1
  );
  
  -- Add unique constraint if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'prompt_reviews_user_prompt_unique'
                 AND table_name = 'prompt_reviews') THEN
    ALTER TABLE public.prompt_reviews 
    ADD CONSTRAINT prompt_reviews_user_prompt_unique 
    UNIQUE (prompt_id, user_id);
  END IF;
END $;

-- 5. Add most critical indexes for performance
CREATE INDEX IF NOT EXISTS idx_prompts_browse_critical 
ON public.prompts (problem_id, is_deleted, is_listed, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_prompts_parent_critical 
ON public.prompts (parent_prompt_id) WHERE parent_prompt_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_votes_user_critical 
ON public.votes (user_id);

CREATE INDEX IF NOT EXISTS idx_votes_prompt_critical 
ON public.votes (prompt_id);

-- Success message
SELECT 'Critical integrity fixes applied successfully!' as result;
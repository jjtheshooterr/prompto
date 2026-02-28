-- Run these statements ONE AT A TIME in the Supabase dashboard SQL editor

-- STEP 1: Remove duplicate problem memberships (keeps highest role)
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

-- STEP 2: Add unique constraint for problem members
ALTER TABLE public.problem_members 
ADD CONSTRAINT problem_members_user_problem_unique 
UNIQUE (problem_id, user_id);

-- STEP 3: Fix duplicate prompt slugs (append numbers to duplicates)
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

-- STEP 4: Add unique constraint for prompt slugs
ALTER TABLE public.prompts 
ADD CONSTRAINT prompts_problem_slug_unique 
UNIQUE (problem_id, slug);

-- STEP 5: Create function to validate pinned prompts
CREATE OR REPLACE FUNCTION public.validate_pinned_prompt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- STEP 6: Create trigger for pinned prompt validation
DROP TRIGGER IF EXISTS trg_validate_pinned_prompt ON public.problems;
CREATE TRIGGER trg_validate_pinned_prompt
  BEFORE INSERT OR UPDATE ON public.problems
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_pinned_prompt();

-- STEP 7: Remove duplicate prompt reviews (keep latest)
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

-- STEP 8: Add unique constraint for prompt reviews
ALTER TABLE public.prompt_reviews 
ADD CONSTRAINT prompt_reviews_user_prompt_unique 
UNIQUE (prompt_id, user_id);

-- STEP 9: Add critical performance indexes
CREATE INDEX IF NOT EXISTS idx_prompts_browse_critical 
ON public.prompts (problem_id, is_deleted, is_listed, created_at DESC);

-- STEP 10: Add more critical indexes
CREATE INDEX IF NOT EXISTS idx_prompts_parent_critical 
ON public.prompts (parent_prompt_id) WHERE parent_prompt_id IS NOT NULL;

-- STEP 11: Add user activity indexes
CREATE INDEX IF NOT EXISTS idx_votes_user_critical 
ON public.votes (user_id);

-- STEP 12: Add prompt voting index
CREATE INDEX IF NOT EXISTS idx_votes_prompt_critical 
ON public.votes (prompt_id);

-- SUCCESS: All critical integrity fixes applied!
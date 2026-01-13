-- MANUAL INTEGRITY FIXES
-- Copy and paste this into your Supabase SQL Editor to fix the critical issues

-- 1. Add problem_members uniqueness constraint (prevents duplicate memberships)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'problem_members_problem_id_user_id_key' 
    AND table_name = 'problem_members'
  ) THEN
    ALTER TABLE public.problem_members 
    ADD CONSTRAINT problem_members_problem_id_user_id_key UNIQUE (problem_id, user_id);
    RAISE NOTICE '✅ Added problem_members uniqueness constraint';
  ELSE
    RAISE NOTICE '✅ problem_members uniqueness constraint already exists';
  END IF;
END $$;

-- 2. Add prompts slug uniqueness constraint (prevents routing conflicts)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'prompts_problem_id_slug_key' 
    AND table_name = 'prompts'
  ) THEN
    ALTER TABLE public.prompts 
    ADD CONSTRAINT prompts_problem_id_slug_key UNIQUE (problem_id, slug);
    RAISE NOTICE '✅ Added prompts slug uniqueness constraint';
  ELSE
    RAISE NOTICE '✅ prompts slug uniqueness constraint already exists';
  END IF;
END $$;

-- 3. Create pinned prompt enforcement function
CREATE OR REPLACE FUNCTION public.enforce_pinned_prompt_belongs_to_problem() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$ 
BEGIN   
  -- Allow NULL pinned_prompt_id
  IF NEW.pinned_prompt_id IS NULL THEN     
    RETURN NEW;   
  END IF;    
  
  -- Check that the pinned prompt belongs to this problem
  IF NOT EXISTS (     
    SELECT 1     
    FROM public.prompts p     
    WHERE p.id = NEW.pinned_prompt_id       
      AND p.problem_id = NEW.id   
  ) THEN     
    RAISE EXCEPTION 'Pinned prompt % does not belong to problem %', NEW.pinned_prompt_id, NEW.id;   
  END IF;    
  
  RETURN NEW; 
END; 
$$;

-- 4. Create trigger for pinned prompt enforcement
DROP TRIGGER IF EXISTS trg_enforce_pinned_prompt ON public.problems;
CREATE TRIGGER trg_enforce_pinned_prompt 
BEFORE INSERT OR UPDATE OF pinned_prompt_id 
ON public.problems 
FOR EACH ROW 
EXECUTE FUNCTION public.enforce_pinned_prompt_belongs_to_problem();

-- 5. Add critical performance indexes
CREATE INDEX IF NOT EXISTS idx_prompts_browse 
ON public.prompts (problem_id, is_deleted, is_hidden, is_listed, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_prompts_parent 
ON public.prompts (parent_prompt_id);

CREATE INDEX IF NOT EXISTS idx_prompt_stats_score 
ON public.prompt_stats (score DESC);

CREATE INDEX IF NOT EXISTS idx_votes_user 
ON public.votes (user_id);

CREATE INDEX IF NOT EXISTS idx_votes_prompt 
ON public.votes (prompt_id);

-- 6. Add unique constraint for prompt reviews (1 review per user per prompt)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'prompt_reviews_user_prompt_unique' 
    AND table_name = 'prompt_reviews'
  ) THEN
    ALTER TABLE public.prompt_reviews 
    ADD CONSTRAINT prompt_reviews_user_prompt_unique 
    UNIQUE (prompt_id, user_id);
    RAISE NOTICE '✅ Added prompt reviews uniqueness constraint';
  ELSE
    RAISE NOTICE '✅ prompt reviews uniqueness constraint already exists';
  END IF;
END $$;

SELECT '🎉 All critical integrity fixes have been applied!' as result;
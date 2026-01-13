-- Final integrity fixes - only add what's actually missing

-- 1. Ensure problem_members uniqueness constraint exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'problem_members_problem_id_user_id_key' 
                 AND table_name = 'problem_members') THEN
    ALTER TABLE public.problem_members 
    ADD CONSTRAINT problem_members_problem_id_user_id_key UNIQUE (problem_id, user_id);
  END IF;
END $$;

-- 2. Ensure prompts slug uniqueness constraint exists  
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'prompts_problem_id_slug_key' 
                 AND table_name = 'prompts') THEN
    ALTER TABLE public.prompts 
    ADD CONSTRAINT prompts_problem_id_slug_key UNIQUE (problem_id, slug);
  END IF;
END $$;

-- 3. Ensure pinned prompt enforcement function and trigger exist
CREATE OR REPLACE FUNCTION public.enforce_pinned_prompt_belongs_to_problem() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$ 
BEGIN   
  IF NEW.pinned_prompt_id IS NULL THEN     
    RETURN NEW;   
  END IF;    
  
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

-- Drop and recreate trigger to ensure it's current
DROP TRIGGER IF EXISTS trg_enforce_pinned_prompt ON public.problems;
CREATE TRIGGER trg_enforce_pinned_prompt 
BEFORE INSERT OR UPDATE OF pinned_prompt_id 
ON public.problems 
FOR EACH ROW 
EXECUTE FUNCTION public.enforce_pinned_prompt_belongs_to_problem();

-- 4. Add critical performance indexes if they don't exist
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

-- 5. Add unique constraint for prompt reviews if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'prompt_reviews_user_prompt_unique' 
                 AND table_name = 'prompt_reviews') THEN
    ALTER TABLE public.prompt_reviews 
    ADD CONSTRAINT prompt_reviews_user_prompt_unique 
    UNIQUE (prompt_id, user_id);
  END IF;
END $$;

-- 6. Add soft delete consistency checks if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'problems_soft_delete_consistency' 
                 AND table_name = 'problems') THEN
    ALTER TABLE public.problems 
    ADD CONSTRAINT problems_soft_delete_consistency 
    CHECK (
      (is_deleted = false AND deleted_at IS NULL AND deleted_by IS NULL) OR
      (is_deleted = true AND deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
    );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'prompts_soft_delete_consistency' 
                 AND table_name = 'prompts') THEN
    ALTER TABLE public.prompts 
    ADD CONSTRAINT prompts_soft_delete_consistency 
    CHECK (
      (is_deleted = false AND deleted_at IS NULL AND deleted_by IS NULL) OR
      (is_deleted = true AND deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
    );
  END IF;
END $$;
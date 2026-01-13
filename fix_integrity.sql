-- Check and add missing constraints

-- 1. Check if problem_members uniqueness constraint exists
SELECT 'Checking problem_members constraint...' as status;
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'problem_members_problem_id_user_id_key' 
                 AND table_name = 'problem_members') THEN
    ALTER TABLE public.problem_members 
    ADD CONSTRAINT problem_members_problem_id_user_id_key UNIQUE (problem_id, user_id);
    RAISE NOTICE 'Added problem_members uniqueness constraint';
  ELSE
    RAISE NOTICE 'problem_members uniqueness constraint already exists';
  END IF;
END $$;

-- 2. Check if prompts slug uniqueness constraint exists  
SELECT 'Checking prompts slug constraint...' as status;
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'prompts_problem_id_slug_key' 
                 AND table_name = 'prompts') THEN
    ALTER TABLE public.prompts 
    ADD CONSTRAINT prompts_problem_id_slug_key UNIQUE (problem_id, slug);
    RAISE NOTICE 'Added prompts slug uniqueness constraint';
  ELSE
    RAISE NOTICE 'prompts slug uniqueness constraint already exists';
  END IF;
END $$;

-- 3. Create/update pinned prompt enforcement function and trigger
SELECT 'Creating pinned prompt enforcement...' as status;
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

DROP TRIGGER IF EXISTS trg_enforce_pinned_prompt ON public.problems;
CREATE TRIGGER trg_enforce_pinned_prompt 
BEFORE INSERT OR UPDATE OF pinned_prompt_id 
ON public.problems 
FOR EACH ROW 
EXECUTE FUNCTION public.enforce_pinned_prompt_belongs_to_problem();

SELECT 'All integrity fixes applied!' as status;
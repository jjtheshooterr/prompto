-- Add missing constraints and triggers for data integrity

-- 1. Add uniqueness constraint to problem_members (problem_id, user_id)
-- This prevents duplicate memberships
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'problem_members_problem_id_user_id_key'
  ) THEN
    ALTER TABLE public.problem_members 
    ADD CONSTRAINT problem_members_problem_id_user_id_key UNIQUE (problem_id, user_id);
  END IF;
END $$;

-- 2. Add uniqueness constraint to prompts.slug within problem scope
-- This ensures slugs are unique within each problem
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'prompts_problem_id_slug_key'
  ) THEN
    ALTER TABLE public.prompts 
    ADD CONSTRAINT prompts_problem_id_slug_key UNIQUE (problem_id, slug);
  END IF;
END $$;

-- 3. Create function to enforce pinned_prompt_id belongs to the problem
CREATE OR REPLACE FUNCTION public.enforce_pinned_prompt_belongs_to_problem() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
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

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS trg_enforce_pinned_prompt ON public.problems;

CREATE TRIGGER trg_enforce_pinned_prompt 
BEFORE INSERT OR UPDATE OF pinned_prompt_id 
ON public.problems 
FOR EACH ROW 
EXECUTE FUNCTION public.enforce_pinned_prompt_belongs_to_problem();

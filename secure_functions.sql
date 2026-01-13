-- Fix search_path security warnings for functions
-- Run this in Supabase dashboard to secure the functions

-- Secure validate_pinned_prompt function
CREATE OR REPLACE FUNCTION public.validate_pinned_prompt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Secure enforce_pinned_prompt_belongs_to_problem function (if it exists)
CREATE OR REPLACE FUNCTION public.enforce_pinned_prompt_belongs_to_problem()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Secure is_problem_member function (if it exists)
CREATE OR REPLACE FUNCTION public.is_problem_member(problem_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.problem_members 
    WHERE problem_id = problem_uuid 
    AND user_id = user_uuid
  );
END;
$$;
-- Fix function security by setting search_path

-- 1. Fix is_problem_member function
CREATE OR REPLACE FUNCTION public.is_problem_member(p_problem_id UUID, p_user_id UUID) 
RETURNS BOOLEAN 
LANGUAGE SQL 
STABLE 
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.problem_members pm
    WHERE pm.problem_id = p_problem_id
      AND pm.user_id = p_user_id
  );
$$;

-- 2. Fix increment functions
CREATE OR REPLACE FUNCTION public.increment_view_count(prompt_id UUID)
RETURNS void
LANGUAGE SQL
SECURITY DEFINER
SET search_path = ''
AS $$
  INSERT INTO public.prompt_stats (prompt_id, view_count)
  VALUES (prompt_id, 1)
  ON CONFLICT (prompt_id)
  DO UPDATE SET 
    view_count = public.prompt_stats.view_count + 1,
    updated_at = NOW();
$$;

CREATE OR REPLACE FUNCTION public.increment_copy_count(prompt_id UUID)
RETURNS void
LANGUAGE SQL
SECURITY DEFINER
SET search_path = ''
AS $$
  INSERT INTO public.prompt_stats (prompt_id, copy_count)
  VALUES (prompt_id, 1)
  ON CONFLICT (prompt_id)
  DO UPDATE SET 
    copy_count = public.prompt_stats.copy_count + 1,
    updated_at = NOW();
$$;

CREATE OR REPLACE FUNCTION public.increment_fork_count(prompt_id UUID)
RETURNS void
LANGUAGE SQL
SECURITY DEFINER
SET search_path = ''
AS $$
  INSERT INTO public.prompt_stats (prompt_id, fork_count)
  VALUES (prompt_id, 1)
  ON CONFLICT (prompt_id)
  DO UPDATE SET 
    fork_count = public.prompt_stats.fork_count + 1,
    updated_at = NOW();
$$;;

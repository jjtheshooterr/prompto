-- Create the missing helper functions
CREATE OR REPLACE FUNCTION public.can_view_problem(p_problem_id UUID, p_user_id UUID) 
RETURNS BOOLEAN 
LANGUAGE SQL 
STABLE 
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM problems p
    WHERE p.id = p_problem_id
      AND COALESCE(p.is_deleted, FALSE) = FALSE
      AND (
        p.visibility = 'public'
        OR p.owner_id = p_user_id
        OR (p.visibility = 'unlisted')
        OR (p.visibility = 'private' AND public.is_problem_member(p.id, p_user_id))
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_contribute_problem(p_problem_id UUID, p_user_id UUID) 
RETURNS BOOLEAN 
LANGUAGE SQL 
STABLE 
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM problems p
    WHERE p.id = p_problem_id
      AND COALESCE(p.is_deleted, FALSE) = FALSE
      AND (
        (p.visibility IN ('public', 'unlisted') AND p_user_id IS NOT NULL)
        OR p.owner_id = p_user_id
        OR (p.visibility = 'private' AND public.is_problem_member(p.id, p_user_id))
      )
  );
$$;;

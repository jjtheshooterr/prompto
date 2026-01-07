-- Fix RLS policies for member access to private problems

-- Drop and recreate the problems select policy to ensure it's correct
DROP POLICY IF EXISTS "problems_select_policy" ON problems;
CREATE POLICY "problems_select_policy" ON problems FOR SELECT USING (
  is_deleted = FALSE AND (
    visibility = 'public'
    OR owner_id = auth.uid()
    OR (visibility = 'unlisted')  -- Anyone with link can see unlisted
    OR (visibility = 'private' AND public.is_problem_member(id, auth.uid()))
  )
);

-- Also ensure prompts policy is correct
DROP POLICY IF EXISTS "prompts_select_policy" ON prompts;
CREATE POLICY "prompts_select_policy" ON prompts FOR SELECT USING (
  is_deleted = FALSE AND EXISTS (
    SELECT 1 FROM problems p
    WHERE p.id = prompts.problem_id
      AND p.is_deleted = FALSE
      AND (
        p.visibility = 'public'
        OR p.owner_id = auth.uid()
        OR (p.visibility = 'unlisted')  -- Anyone with link can see unlisted
        OR (p.visibility = 'private' AND public.is_problem_member(p.id, auth.uid()))
      )
  )
);;

-- Update RLS policies for visibility system

-- 1. Update problems RLS policies for visibility
DROP POLICY IF EXISTS "problems_select" ON problems;
CREATE POLICY "problems_select" ON problems FOR SELECT USING (
  is_deleted = FALSE AND (
    visibility = 'public'
    OR owner_id = auth.uid()
    OR (visibility = 'unlisted')  -- Anyone with link can see unlisted
    OR (visibility = 'private' AND public.is_problem_member(id, auth.uid()))
  )
);

DROP POLICY IF EXISTS "problems_insert" ON problems;
CREATE POLICY "problems_insert" ON problems FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
  AND owner_id = auth.uid()
);

DROP POLICY IF EXISTS "problems_update" ON problems;
CREATE POLICY "problems_update" ON problems FOR UPDATE 
USING (owner_id = auth.uid() AND is_deleted = FALSE) 
WITH CHECK (owner_id = auth.uid() AND is_deleted = FALSE);

DROP POLICY IF EXISTS "problems_delete" ON problems;
CREATE POLICY "problems_delete" ON problems FOR DELETE USING (owner_id = auth.uid());

-- 2. Update prompts RLS policies to respect problem visibility
DROP POLICY IF EXISTS "prompts_select" ON prompts;
CREATE POLICY "prompts_select" ON prompts FOR SELECT USING (
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
);

DROP POLICY IF EXISTS "prompts_insert" ON prompts;
CREATE POLICY "prompts_insert" ON prompts FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM problems p
    WHERE p.id = prompts.problem_id
      AND p.is_deleted = FALSE
      AND (
        (p.visibility IN ('public', 'unlisted'))  -- Public and unlisted allow contributions
        OR (p.visibility = 'private' AND (
          p.owner_id = auth.uid() 
          OR public.is_problem_member(p.id, auth.uid())
        ))
      )
  )
);;

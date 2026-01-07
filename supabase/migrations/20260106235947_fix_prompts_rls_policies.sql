-- Fix prompts policies to work with new problem membership system

-- Drop existing prompts policies
DROP POLICY IF EXISTS "prompts_select" ON prompts;
DROP POLICY IF EXISTS "prompts_insert" ON prompts;
DROP POLICY IF EXISTS "prompts_update" ON prompts;
DROP POLICY IF EXISTS "prompts_delete" ON prompts;

-- Create new prompts policies
-- SELECT: Users can see prompts if they can see the parent problem
CREATE POLICY "prompts_select_policy" ON prompts FOR SELECT USING (
  is_deleted = FALSE AND EXISTS (
    SELECT 1 FROM problems p
    WHERE p.id = prompts.problem_id
    AND p.is_deleted = FALSE
    AND (
      -- Public problems
      p.visibility = 'public'
      -- Unlisted problems
      OR p.visibility = 'unlisted'
      -- Private problems (owner or members)
      OR (p.visibility = 'private' AND (
        p.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM problem_members pm
          WHERE pm.problem_id = p.id
          AND pm.user_id = auth.uid()
        )
      ))
      -- Owner can always see
      OR p.owner_id = auth.uid()
    )
  )
);

-- INSERT: Users can create prompts if they can contribute to the problem
CREATE POLICY "prompts_insert_policy" ON prompts FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM problems p
    WHERE p.id = prompts.problem_id
    AND p.is_deleted = FALSE
    AND (
      -- Public and unlisted allow contributions
      p.visibility IN ('public', 'unlisted')
      -- Private problems: owner or members can contribute
      OR (p.visibility = 'private' AND (
        p.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM problem_members pm
          WHERE pm.problem_id = p.id
          AND pm.user_id = auth.uid()
        )
      ))
    )
  )
);

-- UPDATE: Only prompt creators can update their prompts
CREATE POLICY "prompts_update_policy" ON prompts FOR UPDATE 
USING (created_by = auth.uid() AND is_deleted = FALSE)
WITH CHECK (created_by = auth.uid() AND is_deleted = FALSE);

-- DELETE: Only prompt creators can delete their prompts
CREATE POLICY "prompts_delete_policy" ON prompts FOR DELETE USING (
  created_by = auth.uid()
);;

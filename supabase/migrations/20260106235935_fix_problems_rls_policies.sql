-- Clean up all existing problems policies and create new ones

-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone can view non-deleted public problems" ON problems;
DROP POLICY IF EXISTS "Workspace members can create problems" ON problems;
DROP POLICY IF EXISTS "Workspace members can delete their problems" ON problems;
DROP POLICY IF EXISTS "Workspace members can update their problems" ON problems;
DROP POLICY IF EXISTS "problems_delete" ON problems;
DROP POLICY IF EXISTS "problems_insert" ON problems;
DROP POLICY IF EXISTS "problems_select" ON problems;
DROP POLICY IF EXISTS "problems_update" ON problems;

-- Create new, clean policies
-- SELECT: Users can see problems based on visibility and membership
CREATE POLICY "problems_select_policy" ON problems FOR SELECT USING (
  is_deleted = FALSE AND (
    -- Public problems
    visibility = 'public'
    -- Unlisted problems (anyone with link)
    OR visibility = 'unlisted'
    -- Private problems (owner or members)
    OR (visibility = 'private' AND (
      owner_id = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM problem_members pm 
        WHERE pm.problem_id = problems.id 
        AND pm.user_id = auth.uid()
      )
    ))
    -- Owner can always see their problems
    OR owner_id = auth.uid()
  )
);

-- INSERT: Authenticated users can create problems
CREATE POLICY "problems_insert_policy" ON problems FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
  AND owner_id = auth.uid()
);

-- UPDATE: Only owners can update their problems
CREATE POLICY "problems_update_policy" ON problems FOR UPDATE 
USING (owner_id = auth.uid() AND is_deleted = FALSE) 
WITH CHECK (owner_id = auth.uid() AND is_deleted = FALSE);

-- DELETE: Only owners can delete their problems
CREATE POLICY "problems_delete_policy" ON problems FOR DELETE USING (
  owner_id = auth.uid()
);;

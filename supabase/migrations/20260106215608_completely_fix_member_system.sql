-- Completely fix the member management system

-- 1. Drop all existing policies to start fresh
DROP POLICY IF EXISTS "pm_select" ON problem_members;
DROP POLICY IF EXISTS "pm_insert" ON problem_members;
DROP POLICY IF EXISTS "pm_delete" ON problem_members;
DROP POLICY IF EXISTS "pm_update" ON problem_members;

-- 2. Create very simple, non-recursive policies
-- Allow users to see members if they own the problem OR if they are a member
CREATE POLICY "problem_members_select_policy" ON problem_members FOR SELECT USING (
  -- User owns the problem
  EXISTS (
    SELECT 1 FROM problems p 
    WHERE p.id = problem_members.problem_id 
    AND p.owner_id = auth.uid()
  )
  -- OR user is themselves in the member list
  OR user_id = auth.uid()
);

-- Only problem owners can add members
CREATE POLICY "problem_members_insert_policy" ON problem_members FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM problems p 
    WHERE p.id = problem_members.problem_id 
    AND p.owner_id = auth.uid()
  )
);

-- Problem owners and the member themselves can remove memberships
CREATE POLICY "problem_members_delete_policy" ON problem_members FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM problems p 
    WHERE p.id = problem_members.problem_id 
    AND p.owner_id = auth.uid()
  )
  OR user_id = auth.uid()
);;

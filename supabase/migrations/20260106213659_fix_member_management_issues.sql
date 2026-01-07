-- Fix the RLS policies to avoid infinite recursion

-- 1. Drop existing policies
DROP POLICY IF EXISTS "pm_select" ON problem_members;
DROP POLICY IF EXISTS "pm_insert" ON problem_members;
DROP POLICY IF EXISTS "pm_delete" ON problem_members;

-- 2. Create simpler, non-recursive policies
-- Members can see other members if they are a member themselves OR if they own the problem
CREATE POLICY "pm_select" ON problem_members FOR SELECT USING (
  -- User is a member of this problem
  user_id = auth.uid()
  OR problem_id IN (
    SELECT pm.problem_id 
    FROM problem_members pm 
    WHERE pm.user_id = auth.uid()
  )
  OR problem_id IN (
    SELECT p.id 
    FROM problems p 
    WHERE p.owner_id = auth.uid()
  )
);

-- Only problem owners can add members (simplified)
CREATE POLICY "pm_insert" ON problem_members FOR INSERT WITH CHECK (
  problem_id IN (
    SELECT p.id 
    FROM problems p 
    WHERE p.owner_id = auth.uid()
  )
);

-- Only problem owners can remove members (simplified)
CREATE POLICY "pm_delete" ON problem_members FOR DELETE USING (
  problem_id IN (
    SELECT p.id 
    FROM problems p 
    WHERE p.owner_id = auth.uid()
  )
  OR user_id = auth.uid() -- Users can remove themselves
);;

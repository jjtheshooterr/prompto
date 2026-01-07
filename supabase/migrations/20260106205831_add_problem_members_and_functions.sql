-- Add problem_members table and helper functions

-- 1. Create problem_members table for workspace collaboration
CREATE TABLE IF NOT EXISTS problem_members (
  id BIGSERIAL PRIMARY KEY,
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(problem_id, user_id)
);

-- 2. Create indexes for visibility system
CREATE INDEX IF NOT EXISTS idx_problems_visibility ON problems(visibility);
CREATE INDEX IF NOT EXISTS idx_problems_owner ON problems(owner_id);
CREATE INDEX IF NOT EXISTS idx_problem_members_problem ON problem_members(problem_id);
CREATE INDEX IF NOT EXISTS idx_problem_members_user ON problem_members(user_id);

-- 3. Helper function for problem membership
CREATE OR REPLACE FUNCTION public.is_problem_member(p_problem_id UUID, p_user_id UUID) 
RETURNS BOOLEAN 
LANGUAGE SQL 
STABLE 
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM problem_members pm
    WHERE pm.problem_id = p_problem_id
      AND pm.user_id = p_user_id
  );
$$;

-- 4. Enable RLS on problem_members table
ALTER TABLE problem_members ENABLE ROW LEVEL SECURITY;;

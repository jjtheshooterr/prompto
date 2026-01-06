-- Complete reporting and visibility system migration

-- 1. Fix the reports table structure
DROP TABLE IF EXISTS reports;

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT CHECK (content_type IN ('prompt', 'problem', 'comment')) NOT NULL,
  content_id UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')) DEFAULT 'pending',
  reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add soft delete columns to prompts and problems
ALTER TABLE prompts 
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE problems 
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Add role column to profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('user', 'moderator', 'admin')) DEFAULT 'user';

-- 4. Add visibility system to problems
-- Create visibility enum
DO $$ 
BEGIN 
  CREATE TYPE problem_visibility AS ENUM ('public', 'unlisted', 'private'); 
EXCEPTION 
  WHEN duplicate_object THEN NULL; 
END $$;

-- Add owner_id and visibility to problems
ALTER TABLE problems 
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS visibility problem_visibility NOT NULL DEFAULT 'public';

-- Ensure ownership is set for existing problems
UPDATE problems SET owner_id = created_by WHERE owner_id IS NULL;
ALTER TABLE problems ALTER COLUMN owner_id SET NOT NULL;

-- 5. Create problem_members table for workspace collaboration
CREATE TABLE IF NOT EXISTS problem_members (
  id BIGSERIAL PRIMARY KEY,
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(problem_id, user_id)
);

-- 6. Create indexes
CREATE INDEX IF NOT EXISTS idx_reports_content ON reports(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_prompts_deleted ON prompts(is_deleted) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_problems_deleted ON problems(is_deleted) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_problems_visibility ON problems(visibility);
CREATE INDEX IF NOT EXISTS idx_problems_owner ON problems(owner_id);
CREATE INDEX IF NOT EXISTS idx_problem_members_problem ON problem_members(problem_id);
CREATE INDEX IF NOT EXISTS idx_problem_members_user ON problem_members(user_id);

-- 7. Helper function for problem membership
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

-- 8. Enable RLS on new tables
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_members ENABLE ROW LEVEL SECURITY;

-- 9. Update problems RLS policies for visibility
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

-- 10. Update prompts RLS policies to respect problem visibility
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
);

-- 11. Problem members policies
DROP POLICY IF EXISTS "pm_select" ON problem_members;
CREATE POLICY "pm_select" ON problem_members FOR SELECT USING (
  public.is_problem_member(problem_id, auth.uid())
  OR EXISTS (
    SELECT 1 FROM problems p
    WHERE p.id = problem_members.problem_id
      AND p.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "pm_insert" ON problem_members;
CREATE POLICY "pm_insert" ON problem_members FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM problems p
    WHERE p.id = problem_members.problem_id
      AND p.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM problem_members pm
    WHERE pm.problem_id = problem_members.problem_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner','admin')
  )
);

DROP POLICY IF EXISTS "pm_delete" ON problem_members;
CREATE POLICY "pm_delete" ON problem_members FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM problems p
    WHERE p.id = problem_members.problem_id
      AND p.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM problem_members pm
    WHERE pm.problem_id = problem_members.problem_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner','admin')
  )
);

-- 12. Reports policies
DROP POLICY IF EXISTS "reports_select" ON reports;
CREATE POLICY "reports_select" ON reports FOR SELECT USING (
  -- Reporters can see their own reports
  reporter_id = auth.uid()
  -- Admins can see all reports
  OR EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS "reports_insert" ON reports;
CREATE POLICY "reports_insert" ON reports FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
  AND reporter_id = auth.uid()
);

DROP POLICY IF EXISTS "reports_update" ON reports;
CREATE POLICY "reports_update" ON reports FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);
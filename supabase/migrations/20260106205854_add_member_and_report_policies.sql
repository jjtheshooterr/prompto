-- Add RLS policies for problem_members and reports

-- 1. Problem members policies
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

-- 2. Reports policies
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
);;

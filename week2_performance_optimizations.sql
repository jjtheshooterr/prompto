-- =====================================================
-- WEEK 2: Performance Optimizations
-- =====================================================
-- 1. Drop duplicate RLS policies
-- 2. Optimize auth.uid() calls (InitPlan fix)
-- 3. Drop duplicate indexes
-- =====================================================

-- =====================================================
-- PART 1: Drop Duplicate RLS Policies
-- =====================================================

-- Drop old problem_members policies (keep newer ones)
DROP POLICY IF EXISTS "problem_members_select_policy" ON problem_members;
DROP POLICY IF EXISTS "problem_members_insert_policy" ON problem_members;
DROP POLICY IF EXISTS "problem_members_delete_policy" ON problem_members;

-- Drop old problems policies (keep _v2 versions)
DROP POLICY IF EXISTS "problems_select_policy" ON problems;
DROP POLICY IF EXISTS "problems_insert_policy" ON problems;
DROP POLICY IF EXISTS "problems_update_policy" ON problems;
DROP POLICY IF EXISTS "problems_delete_policy" ON problems;

-- Drop old prompts policies (keep newer versions)
DROP POLICY IF EXISTS "prompts_insert_policy" ON prompts;
DROP POLICY IF EXISTS "prompts_update_policy" ON prompts;
DROP POLICY IF EXISTS "prompts_delete_policy" ON prompts;
DROP POLICY IF EXISTS "prompts_public_select_policy" ON prompts;

-- Drop duplicate prompt_stats policies
DROP POLICY IF EXISTS "Anyone can view prompt stats" ON prompt_stats;
DROP POLICY IF EXISTS "No direct client writes to prompt_stats" ON prompt_stats;
DROP POLICY IF EXISTS "No direct client updates to prompt_stats" ON prompt_stats;

-- =====================================================
-- PART 2: Optimize auth.uid() Calls (InitPlan Fix)
-- =====================================================
-- Replace auth.uid() with (select auth.uid()) for better performance
-- This prevents re-evaluation for each row

-- Optimize problems_select_v2
DROP POLICY IF EXISTS "problems_select_v2" ON problems;
CREATE POLICY "problems_select_v2" ON problems
  FOR SELECT
  USING (
    is_deleted = false
    AND (
      visibility = 'public'
      OR visibility = 'unlisted'
      OR (visibility = 'private' AND (
        owner_id = (select auth.uid())
        OR is_problem_member(id, (select auth.uid()))
      ))
    )
  );

-- Optimize prompts_select_v2
DROP POLICY IF EXISTS "prompts_select_v2" ON prompts;
CREATE POLICY "prompts_select_v2" ON prompts
  FOR SELECT
  USING (
    is_deleted = false
    AND is_hidden = false
    AND EXISTS (
      SELECT 1 FROM problems p
      WHERE p.id = prompts.problem_id
        AND p.is_deleted = false
        AND (
          p.visibility = 'public'
          OR p.visibility = 'unlisted'
          OR (p.visibility = 'private' AND (
            p.owner_id = (select auth.uid())
            OR is_problem_member(p.id, (select auth.uid()))
          ))
        )
    )
  );

-- Optimize problem_members policies
DROP POLICY IF EXISTS "pm_select" ON problem_members;
CREATE POLICY "pm_select" ON problem_members
  FOR SELECT
  USING (
    user_id = (select auth.uid())
    OR is_problem_member(problem_id, (select auth.uid()))
  );

DROP POLICY IF EXISTS "pm_insert" ON problem_members;
CREATE POLICY "pm_insert" ON problem_members
  FOR INSERT
  WITH CHECK (
    is_problem_member(problem_id, (select auth.uid()))
  );

DROP POLICY IF EXISTS "pm_delete" ON problem_members;
CREATE POLICY "pm_delete" ON problem_members
  FOR DELETE
  USING (
    is_problem_member(problem_id, (select auth.uid()))
  );

-- Optimize votes policies
DROP POLICY IF EXISTS "Authenticated users can vote" ON votes;
CREATE POLICY "Authenticated users can vote" ON votes
  FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL AND user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own votes" ON votes;
CREATE POLICY "Users can update their own votes" ON votes
  FOR UPDATE
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own votes" ON votes;
CREATE POLICY "Users can delete their own votes" ON votes
  FOR DELETE
  USING (user_id = (select auth.uid()));

-- Optimize prompt_events policy
DROP POLICY IF EXISTS "Authenticated users can create prompt events" ON prompt_events;
CREATE POLICY "Authenticated users can create prompt events" ON prompt_events
  FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL AND user_id = (select auth.uid()));

-- Optimize prompt_reviews policies
DROP POLICY IF EXISTS "prompt_reviews_insert" ON prompt_reviews;
CREATE POLICY "prompt_reviews_insert" ON prompt_reviews
  FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL AND user_id = (select auth.uid()));

DROP POLICY IF EXISTS "prompt_reviews_delete" ON prompt_reviews;
CREATE POLICY "prompt_reviews_delete" ON prompt_reviews
  FOR DELETE
  USING (user_id = (select auth.uid()));

-- Optimize reports policies
DROP POLICY IF EXISTS "reports_insert" ON reports;
CREATE POLICY "reports_insert" ON reports
  FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL AND reporter_id = (select auth.uid()));

DROP POLICY IF EXISTS "reports_select" ON reports;
CREATE POLICY "reports_select" ON reports
  FOR SELECT
  USING (reporter_id = (select auth.uid()) OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid()) AND role IN ('admin', 'moderator')
  ));

DROP POLICY IF EXISTS "reports_update" ON reports;
CREATE POLICY "reports_update" ON reports
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid()) AND role IN ('admin', 'moderator')
  ));

-- =====================================================
-- PART 3: Drop Duplicate Indexes
-- =====================================================

-- Drop duplicate problem_members indexes (keep the constraint-based one)
DROP INDEX IF EXISTS problem_members_user_problem_unique;

-- Drop duplicate prompts indexes (keep the constraint-based one)
DROP INDEX IF EXISTS prompts_problem_slug_unique;

-- Drop duplicate votes indexes
DROP INDEX IF EXISTS idx_votes_user_critical;
DROP INDEX IF EXISTS idx_votes_prompt_critical;

-- Drop duplicate problem_tags indexes
DROP INDEX IF EXISTS problem_tags_tag_id_idx;

-- Drop duplicate prompt_tags indexes
DROP INDEX IF EXISTS prompt_tags_tag_id_idx;

-- Drop duplicate prompt_reviews indexes
DROP INDEX IF EXISTS prompt_reviews_user_prompt_unique;

-- Drop duplicate problems indexes
DROP INDEX IF EXISTS idx_problems_created_at;

-- Drop duplicate prompts indexes
DROP INDEX IF EXISTS idx_prompts_parent_prompt;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check remaining policies (should be cleaner)
/*
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('problems', 'prompts', 'problem_members', 'votes')
ORDER BY tablename, cmd, policyname;
*/

-- Check for remaining duplicate indexes
/*
SELECT 
  t.tablename,
  array_agg(i.indexname) as duplicate_indexes
FROM pg_indexes i
JOIN pg_indexes t ON i.tablename = t.tablename 
  AND i.indexdef = t.indexdef 
  AND i.indexname != t.indexname
WHERE i.schemaname = 'public'
GROUP BY t.tablename, t.indexdef
HAVING COUNT(*) > 1;
*/

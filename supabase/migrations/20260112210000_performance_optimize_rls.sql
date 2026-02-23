-- Performance Optimization Part 2: Wrap auth.uid() in subqueries
-- This prevents re-evaluation for each row, significantly improving query performance

-- PROFILES
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO public
USING (id = (SELECT auth.uid())) WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
ON public.profiles FOR INSERT TO public
WITH CHECK (id = (SELECT auth.uid()));

-- WORKSPACES
DROP POLICY IF EXISTS "workspaces_insert_authenticated" ON public.workspaces;
CREATE POLICY "workspaces_insert_authenticated"
ON public.workspaces FOR INSERT TO authenticated
WITH CHECK (owner_id = (SELECT auth.uid()) OR public.is_moderator());

DROP POLICY IF EXISTS "workspaces_update_owner_admin" ON public.workspaces;
CREATE POLICY "workspaces_update_owner_admin"
ON public.workspaces FOR UPDATE TO authenticated
USING (public.is_moderator() OR owner_id = (SELECT auth.uid()) OR public.workspace_role(id) IN ('owner','admin'))
WITH CHECK (public.is_moderator() OR owner_id = (SELECT auth.uid()) OR public.workspace_role(id) IN ('owner','admin'));

DROP POLICY IF EXISTS "workspaces_delete_owner_admin" ON public.workspaces;
CREATE POLICY "workspaces_delete_owner_admin"
ON public.workspaces FOR DELETE TO authenticated
USING (public.is_moderator() OR owner_id = (SELECT auth.uid()) OR public.workspace_role(id) = 'owner');

-- PROMPTS
DROP POLICY IF EXISTS "prompts_insert_policy" ON public.prompts;
CREATE POLICY "prompts_insert_policy"
ON public.prompts FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) IS NOT NULL AND public.can_view_prompt(id));

DROP POLICY IF EXISTS "prompts_update_policy" ON public.prompts;
CREATE POLICY "prompts_update_policy"
ON public.prompts FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) IS NOT NULL AND public.can_view_prompt(id))
WITH CHECK ((SELECT auth.uid()) IS NOT NULL AND public.can_view_prompt(id));

DROP POLICY IF EXISTS "prompts_delete_policy" ON public.prompts;
CREATE POLICY "prompts_delete_policy"
ON public.prompts FOR DELETE TO authenticated
USING ((SELECT auth.uid()) IS NOT NULL AND public.can_view_prompt(id));

-- PROBLEMS
DROP POLICY IF EXISTS "problems_insert_policy" ON public.problems;
CREATE POLICY "problems_insert_policy"
ON public.problems FOR INSERT TO authenticated
WITH CHECK (created_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "problems_update_policy" ON public.problems;
CREATE POLICY "problems_update_policy"
ON public.problems FOR UPDATE TO authenticated
USING (public.is_moderator() OR public.problem_role(id) IN ('owner', 'admin'))
WITH CHECK (public.is_moderator() OR public.problem_role(id) IN ('owner', 'admin'));

DROP POLICY IF EXISTS "problems_delete_policy" ON public.problems;
CREATE POLICY "problems_delete_policy"
ON public.problems FOR DELETE TO authenticated
USING (public.is_moderator() OR public.problem_role(id) = 'owner');

-- PROBLEM_MEMBERS
DROP POLICY IF EXISTS "problem_members_insert_policy" ON public.problem_members;
CREATE POLICY "problem_members_insert_policy"
ON public.problem_members FOR INSERT TO authenticated
WITH CHECK (public.is_moderator() OR public.problem_role(problem_id) IN ('owner', 'admin'));

DROP POLICY IF EXISTS "problem_members_delete_policy" ON public.problem_members;
CREATE POLICY "problem_members_delete_policy"
ON public.problem_members FOR DELETE TO authenticated
USING (public.is_moderator() OR public.problem_role(problem_id) IN ('owner', 'admin') OR user_id = (SELECT auth.uid()));

-- VOTES
DROP POLICY IF EXISTS "Authenticated users can vote" ON public.votes;
CREATE POLICY "Authenticated users can vote"
ON public.votes FOR INSERT TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()) AND public.can_view_prompt(prompt_id));

DROP POLICY IF EXISTS "Users can update their own votes" ON public.votes;
CREATE POLICY "Users can update their own votes"
ON public.votes FOR UPDATE TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own votes" ON public.votes;
CREATE POLICY "Users can delete their own votes"
ON public.votes FOR DELETE TO authenticated
USING (user_id = (SELECT auth.uid()));

-- PROMPT_EVENTS
DROP POLICY IF EXISTS "Authenticated users can create prompt events" ON public.prompt_events;
CREATE POLICY "Authenticated users can create prompt events"
ON public.prompt_events FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- REPORTS
DROP POLICY IF EXISTS "reports_insert" ON public.reports;
CREATE POLICY "reports_insert"
ON public.reports FOR INSERT TO authenticated
WITH CHECK (reporter_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "reports_update" ON public.reports;
CREATE POLICY "reports_update"
ON public.reports FOR UPDATE TO authenticated
USING (public.is_moderator())
WITH CHECK (public.is_moderator());

-- PROMPT_REVIEWS
DROP POLICY IF EXISTS "prompt_reviews_insert" ON public.prompt_reviews;
CREATE POLICY "prompt_reviews_insert"
ON public.prompt_reviews FOR INSERT TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()) AND public.can_view_prompt(prompt_id));

DROP POLICY IF EXISTS "prompt_reviews_update" ON public.prompt_reviews;
CREATE POLICY "prompt_reviews_update"
ON public.prompt_reviews FOR UPDATE TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "prompt_reviews_delete" ON public.prompt_reviews;
CREATE POLICY "prompt_reviews_delete"
ON public.prompt_reviews FOR DELETE TO authenticated
USING (user_id = (SELECT auth.uid()));

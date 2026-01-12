-- 20260112160000_implement_rls_policies.sql
-- Comprehensive Row Level Security implementation

BEGIN;

-- ============================================================================
-- 1. Helper Functions
-- ============================================================================

-- Drop existing functions first (avoid parameter name conflicts)
-- CASCADE will also drop dependent policies which we're recreating anyway
DROP FUNCTION IF EXISTS public.is_workspace_member(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.workspace_role(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_problem_member(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.problem_role(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.can_view_problem(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.can_view_prompt(uuid) CASCADE;

-- Role checks
CREATE OR REPLACE FUNCTION public.is_moderator()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'moderator')
  );
$$;

-- Workspace membership
CREATE OR REPLACE FUNCTION public.is_workspace_member(_workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members wm
    WHERE wm.workspace_id = _workspace_id
      AND wm.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.workspace_role(_workspace_id uuid)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT wm.role
  FROM public.workspace_members wm
  WHERE wm.workspace_id = _workspace_id
    AND wm.user_id = auth.uid()
  LIMIT 1;
$$;

-- Problem membership
CREATE OR REPLACE FUNCTION public.is_problem_member(_problem_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.problem_members pm
    WHERE pm.problem_id = _problem_id
      AND pm.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.problem_role(_problem_id uuid)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT pm.role
  FROM public.problem_members pm
  WHERE pm.problem_id = _problem_id
    AND pm.user_id = auth.uid()
  LIMIT 1;
$$;

-- Can view problem
CREATE OR REPLACE FUNCTION public.can_view_problem(_problem_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT
    public.is_moderator()
    OR public.is_problem_member(_problem_id)
    OR EXISTS (
      SELECT 1
      FROM public.problems pr
      WHERE pr.id = _problem_id
        AND pr.is_deleted = false
        AND pr.is_hidden = false
        AND pr.visibility = 'public'
        AND pr.is_listed = true
    );
$$;

-- Can view prompt
CREATE OR REPLACE FUNCTION public.can_view_prompt(_prompt_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT
    public.is_moderator()
    OR EXISTS (
      SELECT 1
      FROM public.prompts p
      JOIN public.problems pr ON pr.id = p.problem_id
      WHERE p.id = _prompt_id
        AND p.is_deleted = false
        AND p.is_hidden = false
        AND pr.is_deleted = false
        AND pr.is_hidden = false
        AND (
          public.is_problem_member(pr.id)
          OR (
            pr.visibility = 'public'
            AND pr.is_listed = true
            AND p.is_listed = true
          )
        )
    );
$$;

-- Service role check
CREATE OR REPLACE FUNCTION public.is_service_role()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role';
$$;

-- ============================================================================
-- 2. Enable RLS
-- ============================================================================

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. Profiles Policies
-- ============================================================================

DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
CREATE POLICY "profiles_select_public"
ON public.profiles
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- ============================================================================
-- 4. Workspaces Policies
-- ============================================================================

DROP POLICY IF EXISTS "workspaces_select_members" ON public.workspaces;
CREATE POLICY "workspaces_select_members"
ON public.workspaces
FOR SELECT
TO authenticated
USING (public.is_workspace_member(id) OR public.is_moderator());

DROP POLICY IF EXISTS "workspaces_insert_authenticated" ON public.workspaces;
CREATE POLICY "workspaces_insert_authenticated"
ON public.workspaces
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid() OR public.is_moderator());

DROP POLICY IF EXISTS "workspaces_update_owner_admin" ON public.workspaces;
CREATE POLICY "workspaces_update_owner_admin"
ON public.workspaces
FOR UPDATE
TO authenticated
USING (
  public.is_moderator()
  OR owner_id = auth.uid()
  OR public.workspace_role(id) IN ('owner','admin')
)
WITH CHECK (
  public.is_moderator()
  OR owner_id = auth.uid()
  OR public.workspace_role(id) IN ('owner','admin')
);

DROP POLICY IF EXISTS "workspaces_delete_owner_admin" ON public.workspaces;
CREATE POLICY "workspaces_delete_owner_admin"
ON public.workspaces
FOR DELETE
TO authenticated
USING (
  public.is_moderator()
  OR owner_id = auth.uid()
  OR public.workspace_role(id) = 'owner'
);

-- ============================================================================
-- 5. Workspace Members Policies
-- ============================================================================

DROP POLICY IF EXISTS "workspace_members_select_members" ON public.workspace_members;
CREATE POLICY "workspace_members_select_members"
ON public.workspace_members
FOR SELECT
TO authenticated
USING (
  public.is_moderator()
  OR user_id = auth.uid()
  OR public.is_workspace_member(workspace_id)
);

DROP POLICY IF EXISTS "workspace_members_insert_owner_admin" ON public.workspace_members;
CREATE POLICY "workspace_members_insert_owner_admin"
ON public.workspace_members
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_moderator()
  OR public.workspace_role(workspace_id) IN ('owner','admin')
);

DROP POLICY IF EXISTS "workspace_members_update_owner_admin" ON public.workspace_members;
CREATE POLICY "workspace_members_update_owner_admin"
ON public.workspace_members
FOR UPDATE
TO authenticated
USING (
  public.is_moderator()
  OR public.workspace_role(workspace_id) IN ('owner','admin')
)
WITH CHECK (
  public.is_moderator()
  OR public.workspace_role(workspace_id) IN ('owner','admin')
);

DROP POLICY IF EXISTS "workspace_members_delete_owner_admin" ON public.workspace_members;
CREATE POLICY "workspace_members_delete_owner_admin"
ON public.workspace_members
FOR DELETE
TO authenticated
USING (
  public.is_moderator()
  OR public.workspace_role(workspace_id) IN ('owner','admin')
);

-- ============================================================================
-- 6. Problems Policies
-- ============================================================================

DROP POLICY IF EXISTS "problems_select_public_or_members" ON public.problems;
CREATE POLICY "problems_select_public_or_members"
ON public.problems
FOR SELECT
TO public
USING (
  public.is_moderator()
  OR public.is_problem_member(id)
  OR (
    visibility = 'public'
    AND is_listed = true
    AND is_hidden = false
    AND is_deleted = false
  )
);

DROP POLICY IF EXISTS "problems_insert_authenticated" ON public.problems;
CREATE POLICY "problems_insert_authenticated"
ON public.problems
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND owner_id = auth.uid()
);

DROP POLICY IF EXISTS "problems_update_owner_admin" ON public.problems;
CREATE POLICY "problems_update_owner_admin"
ON public.problems
FOR UPDATE
TO authenticated
USING (
  public.is_moderator()
  OR owner_id = auth.uid()
  OR public.problem_role(id) IN ('owner','admin')
)
WITH CHECK (
  public.is_moderator()
  OR owner_id = auth.uid()
  OR public.problem_role(id) IN ('owner','admin')
);

DROP POLICY IF EXISTS "problems_delete_owner_admin" ON public.problems;
CREATE POLICY "problems_delete_owner_admin"
ON public.problems
FOR DELETE
TO authenticated
USING (
  public.is_moderator()
  OR owner_id = auth.uid()
  OR public.problem_role(id) = 'owner'
);

-- ============================================================================
-- 7. Problem Members Policies
-- ============================================================================

DROP POLICY IF EXISTS "problem_members_select_members" ON public.problem_members;
CREATE POLICY "problem_members_select_members"
ON public.problem_members
FOR SELECT
TO authenticated
USING (
  public.is_moderator()
  OR user_id = auth.uid()
  OR public.is_problem_member(problem_id)
);

DROP POLICY IF EXISTS "problem_members_insert_owner_admin" ON public.problem_members;
CREATE POLICY "problem_members_insert_owner_admin"
ON public.problem_members
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_moderator()
  OR public.problem_role(problem_id) IN ('owner','admin')
);

DROP POLICY IF EXISTS "problem_members_update_owner_admin" ON public.problem_members;
CREATE POLICY "problem_members_update_owner_admin"
ON public.problem_members
FOR UPDATE
TO authenticated
USING (
  public.is_moderator()
  OR public.problem_role(problem_id) IN ('owner','admin')
)
WITH CHECK (
  public.is_moderator()
  OR public.problem_role(problem_id) IN ('owner','admin')
);

DROP POLICY IF EXISTS "problem_members_delete_owner_admin" ON public.problem_members;
CREATE POLICY "problem_members_delete_owner_admin"
ON public.problem_members
FOR DELETE
TO authenticated
USING (
  public.is_moderator()
  OR public.problem_role(problem_id) IN ('owner','admin')
);

-- ============================================================================
-- 8. Tags Policies
-- ============================================================================

DROP POLICY IF EXISTS "tags_select_public" ON public.tags;
CREATE POLICY "tags_select_public"
ON public.tags
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "tags_write_moderators" ON public.tags;
CREATE POLICY "tags_write_moderators"
ON public.tags
FOR ALL
TO authenticated
USING (public.is_moderator())
WITH CHECK (public.is_moderator());

-- ============================================================================
-- 9. Problem Tags Policies
-- ============================================================================

DROP POLICY IF EXISTS "problem_tags_select_viewable" ON public.problem_tags;
CREATE POLICY "problem_tags_select_viewable"
ON public.problem_tags
FOR SELECT
TO public
USING (public.can_view_problem(problem_id));

DROP POLICY IF EXISTS "problem_tags_insert_owner_admin" ON public.problem_tags;
CREATE POLICY "problem_tags_insert_owner_admin"
ON public.problem_tags
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_moderator()
  OR public.problem_role(problem_id) IN ('owner','admin')
);

DROP POLICY IF EXISTS "problem_tags_delete_owner_admin" ON public.problem_tags;
CREATE POLICY "problem_tags_delete_owner_admin"
ON public.problem_tags
FOR DELETE
TO authenticated
USING (
  public.is_moderator()
  OR public.problem_role(problem_id) IN ('owner','admin')
);

-- ============================================================================
-- 10. Problem Stats Policies (FIX UNRESTRICTED)
-- ============================================================================

DROP POLICY IF EXISTS "problem_stats_select_viewable" ON public.problem_stats;
CREATE POLICY "problem_stats_select_viewable"
ON public.problem_stats
FOR SELECT
TO public
USING (public.can_view_problem(problem_id));

DROP POLICY IF EXISTS "problem_stats_write_service_only" ON public.problem_stats;
CREATE POLICY "problem_stats_write_service_only"
ON public.problem_stats
FOR INSERT
TO authenticated
WITH CHECK (public.is_service_role());

DROP POLICY IF EXISTS "problem_stats_update_service_only" ON public.problem_stats;
CREATE POLICY "problem_stats_update_service_only"
ON public.problem_stats
FOR UPDATE
TO authenticated
USING (public.is_service_role())
WITH CHECK (public.is_service_role());

DROP POLICY IF EXISTS "problem_stats_delete_service_only" ON public.problem_stats;
CREATE POLICY "problem_stats_delete_service_only"
ON public.problem_stats
FOR DELETE
TO authenticated
USING (public.is_service_role());

-- ============================================================================
-- 11. Prompts Policies
-- ============================================================================

DROP POLICY IF EXISTS "prompts_select_public_or_members" ON public.prompts;
CREATE POLICY "prompts_select_public_or_members"
ON public.prompts
FOR SELECT
TO public
USING (public.can_view_prompt(id));

DROP POLICY IF EXISTS "prompts_insert_authenticated" ON public.prompts;
CREATE POLICY "prompts_insert_authenticated"
ON public.prompts
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND (
    problem_id IS NULL
    OR public.is_problem_member(problem_id)
  )
);

DROP POLICY IF EXISTS "prompts_update_owner_admin" ON public.prompts;
CREATE POLICY "prompts_update_owner_admin"
ON public.prompts
FOR UPDATE
TO authenticated
USING (
  public.is_moderator()
  OR created_by = auth.uid()
  OR (problem_id IS NOT NULL AND public.problem_role(problem_id) IN ('owner','admin'))
)
WITH CHECK (
  public.is_moderator()
  OR created_by = auth.uid()
  OR (problem_id IS NOT NULL AND public.problem_role(problem_id) IN ('owner','admin'))
);

DROP POLICY IF EXISTS "prompts_delete_owner_admin" ON public.prompts;
CREATE POLICY "prompts_delete_owner_admin"
ON public.prompts
FOR DELETE
TO authenticated
USING (
  public.is_moderator()
  OR created_by = auth.uid()
  OR (problem_id IS NOT NULL AND public.problem_role(problem_id) = 'owner')
);

-- ============================================================================
-- 12. Prompt Stats Policies (FIX UNRESTRICTED)
-- ============================================================================

DROP POLICY IF EXISTS "prompt_stats_select_viewable" ON public.prompt_stats;
CREATE POLICY "prompt_stats_select_viewable"
ON public.prompt_stats
FOR SELECT
TO public
USING (public.can_view_prompt(prompt_id));

DROP POLICY IF EXISTS "prompt_stats_write_service_only" ON public.prompt_stats;
CREATE POLICY "prompt_stats_write_service_only"
ON public.prompt_stats
FOR INSERT
TO authenticated
WITH CHECK (public.is_service_role());

DROP POLICY IF EXISTS "prompt_stats_update_service_only" ON public.prompt_stats;
CREATE POLICY "prompt_stats_update_service_only"
ON public.prompt_stats
FOR UPDATE
TO authenticated
USING (public.is_service_role())
WITH CHECK (public.is_service_role());

DROP POLICY IF EXISTS "prompt_stats_delete_service_only" ON public.prompt_stats;
CREATE POLICY "prompt_stats_delete_service_only"
ON public.prompt_stats
FOR DELETE
TO authenticated
USING (public.is_service_role());

-- ============================================================================
-- 13. Votes Policies
-- ============================================================================

DROP POLICY IF EXISTS "votes_select_prompt_owner_or_self" ON public.votes;
CREATE POLICY "votes_select_prompt_owner_or_self"
ON public.votes
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_moderator()
  OR EXISTS (
    SELECT 1
    FROM public.prompts p
    WHERE p.id = prompt_id
      AND (p.created_by = auth.uid()
        OR (p.problem_id IS NOT NULL AND public.problem_role(p.problem_id) IN ('owner','admin'))
      )
  )
);

DROP POLICY IF EXISTS "votes_insert_own" ON public.votes;
CREATE POLICY "votes_insert_own"
ON public.votes
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND public.can_view_prompt(prompt_id)
);

DROP POLICY IF EXISTS "votes_update_own" ON public.votes;
CREATE POLICY "votes_update_own"
ON public.votes
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  AND public.can_view_prompt(prompt_id)
);

DROP POLICY IF EXISTS "votes_delete_own" ON public.votes;
CREATE POLICY "votes_delete_own"
ON public.votes
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ============================================================================
-- 14. Prompt Reviews Policies
-- ============================================================================

DROP POLICY IF EXISTS "prompt_reviews_select_viewable" ON public.prompt_reviews;
CREATE POLICY "prompt_reviews_select_viewable"
ON public.prompt_reviews
FOR SELECT
TO public
USING (public.can_view_prompt(prompt_id));

DROP POLICY IF EXISTS "prompt_reviews_insert_own" ON public.prompt_reviews;
CREATE POLICY "prompt_reviews_insert_own"
ON public.prompt_reviews
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND public.can_view_prompt(prompt_id)
);

DROP POLICY IF EXISTS "prompt_reviews_update_own" ON public.prompt_reviews;
CREATE POLICY "prompt_reviews_update_own"
ON public.prompt_reviews
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "prompt_reviews_delete_own" ON public.prompt_reviews;
CREATE POLICY "prompt_reviews_delete_own"
ON public.prompt_reviews
FOR DELETE
TO authenticated
USING (user_id = auth.uid() OR public.is_moderator());

-- ============================================================================
-- 15. Prompt Events Policies
-- ============================================================================

DROP POLICY IF EXISTS "prompt_events_insert_own" ON public.prompt_events;
CREATE POLICY "prompt_events_insert_own"
ON public.prompt_events
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (prompt_id IS NULL OR public.can_view_prompt(prompt_id))
);

DROP POLICY IF EXISTS "prompt_events_select_owner_admin_or_mod" ON public.prompt_events;
CREATE POLICY "prompt_events_select_owner_admin_or_mod"
ON public.prompt_events
FOR SELECT
TO authenticated
USING (
  public.is_moderator()
  OR EXISTS (
    SELECT 1
    FROM public.prompts p
    WHERE p.id = prompt_id
      AND (
        p.created_by = auth.uid()
        OR (p.problem_id IS NOT NULL AND public.problem_role(p.problem_id) IN ('owner','admin'))
      )
  )
);

DROP POLICY IF EXISTS "prompt_events_delete_mod_only" ON public.prompt_events;
CREATE POLICY "prompt_events_delete_mod_only"
ON public.prompt_events
FOR DELETE
TO authenticated
USING (public.is_moderator());

-- ============================================================================
-- 16. Reports Policies
-- ============================================================================

DROP POLICY IF EXISTS "reports_insert_authenticated" ON public.reports;
CREATE POLICY "reports_insert_authenticated"
ON public.reports
FOR INSERT
TO authenticated
WITH CHECK (
  reporter_id = auth.uid()
  AND (
    (content_type = 'prompt' AND public.can_view_prompt(content_id))
    OR (content_type = 'problem' AND public.can_view_problem(content_id))
    OR (content_type = 'comment')
  )
);

DROP POLICY IF EXISTS "reports_select_mod" ON public.reports;
CREATE POLICY "reports_select_mod"
ON public.reports
FOR SELECT
TO authenticated
USING (public.is_moderator());

DROP POLICY IF EXISTS "reports_update_mod" ON public.reports;
CREATE POLICY "reports_update_mod"
ON public.reports
FOR UPDATE
TO authenticated
USING (public.is_moderator())
WITH CHECK (public.is_moderator());

DROP POLICY IF EXISTS "reports_delete_mod" ON public.reports;
CREATE POLICY "reports_delete_mod"
ON public.reports
FOR DELETE
TO authenticated
USING (public.is_moderator());

COMMIT;

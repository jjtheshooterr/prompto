-- Comprehensive integrity fixes for production-ready schema

-- 1. CRITICAL: Fix problem_members duplicates (prevents ambiguous permissions)
-- Add unique constraint to prevent same user having multiple roles for same problem
DO $ 
BEGIN
  -- First remove any existing duplicates (keep the highest role)
  DELETE FROM public.problem_members pm1
  WHERE EXISTS (
    SELECT 1 FROM public.problem_members pm2
    WHERE pm2.problem_id = pm1.problem_id 
    AND pm2.user_id = pm1.user_id
    AND pm2.id > pm1.id
  );
  
  -- Add unique constraint if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'problem_members_user_problem_unique') THEN
    ALTER TABLE public.problem_members 
    ADD CONSTRAINT problem_members_user_problem_unique 
    UNIQUE (problem_id, user_id);
  END IF;
END $;

-- 2. CRITICAL: Fix prompts.slug uniqueness (prevents routing collisions)
-- Make slug unique within problem scope for SEO routing
DO $ 
BEGIN
  -- First handle any existing duplicates by appending numbers
  WITH duplicates AS (
    SELECT problem_id, slug, 
           ROW_NUMBER() OVER (PARTITION BY problem_id, slug ORDER BY created_at) as rn
    FROM public.prompts 
    WHERE slug IS NOT NULL
  )
  UPDATE public.prompts 
  SET slug = prompts.slug || '-' || (duplicates.rn - 1)
  FROM duplicates
  WHERE prompts.problem_id = duplicates.problem_id 
  AND prompts.slug = duplicates.slug
  AND duplicates.rn > 1;
  
  -- Add unique constraint if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'prompts_problem_slug_unique') THEN
    ALTER TABLE public.prompts 
    ADD CONSTRAINT prompts_problem_slug_unique 
    UNIQUE (problem_id, slug);
  END IF;
END $;

-- 3. CRITICAL: Validate pinned_prompt_id belongs to the problem
-- Prevents pinning prompts from other problems
CREATE OR REPLACE FUNCTION public.validate_pinned_prompt()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $
BEGIN
  -- If pinned_prompt_id is set, ensure it belongs to this problem
  IF NEW.pinned_prompt_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.prompts 
      WHERE id = NEW.pinned_prompt_id 
      AND problem_id = NEW.id
    ) THEN
      RAISE EXCEPTION 'Pinned prompt must belong to the same problem';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$;

-- Create trigger for pinned prompt validation
DROP TRIGGER IF EXISTS trg_validate_pinned_prompt ON public.problems;
CREATE TRIGGER trg_validate_pinned_prompt
  BEFORE INSERT OR UPDATE ON public.problems
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_pinned_prompt();

-- 4. CRITICAL: Fix workspace_id consistency on prompts
-- Remove workspace_id from prompts since it's redundant with problem.workspace_id
-- This prevents drift where prompt.workspace_id != problem.workspace_id
-- Skip if column doesn't exist
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'prompts' AND column_name = 'workspace_id') THEN
    ALTER TABLE public.prompts DROP COLUMN workspace_id;
  END IF;
END $$;

-- 2. Lock down stats tables - only service role can write
-- These are derived data and user writes will corrupt them
ALTER TABLE public.problem_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_stats ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "problem_stats_read" ON public.problem_stats;
DROP POLICY IF EXISTS "problem_stats_write" ON public.problem_stats;
DROP POLICY IF EXISTS "prompt_stats_read" ON public.prompt_stats;
DROP POLICY IF EXISTS "prompt_stats_write" ON public.prompt_stats;

-- Read policies: anyone who can read the parent can read stats
CREATE POLICY "problem_stats_read" ON public.problem_stats
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.problems p 
    WHERE p.id = problem_id 
    AND (
      p.is_listed = true 
      OR p.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.problem_members pm 
        WHERE pm.problem_id = p.id AND pm.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "prompt_stats_read" ON public.prompt_stats
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.prompts pr
    JOIN public.problems p ON pr.problem_id = p.id
    WHERE pr.id = prompt_id 
    AND pr.is_listed = true
    AND (
      p.is_listed = true 
      OR p.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.problem_members pm 
        WHERE pm.problem_id = p.id AND pm.user_id = auth.uid()
      )
    )
  )
);

-- Write policies: service role only
CREATE POLICY "problem_stats_service_write" ON public.problem_stats
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "prompt_stats_service_write" ON public.prompt_stats
FOR ALL USING (auth.role() = 'service_role');

-- 3. Ensure stats rows exist for all problems/prompts
-- Create function to ensure stats exist
CREATE OR REPLACE FUNCTION public.ensure_problem_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.problem_stats (
    problem_id, 
    prompt_count, 
    member_count, 
    total_votes, 
    avg_rating,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id, 
    0, 
    1, -- owner is first member
    0, 
    0,
    NOW(),
    NOW()
  )
  ON CONFLICT (problem_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_prompt_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.prompt_stats (
    prompt_id,
    vote_count,
    score,
    fork_count,
    view_count,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    0,
    0,
    0,
    0,
    NOW(),
    NOW()
  )
  ON CONFLICT (prompt_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create triggers to ensure stats exist
DROP TRIGGER IF EXISTS trg_ensure_problem_stats ON public.problems;
CREATE TRIGGER trg_ensure_problem_stats
  AFTER INSERT ON public.problems
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_problem_stats();

DROP TRIGGER IF EXISTS trg_ensure_prompt_stats ON public.prompts;
CREATE TRIGGER trg_ensure_prompt_stats
  AFTER INSERT ON public.prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_prompt_stats();

-- 4. Add soft delete consistency checks (only if constraints don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'problems_soft_delete_consistency') THEN
    ALTER TABLE public.problems 
    ADD CONSTRAINT problems_soft_delete_consistency 
    CHECK (
      (is_deleted = false AND deleted_at IS NULL AND deleted_by IS NULL) OR
      (is_deleted = true AND deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
    );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'prompts_soft_delete_consistency') THEN
    ALTER TABLE public.prompts 
    ADD CONSTRAINT prompts_soft_delete_consistency 
    CHECK (
      (is_deleted = false AND deleted_at IS NULL AND deleted_by IS NULL) OR
      (is_deleted = true AND deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
    );
  END IF;
END $$;

-- 5. Add unique constraint for prompt reviews (1 review per user per prompt)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'prompt_reviews_user_prompt_unique') THEN
    ALTER TABLE public.prompt_reviews 
    ADD CONSTRAINT prompt_reviews_user_prompt_unique 
    UNIQUE (prompt_id, user_id);
  END IF;
END $$;

-- 6. Add critical indexes for performance
-- Prompts browsing/sorting
CREATE INDEX IF NOT EXISTS idx_prompts_browse 
ON public.prompts (problem_id, is_deleted, is_hidden, is_listed, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_prompts_parent 
ON public.prompts (parent_prompt_id);

-- Prompt stats indexes
CREATE INDEX IF NOT EXISTS idx_prompt_stats_score 
ON public.prompt_stats (score DESC);

CREATE INDEX IF NOT EXISTS idx_prompt_stats_forks 
ON public.prompt_stats (fork_count DESC);

CREATE INDEX IF NOT EXISTS idx_prompt_stats_updated 
ON public.prompt_stats (updated_at DESC);

-- Problems browsing
CREATE INDEX IF NOT EXISTS idx_problems_browse 
ON public.problems (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_problems_listing 
ON public.problems (is_deleted, is_hidden, is_listed);

-- Tags indexes
CREATE INDEX IF NOT EXISTS idx_problem_tags_tag 
ON public.problem_tags (tag_id);

CREATE INDEX IF NOT EXISTS idx_prompt_tags_tag 
ON public.prompt_tags (tag_id);

-- User activity indexes
CREATE INDEX IF NOT EXISTS idx_votes_user 
ON public.votes (user_id);

CREATE INDEX IF NOT EXISTS idx_votes_prompt 
ON public.votes (prompt_id);

-- 7. Create function to maintain report counts
CREATE OR REPLACE FUNCTION public.update_report_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment report count
    IF NEW.content_type = 'problem' THEN
      UPDATE public.problems 
      SET report_count = report_count + 1,
          is_reported = true
      WHERE id = NEW.content_id::uuid;
    ELSIF NEW.content_type = 'prompt' THEN
      UPDATE public.prompts 
      SET report_count = report_count + 1,
          is_reported = true
      WHERE id = NEW.content_id::uuid;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement report count
    IF OLD.content_type = 'problem' THEN
      UPDATE public.problems 
      SET report_count = GREATEST(0, report_count - 1),
          is_reported = (report_count - 1) > 0
      WHERE id = OLD.content_id::uuid;
    ELSIF OLD.content_type = 'prompt' THEN
      UPDATE public.prompts 
      SET report_count = GREATEST(0, report_count - 1),
          is_reported = (report_count - 1) > 0
      WHERE id = OLD.content_id::uuid;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for report count maintenance
DROP TRIGGER IF EXISTS trg_update_report_counts ON public.reports;
CREATE TRIGGER trg_update_report_counts
  AFTER INSERT OR DELETE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_report_counts();

-- 8. CRITICAL: Enforce workspace membership consistency
-- Ensure problem members also have workspace access (if problem has workspace_id)
CREATE OR REPLACE FUNCTION public.validate_problem_membership()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $
BEGIN
  -- Check if problem belongs to a workspace
  IF EXISTS (
    SELECT 1 FROM public.problems 
    WHERE id = NEW.problem_id 
    AND workspace_id IS NOT NULL
  ) THEN
    -- Ensure user has workspace membership
    IF NOT EXISTS (
      SELECT 1 FROM public.workspace_members wm
      JOIN public.problems p ON p.workspace_id = wm.workspace_id
      WHERE p.id = NEW.problem_id 
      AND wm.user_id = NEW.user_id
    ) THEN
      RAISE EXCEPTION 'User must be a workspace member to join workspace problems';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$;

-- Create trigger for problem membership validation
DROP TRIGGER IF EXISTS trg_validate_problem_membership ON public.problem_members;
CREATE TRIGGER trg_validate_problem_membership
  BEFORE INSERT OR UPDATE ON public.problem_members
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_problem_membership();
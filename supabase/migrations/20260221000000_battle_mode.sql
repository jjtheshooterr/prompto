-- =============================================================================
-- 20260221000000_battle_mode.sql
-- Blind A/B comparison system + performance-based ranking
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. Extend prompt_stats with battle aggregate columns
-- =============================================================================

ALTER TABLE public.prompt_stats
  ADD COLUMN IF NOT EXISTS comparisons_count int          NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comparison_wins   int          NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comparison_losses int          NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS win_rate          numeric(5,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_compared_at  timestamptz;

-- =============================================================================
-- 2. Extend profiles with rater trust columns
-- =============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS comparisons_cast int          NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rater_weight     numeric(4,3) NOT NULL DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS trusted_rater    boolean      NOT NULL DEFAULT false;

-- =============================================================================
-- 3. Extend prompts with depth + root lineage
-- =============================================================================

ALTER TABLE public.prompts
  ADD COLUMN IF NOT EXISTS depth          int  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS root_prompt_id uuid REFERENCES public.prompts(id);

-- Trigger: auto-maintain depth and root_prompt_id on INSERT and on UPDATE
-- of parent_prompt_id (e.g. re-parenting, rare but handled)
CREATE OR REPLACE FUNCTION public.tg_set_prompt_depth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parent public.prompts;
BEGIN
  IF NEW.parent_prompt_id IS NULL THEN
    NEW.depth          := 0;
    -- Safety: COALESCE in case NEW.id is somehow null (shouldn't happen with gen_random_uuid)
    NEW.root_prompt_id := COALESCE(NEW.root_prompt_id, NEW.id);
  ELSE
    SELECT * INTO v_parent FROM public.prompts WHERE id = NEW.parent_prompt_id;
    NEW.depth          := COALESCE(v_parent.depth, 0) + 1;
    NEW.root_prompt_id := COALESCE(v_parent.root_prompt_id, v_parent.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_prompt_depth ON public.prompts;
CREATE TRIGGER set_prompt_depth
BEFORE INSERT OR UPDATE OF parent_prompt_id ON public.prompts
FOR EACH ROW EXECUTE FUNCTION public.tg_set_prompt_depth();

-- Backfill depth/root for existing rows (root prompts first, then forks)
DO $$
DECLARE
  r record;
BEGIN
  -- Roots first
  FOR r IN SELECT id FROM public.prompts WHERE parent_prompt_id IS NULL LOOP
    UPDATE public.prompts
    SET depth = 0, root_prompt_id = id
    WHERE id = r.id;
  END LOOP;
  -- Forks (depth 1) - simple one-level backfill for MVP
  FOR r IN
    SELECT p.id, parent.depth AS parent_depth, COALESCE(parent.root_prompt_id, parent.id) AS root_id
    FROM public.prompts p
    JOIN public.prompts parent ON parent.id = p.parent_prompt_id
    WHERE p.parent_prompt_id IS NOT NULL
  LOOP
    UPDATE public.prompts
    SET depth = r.parent_depth + 1, root_prompt_id = r.root_id
    WHERE id = r.id;
  END LOOP;
END;
$$;

-- =============================================================================
-- 4. Create prompt_comparisons table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.prompt_comparisons (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id       uuid        NOT NULL REFERENCES public.problems(id)    ON DELETE CASCADE,
  prompt_a_id      uuid        NOT NULL REFERENCES public.prompts(id)     ON DELETE CASCADE,
  prompt_b_id      uuid        NOT NULL REFERENCES public.prompts(id)     ON DELETE CASCADE,
  -- NULL = tie / skip; valid = one of the two prompt ids
  winner_prompt_id uuid        REFERENCES public.prompts(id),
  voter_id         uuid        NOT NULL REFERENCES auth.users(id)         ON DELETE CASCADE,
  -- Canonical pair ordering: prevents (A,B) and (B,A) being treated as different pairs
  prompt_low_id    uuid        GENERATED ALWAYS AS (LEAST(prompt_a_id, prompt_b_id))    STORED,
  prompt_high_id   uuid        GENERATED ALWAYS AS (GREATEST(prompt_a_id, prompt_b_id)) STORED,
  created_at       timestamptz NOT NULL DEFAULT now(),
  -- Derived from created_at for consistency on backfills/tests
  review_day       date        GENERATED ALWAYS AS ((created_at AT TIME ZONE 'UTC')::date) STORED,
  is_blind         boolean     NOT NULL DEFAULT true,
  CONSTRAINT different_prompts CHECK (prompt_a_id != prompt_b_id),
  CONSTRAINT valid_winner CHECK (
    winner_prompt_id IS NULL
    OR winner_prompt_id IN (prompt_a_id, prompt_b_id)
  ),
  -- One result per voter per canonical pair per day
  UNIQUE (voter_id, prompt_low_id, prompt_high_id, review_day)
);

CREATE INDEX IF NOT EXISTS idx_comparisons_problem   ON public.prompt_comparisons(problem_id);
CREATE INDEX IF NOT EXISTS idx_comparisons_prompt_a  ON public.prompt_comparisons(prompt_a_id);
CREATE INDEX IF NOT EXISTS idx_comparisons_prompt_b  ON public.prompt_comparisons(prompt_b_id);
CREATE INDEX IF NOT EXISTS idx_comparisons_voter     ON public.prompt_comparisons(voter_id);
CREATE INDEX IF NOT EXISTS idx_comparisons_pair      ON public.prompt_comparisons(prompt_low_id, prompt_high_id);

-- =============================================================================
-- 5. RLS for prompt_comparisons
-- =============================================================================

ALTER TABLE public.prompt_comparisons ENABLE ROW LEVEL SECURITY;

-- SELECT: piggybacks on existing prompts RLS — viewer can only see comparisons
-- for prompts they can already access. Private/unlisted prompts stay hidden.
CREATE POLICY "comparisons_select" ON public.prompt_comparisons
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.prompts WHERE id = prompt_a_id)
    AND EXISTS (SELECT 1 FROM public.prompts WHERE id = prompt_b_id)
  );

-- INSERT: authenticated, no self-votes, both prompts public + in declared problem
CREATE POLICY "comparisons_insert" ON public.prompt_comparisons
  FOR INSERT WITH CHECK (
    auth.uid() = voter_id
    -- Both prompts must be visible and in the declared problem
    AND EXISTS (
      SELECT 1 FROM public.prompts
      WHERE id = prompt_a_id
        AND problem_id = prompt_comparisons.problem_id
        AND is_listed  = true
        AND is_hidden  = false
        AND is_deleted = false
    )
    AND EXISTS (
      SELECT 1 FROM public.prompts
      WHERE id = prompt_b_id
        AND problem_id = prompt_comparisons.problem_id
        AND is_listed  = true
        AND is_hidden  = false
        AND is_deleted = false
    )
    -- No voting on your own prompts
    AND auth.uid() != (SELECT created_by FROM public.prompts WHERE id = prompt_a_id)
    AND auth.uid() != (SELECT created_by FROM public.prompts WHERE id = prompt_b_id)
  );

-- =============================================================================
-- 6. Stats maintenance trigger
-- =============================================================================

-- Recalculates all comparison stats for a single prompt
CREATE OR REPLACE FUNCTION public.recalculate_comparison_stats(p_prompt_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count  int;
  v_wins   int;
  v_losses int;
  v_rate   numeric;
  v_last   timestamptz;
BEGIN
  SELECT
    COUNT(*)::int,
    -- Wins: this prompt was the explicit winner
    COUNT(*) FILTER (WHERE winner_prompt_id = p_prompt_id)::int,
    -- Losses: there was a winner and it was NOT this prompt
    COUNT(*) FILTER (
      WHERE winner_prompt_id IS NOT NULL
        AND winner_prompt_id != p_prompt_id
    )::int,
    MAX(created_at)
  INTO v_count, v_wins, v_losses, v_last
  FROM public.prompt_comparisons
  WHERE prompt_a_id = p_prompt_id OR prompt_b_id = p_prompt_id;

  -- win_rate denominator = wins + losses only (ties excluded from denominator)
  v_rate := v_wins::numeric / NULLIF(v_wins + v_losses, 0);

  INSERT INTO public.prompt_stats (
    prompt_id, comparisons_count, comparison_wins, comparison_losses,
    win_rate, last_compared_at, updated_at
  )
  VALUES (
    p_prompt_id, COALESCE(v_count,0), COALESCE(v_wins,0), COALESCE(v_losses,0),
    COALESCE(v_rate, 0), v_last, now()
  )
  ON CONFLICT (prompt_id) DO UPDATE SET
    comparisons_count = EXCLUDED.comparisons_count,
    comparison_wins   = EXCLUDED.comparison_wins,
    comparison_losses = EXCLUDED.comparison_losses,
    win_rate          = EXCLUDED.win_rate,
    last_compared_at  = EXCLUDED.last_compared_at,
    updated_at        = now();
END;
$$;

-- Trigger function called after each comparison insert
CREATE OR REPLACE FUNCTION public.tg_on_comparison_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update stats for both prompts in the comparison
  PERFORM public.recalculate_comparison_stats(NEW.prompt_a_id);
  PERFORM public.recalculate_comparison_stats(NEW.prompt_b_id);

  -- Increment total comparisons cast by this voter
  UPDATE public.profiles
  SET comparisons_cast = comparisons_cast + 1
  WHERE id = NEW.voter_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_comparison_insert ON public.prompt_comparisons;
CREATE TRIGGER on_comparison_insert
AFTER INSERT ON public.prompt_comparisons
FOR EACH ROW EXECUTE FUNCTION public.tg_on_comparison_insert();

-- =============================================================================
-- 7. RPC: get_next_battle(p_problem_id)
-- Returns blind-safe JSON for two battle candidates.
-- Uses auth.uid() internally — no caller-supplied user_id.
-- Uses LEFT JOIN so brand-new prompts with no stats row are still eligible.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_next_battle(p_problem_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid     uuid := auth.uid();
  v_a_id    uuid;
  v_b_id    uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Pick prompt A: fewest comparisons (incl. zero = no stats row), random tie-break
  -- Excludes user's own prompts only — pair uniqueness enforced by constraint
  SELECT p.id INTO v_a_id
  FROM public.prompts p
  LEFT JOIN public.prompt_stats ps ON ps.prompt_id = p.id
  WHERE p.problem_id = p_problem_id
    AND p.is_listed  = true
    AND p.is_hidden  = false
    AND p.is_deleted = false
    AND p.created_by != v_uid
  ORDER BY COALESCE(ps.comparisons_count, 0) ASC, random()
  LIMIT 1;

  IF v_a_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Pick prompt B: different from A, same ordering
  SELECT p.id INTO v_b_id
  FROM public.prompts p
  LEFT JOIN public.prompt_stats ps ON ps.prompt_id = p.id
  WHERE p.problem_id = p_problem_id
    AND p.is_listed  = true
    AND p.is_hidden  = false
    AND p.is_deleted = false
    AND p.created_by != v_uid
    AND p.id != v_a_id
  ORDER BY COALESCE(ps.comparisons_count, 0) ASC, random()
  LIMIT 1;

  IF v_b_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Return only blind-safe fields — no title, author, score, or vote stats
  RETURN json_build_object(
    'prompt_a', (
      SELECT json_build_object(
        'id',                   p.id,
        'system_prompt',        p.system_prompt,
        'user_prompt_template', p.user_prompt_template,
        'example_input',        p.example_input,
        'example_output',       p.example_output,
        'model',                p.model
      )
      FROM public.prompts p WHERE p.id = v_a_id
    ),
    'prompt_b', (
      SELECT json_build_object(
        'id',                   p.id,
        'system_prompt',        p.system_prompt,
        'user_prompt_template', p.user_prompt_template,
        'example_input',        p.example_input,
        'example_output',       p.example_output,
        'model',                p.model
      )
      FROM public.prompts p WHERE p.id = v_b_id
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_next_battle(uuid) TO authenticated;

-- =============================================================================
-- 8. RPC: get_ranked_prompts(p_problem_id)
-- Returns prompts ordered by volume-damped rank_score.
-- LEFT JOIN so prompts with no stats row are included (score = 0).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_ranked_prompts(p_problem_id uuid)
RETURNS TABLE (
  id                  uuid,
  title               text,
  slug                text,
  model               text,
  status              text,
  system_prompt       text,
  user_prompt_template text,
  notes               text,
  parent_prompt_id    uuid,
  root_prompt_id      uuid,
  depth               int,
  created_by          uuid,
  created_at          timestamptz,
  updated_at          timestamptz,
  -- Stats
  upvotes             int,
  downvotes           int,
  score               int,
  fork_count          int,
  copy_count          int,
  view_count          int,
  works_count         int,
  fails_count         int,
  reviews_count       int,
  comparisons_count   int,
  comparison_wins     int,
  comparison_losses   int,
  win_rate            numeric,
  last_compared_at    timestamptz,
  -- Computed
  rank_score          numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.title,
    p.slug,
    p.model,
    p.status,
    p.system_prompt,
    p.user_prompt_template,
    p.notes,
    p.parent_prompt_id,
    p.root_prompt_id,
    p.depth,
    p.created_by,
    p.created_at,
    p.updated_at,
    -- Stats (default to 0 when no stats row yet)
    COALESCE(ps.upvotes,           0)::int,
    COALESCE(ps.downvotes,         0)::int,
    COALESCE(ps.score,             0)::int,
    COALESCE(ps.fork_count,        0)::int,
    COALESCE(ps.copy_count,        0)::int,
    COALESCE(ps.view_count,        0)::int,
    COALESCE(ps.works_count,       0)::int,
    COALESCE(ps.fails_count,       0)::int,
    COALESCE(ps.reviews_count,     0)::int,
    COALESCE(ps.comparisons_count, 0)::int,
    COALESCE(ps.comparison_wins,   0)::int,
    COALESCE(ps.comparison_losses, 0)::int,
    COALESCE(ps.win_rate,          0)::numeric,
    ps.last_compared_at,
    -- Volume-damped rank_score:
    -- win_rate is multiplied by confidence factor so 1-battle wonders don't dominate
    (
      COALESCE(ps.win_rate, 0) * LEAST(COALESCE(ps.comparisons_count, 0) / 10.0, 1.0) * 0.55
      + LEAST(COALESCE(ps.comparisons_count, 0) / 100.0, 1.0) * 0.20
      + LEAST(COALESCE(ps.fork_count, 0)        / 20.0,  1.0) * 0.15
      + LEAST((COALESCE(ps.upvotes, 0) - COALESCE(ps.downvotes, 0) + 10) / 50.0, 1.0) * 0.05
      + CASE WHEN ps.last_compared_at > now() - interval '7 days' THEN 0.05 ELSE 0 END
    )::numeric AS rank_score
  FROM public.prompts p
  LEFT JOIN public.prompt_stats ps ON ps.prompt_id = p.id
  WHERE p.problem_id = p_problem_id
    AND p.is_listed  = true
    AND p.is_hidden  = false
    AND p.is_deleted = false
  ORDER BY rank_score DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_ranked_prompts(uuid) TO anon, authenticated;

-- =============================================================================
-- Verification
-- =============================================================================

DO $$
BEGIN
  -- Check prompt_comparisons exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'prompt_comparisons'
  ) THEN
    RAISE EXCEPTION 'prompt_comparisons table was not created!';
  END IF;

  -- Check new prompt_stats columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'prompt_stats'
      AND column_name  = 'comparisons_count'
  ) THEN
    RAISE EXCEPTION 'prompt_stats.comparisons_count column missing!';
  END IF;

  RAISE NOTICE 'battle_mode migration verified OK';
END;
$$;

COMMIT;

-- 20260110193000_problem_stats_rollup.sql

BEGIN;

-- 1) Create problem_stats
CREATE TABLE IF NOT EXISTS public.problem_stats (
  problem_id uuid PRIMARY KEY REFERENCES public.problems(id) ON DELETE CASCADE,
  total_prompts int4 NOT NULL DEFAULT 0,
  total_works int4 NOT NULL DEFAULT 0,
  total_fails int4 NOT NULL DEFAULT 0,
  total_reviews int4 NOT NULL DEFAULT 0,
  last_activity_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Recalculate function
CREATE OR REPLACE FUNCTION public.recalculate_problem_stats(problem_uuid uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_prompts int4;
  v_total_works int4;
  v_total_fails int4;
  v_total_reviews int4;
  v_last timestamptz;
BEGIN
  -- Prompt count
  SELECT COUNT(*)::int4
  INTO v_total_prompts
  FROM public.prompts p
  WHERE p.problem_id = problem_uuid
    AND COALESCE(p.is_deleted, false) = false;

  -- Review aggregations across prompts in this problem
  SELECT
    COUNT(*) FILTER (WHERE r.review_type = 'worked')::int4,
    COUNT(*) FILTER (WHERE r.review_type = 'failed')::int4,
    COUNT(*)::int4,
    MAX(r.created_at)
  INTO v_total_works, v_total_fails, v_total_reviews, v_last
  FROM public.prompt_reviews r
  JOIN public.prompts p ON p.id = r.prompt_id
  WHERE p.problem_id = problem_uuid
    AND COALESCE(p.is_deleted, false) = false;

  INSERT INTO public.problem_stats (problem_id, total_prompts, total_works, total_fails, total_reviews, last_activity_at, updated_at)
  VALUES (problem_uuid, COALESCE(v_total_prompts,0), COALESCE(v_total_works,0), COALESCE(v_total_fails,0), COALESCE(v_total_reviews,0), v_last, now())
  ON CONFLICT (problem_id)
  DO UPDATE SET
    total_prompts = EXCLUDED.total_prompts,
    total_works = EXCLUDED.total_works,
    total_fails = EXCLUDED.total_fails,
    total_reviews = EXCLUDED.total_reviews,
    last_activity_at = EXCLUDED.last_activity_at,
    updated_at = now();
END;
$$;

-- 3) Trigger functions

-- When prompts change (new prompt, deleted prompt, moved problem_id)
CREATE OR REPLACE FUNCTION public.tg_recalculate_problem_stats_from_prompts()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    PERFORM public.recalculate_problem_stats(OLD.problem_id);
    RETURN OLD;
  ELSE
    PERFORM public.recalculate_problem_stats(NEW.problem_id);

    IF (TG_OP = 'UPDATE' AND NEW.problem_id IS DISTINCT FROM OLD.problem_id) THEN
      PERFORM public.recalculate_problem_stats(OLD.problem_id);
    END IF;

    RETURN NEW;
  END IF;
END;
$$;

-- When prompt_reviews change, recalc the related problem via prompts table
CREATE OR REPLACE FUNCTION public.tg_recalculate_problem_stats_from_reviews()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_problem_id uuid;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    SELECT problem_id INTO v_problem_id FROM public.prompts WHERE id = OLD.prompt_id;
  ELSE
    SELECT problem_id INTO v_problem_id FROM public.prompts WHERE id = NEW.prompt_id;
  END IF;

  IF v_problem_id IS NOT NULL THEN
    PERFORM public.recalculate_problem_stats(v_problem_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 4) Create triggers

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_prompt_change_problem_stats') THEN
    CREATE TRIGGER on_prompt_change_problem_stats
    AFTER INSERT OR UPDATE OR DELETE ON public.prompts
    FOR EACH ROW
    EXECUTE FUNCTION public.tg_recalculate_problem_stats_from_prompts();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_review_change_problem_stats') THEN
    CREATE TRIGGER on_review_change_problem_stats
    AFTER INSERT OR UPDATE OR DELETE ON public.prompt_reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.tg_recalculate_problem_stats_from_reviews();
  END IF;
END$$;

-- 5) Backfill: recalc for all problems that have prompts or reviews
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT DISTINCT p.problem_id
    FROM public.prompts p
    WHERE p.problem_id IS NOT NULL
  LOOP
    PERFORM public.recalculate_problem_stats(r.problem_id);
  END LOOP;
END$$;

COMMIT;

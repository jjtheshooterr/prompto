-- 20260110192000_prompt_stats_from_reviews.sql

BEGIN;

-- 1) Add evidence fields to prompt_stats
ALTER TABLE public.prompt_stats
  ADD COLUMN IF NOT EXISTS works_count int4 NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fails_count int4 NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reviews_count int4 NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_reviewed_at timestamptz;

-- 2) Create function to recalculate review stats for one prompt
CREATE OR REPLACE FUNCTION public.recalculate_review_stats(prompt_uuid uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_works int4;
  v_fails int4;
  v_reviews int4;
  v_last timestamptz;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE review_type = 'worked')::int4,
    COUNT(*) FILTER (WHERE review_type = 'failed')::int4,
    COUNT(*)::int4,
    MAX(created_at)
  INTO v_works, v_fails, v_reviews, v_last
  FROM public.prompt_reviews
  WHERE prompt_id = prompt_uuid;

  INSERT INTO public.prompt_stats (prompt_id, works_count, fails_count, reviews_count, last_reviewed_at, updated_at)
  VALUES (prompt_uuid, COALESCE(v_works,0), COALESCE(v_fails,0), COALESCE(v_reviews,0), v_last, now())
  ON CONFLICT (prompt_id)
  DO UPDATE SET
    works_count = EXCLUDED.works_count,
    fails_count = EXCLUDED.fails_count,
    reviews_count = EXCLUDED.reviews_count,
    last_reviewed_at = EXCLUDED.last_reviewed_at,
    updated_at = now();
END;
$$;

-- 3) Trigger function to call recalc on insert/update/delete
CREATE OR REPLACE FUNCTION public.tg_recalculate_review_stats()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    PERFORM public.recalculate_review_stats(OLD.prompt_id);
    RETURN OLD;
  ELSE
    -- INSERT or UPDATE
    PERFORM public.recalculate_review_stats(NEW.prompt_id);

    -- If prompt_id changed on UPDATE, recalc the old prompt_id too
    IF (TG_OP = 'UPDATE' AND NEW.prompt_id IS DISTINCT FROM OLD.prompt_id) THEN
      PERFORM public.recalculate_review_stats(OLD.prompt_id);
    END IF;

    RETURN NEW;
  END IF;
END;
$$;

-- 4) Create trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_prompt_review_change'
  ) THEN
    CREATE TRIGGER on_prompt_review_change
    AFTER INSERT OR UPDATE OR DELETE ON public.prompt_reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.tg_recalculate_review_stats();
  END IF;
END$$;

-- 5) Backfill review stats for all prompts that have reviews
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT DISTINCT prompt_id FROM public.prompt_reviews
  LOOP
    PERFORM public.recalculate_review_stats(r.prompt_id);
  END LOOP;
END$$;

COMMIT;

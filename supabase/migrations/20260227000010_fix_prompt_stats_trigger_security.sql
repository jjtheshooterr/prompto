-- Fix prompt_stats trigger to run with elevated privileges
-- This allows the trigger to bypass RLS when updating prompt_stats from reviews

BEGIN;

-- Recreate the recalculate_review_stats function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.recalculate_review_stats(prompt_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Recreate the trigger function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.tg_recalculate_review_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

COMMIT;

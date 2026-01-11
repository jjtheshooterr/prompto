-- Fix: Use UPSERT instead of UPDATE in case prompt_stats row doesn't exist yet

CREATE OR REPLACE FUNCTION recalculate_prompt_stats_on_review()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_prompt_id uuid := COALESCE(NEW.prompt_id, OLD.prompt_id);
BEGIN
    -- UPSERT: Create or update stats for the affected prompt
    INSERT INTO prompt_stats (
        prompt_id,
        works_count,
        fails_count,
        reviews_count,
        last_reviewed_at,
        updated_at
    )
    SELECT
        v_prompt_id,
        COUNT(*) FILTER (WHERE review_type = 'worked'),
        COUNT(*) FILTER (WHERE review_type = 'failed'),
        COUNT(*),
        MAX(created_at),
        now()
    FROM prompt_reviews
    WHERE prompt_id = v_prompt_id
    ON CONFLICT (prompt_id) DO UPDATE SET
        works_count = EXCLUDED.works_count,
        fails_count = EXCLUDED.fails_count,
        reviews_count = EXCLUDED.reviews_count,
        last_reviewed_at = EXCLUDED.last_reviewed_at,
        updated_at = now();

    RETURN COALESCE(NEW, OLD);
END;
$$;

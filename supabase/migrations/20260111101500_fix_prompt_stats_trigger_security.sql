-- Fix RLS issue: Trigger functions need SECURITY DEFINER to bypass RLS
-- This allows the trigger to update prompt_stats even though users can't directly modify it

-- Drop and recreate with SECURITY DEFINER
CREATE OR REPLACE FUNCTION recalculate_prompt_stats_on_review()
RETURNS TRIGGER
SECURITY DEFINER -- Run with function owner's permissions, not caller's
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Update stats for the affected prompt
    UPDATE prompt_stats
    SET
        works_count = (
            SELECT COUNT(*)
            FROM prompt_reviews
            WHERE prompt_id = COALESCE(NEW.prompt_id, OLD.prompt_id)
            AND review_type = 'worked'
        ),
        fails_count = (
            SELECT COUNT(*)
            FROM prompt_reviews
            WHERE prompt_id = COALESCE(NEW.prompt_id, OLD.prompt_id)
            AND review_type = 'failed'
        ),
        reviews_count = (
            SELECT COUNT(*)
            FROM prompt_reviews
            WHERE prompt_id = COALESCE(NEW.prompt_id, OLD.prompt_id)
        ),
        last_reviewed_at = (
            SELECT MAX(created_at)
            FROM prompt_reviews
            WHERE prompt_id = COALESCE(NEW.prompt_id, OLD.prompt_id)
        ),
        updated_at = now()
    WHERE prompt_id = COALESCE(NEW.prompt_id, OLD.prompt_id);

    RETURN COALESCE(NEW, OLD);
END;
$$;

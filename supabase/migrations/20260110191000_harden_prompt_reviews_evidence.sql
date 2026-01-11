-- 20260110191000_harden_prompt_reviews_evidence.sql

BEGIN;

-- 1) Create enum type if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prompt_review_type') THEN
    CREATE TYPE prompt_review_type AS ENUM ('worked', 'failed', 'note');
  END IF;
END$$;

-- 2) Add columns to prompt_reviews
ALTER TABLE public.prompt_reviews
  ADD COLUMN IF NOT EXISTS review_type prompt_review_type,
  ADD COLUMN IF NOT EXISTS worked_reason text,
  ADD COLUMN IF NOT EXISTS failure_reason text,
  ADD COLUMN IF NOT EXISTS sample_input jsonb,
  ADD COLUMN IF NOT EXISTS sample_output jsonb,
  ADD COLUMN IF NOT EXISTS model_used text;

-- 3) Ensure created_at exists (if your table already has it, this is no-op)
ALTER TABLE public.prompt_reviews
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- 4) Add generated review_day for rate limiting (one per day)
-- If your Postgres version doesn't support generated stored columns, use a normal column + trigger.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema='public'
      AND table_name='prompt_reviews'
      AND column_name='review_day'
  ) THEN
    ALTER TABLE public.prompt_reviews
      ADD COLUMN review_day date GENERATED ALWAYS AS ((created_at AT TIME ZONE 'UTC')::date) STORED;
  END IF;
END$$;

-- 5) Backfill review_type for existing rows
-- Assume existing rows are "note" unless they used criteria fields (optional logic)
UPDATE public.prompt_reviews
SET review_type = COALESCE(review_type, 'note'::prompt_review_type)
WHERE review_type IS NULL;

-- 6) Enforce requirements based on review_type
-- Worked must have worked_reason
-- Failed must have failure_reason
-- Note can have comment only
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'prompt_reviews_reason_check'
  ) THEN
    ALTER TABLE public.prompt_reviews
      ADD CONSTRAINT prompt_reviews_reason_check
      CHECK (
        (review_type = 'worked' AND worked_reason IS NOT NULL AND length(trim(worked_reason)) > 0)
        OR
        (review_type = 'failed' AND failure_reason IS NOT NULL AND length(trim(failure_reason)) > 0)
        OR
        (review_type = 'note')
      );
  END IF;
END$$;

-- 7) Anti-spam: 1 review per user per prompt per day per type
-- This still allows: worked + failed same day if they truly changed opinion.
-- If you want stricter: remove review_type from the unique index.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname='public'
      AND indexname='uniq_prompt_reviews_prompt_user_day_type'
  ) THEN
    CREATE UNIQUE INDEX uniq_prompt_reviews_prompt_user_day_type
      ON public.prompt_reviews (prompt_id, user_id, review_day, review_type);
  END IF;
END$$;

COMMIT;

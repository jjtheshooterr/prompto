-- 20260112133000_drop_tags_column.sql

BEGIN;

ALTER TABLE public.problems DROP COLUMN IF EXISTS tags;

COMMIT;

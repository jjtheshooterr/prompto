-- Final Touch-ups
-- 1. Restore tag indexes for reverse lookups (essential for tag pages)
--    These were accidentally dropped as duplicates, but we need indexes on tag_id specifically
CREATE INDEX IF NOT EXISTS idx_problem_tags_tag_id_lookup ON public.problem_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_prompt_tags_tag_id_lookup ON public.prompt_tags(tag_id);

-- 2. Tighten prompt_events schema
--    Events should always track WHO did WHAT to WHICH prompt
ALTER TABLE public.prompt_events 
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN prompt_id SET NOT NULL;

-- 3. Add explicit comments on these columns
COMMENT ON COLUMN public.prompt_events.user_id IS 'The user who triggered the event (must be authenticated)';
COMMENT ON COLUMN public.prompt_events.prompt_id IS 'The prompt this event relates to';

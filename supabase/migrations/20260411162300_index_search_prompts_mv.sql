-- 1. Unique index on id to allow REFESH MATERIALIZED VIEW CONCURRENTLY
CREATE UNIQUE INDEX IF NOT EXISTS search_prompts_mv_id_idx 
ON public.search_prompts_mv USING btree (id);

-- 2. Trigram GIN index for partial text matching
CREATE INDEX IF NOT EXISTS search_prompts_mv_trgm_idx 
ON public.search_prompts_mv USING gin (search_text gin_trgm_ops);

-- 3. Full-Text Search GIN index for the tsvector
CREATE INDEX IF NOT EXISTS search_prompts_mv_fts_idx 
ON public.search_prompts_mv USING gin (search_tsv);

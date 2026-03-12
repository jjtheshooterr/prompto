-- Create prompt_comparisons table if it doesn't exist
-- This is a standalone migration to ensure the table exists

CREATE TABLE IF NOT EXISTS public.prompt_comparisons (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id       uuid        NOT NULL REFERENCES public.problems(id)    ON DELETE CASCADE,
  prompt_a_id      uuid        NOT NULL REFERENCES public.prompts(id)     ON DELETE CASCADE,
  prompt_b_id      uuid        NOT NULL REFERENCES public.prompts(id)     ON DELETE CASCADE,
  winner_prompt_id uuid        REFERENCES public.prompts(id),
  voter_id         uuid        NOT NULL REFERENCES auth.users(id)         ON DELETE CASCADE,
  prompt_low_id    uuid        GENERATED ALWAYS AS (LEAST(prompt_a_id, prompt_b_id))    STORED,
  prompt_high_id   uuid        GENERATED ALWAYS AS (GREATEST(prompt_a_id, prompt_b_id)) STORED,
  created_at       timestamptz NOT NULL DEFAULT now(),
  review_day       date        GENERATED ALWAYS AS ((created_at AT TIME ZONE 'UTC')::date) STORED,
  is_blind         boolean     NOT NULL DEFAULT true,
  CONSTRAINT different_prompts CHECK (prompt_a_id != prompt_b_id),
  CONSTRAINT valid_winner CHECK (
    winner_prompt_id IS NULL
    OR winner_prompt_id IN (prompt_a_id, prompt_b_id)
  ),
  UNIQUE (voter_id, prompt_low_id, prompt_high_id, review_day)
);

CREATE INDEX IF NOT EXISTS idx_comparisons_problem   ON public.prompt_comparisons(problem_id);
CREATE INDEX IF NOT EXISTS idx_comparisons_prompt_a  ON public.prompt_comparisons(prompt_a_id);
CREATE INDEX IF NOT EXISTS idx_comparisons_prompt_b  ON public.prompt_comparisons(prompt_b_id);
CREATE INDEX IF NOT EXISTS idx_comparisons_voter     ON public.prompt_comparisons(voter_id);
CREATE INDEX IF NOT EXISTS idx_comparisons_pair      ON public.prompt_comparisons(prompt_low_id, prompt_high_id);

-- Enable RLS
ALTER TABLE public.prompt_comparisons ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "comparisons_select" ON public.prompt_comparisons;
DROP POLICY IF EXISTS "comparisons_insert" ON public.prompt_comparisons;

-- SELECT policy
CREATE POLICY "comparisons_select" ON public.prompt_comparisons
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.prompts WHERE id = prompt_a_id)
    AND EXISTS (SELECT 1 FROM public.prompts WHERE id = prompt_b_id)
  );

-- INSERT policy
CREATE POLICY "comparisons_insert" ON public.prompt_comparisons
  FOR INSERT WITH CHECK (
    auth.uid() = voter_id
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
    AND auth.uid() != (SELECT created_by FROM public.prompts WHERE id = prompt_a_id)
    AND auth.uid() != (SELECT created_by FROM public.prompts WHERE id = prompt_b_id)
  );

-- Fix 2: Block self-reviews on prompt_reviews
DROP POLICY IF EXISTS "prompt_reviews_insert" ON public.prompt_reviews;

CREATE POLICY "prompt_reviews_insert" ON public.prompt_reviews
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  user_id = auth.uid() AND 
  EXISTS (
    SELECT 1 FROM public.prompts 
    WHERE id = prompt_reviews.prompt_id 
    AND created_by != auth.uid()
  )
);

-- Fix 3: Add updated_at auto-triggers on all main tables
DO $$ 
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['prompts', 'problems', 'profiles', 'prompt_reviews', 'prompt_comparisons', 'user_bans'])
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS update_%I_updated_at ON public.%I;
      CREATE TRIGGER update_%I_updated_at
        BEFORE UPDATE ON public.%I
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    ', t, t, t, t);
  END LOOP;
END;
$$;

-- Fix 4: Extend user_rate_limits coverage
ALTER TABLE public.user_rate_limits DROP CONSTRAINT IF EXISTS user_rate_limits_action_check;
ALTER TABLE public.user_rate_limits ADD CONSTRAINT user_rate_limits_action_check CHECK (
  action = ANY (ARRAY[
    'create_prompt'::text, 
    'edit_prompt'::text,
    'submit_review'::text,
    'cast_vote'::text,
    'submit_report'::text,
    'create_problem'::text,
    'create_workspace'::text
  ])
);

-- Fix 5: Apply validate_content_safety consistently
ALTER TABLE public.prompts DROP CONSTRAINT IF EXISTS prompts_title_safety;
ALTER TABLE public.prompts DROP CONSTRAINT IF EXISTS prompts_system_prompt_safety;
ALTER TABLE public.prompts DROP CONSTRAINT IF EXISTS prompts_user_prompt_template_safety;

ALTER TABLE public.prompts
  ADD CONSTRAINT prompts_title_safety CHECK (title IS NULL OR validate_content_safety(title)),
  ADD CONSTRAINT prompts_system_prompt_safety CHECK (system_prompt IS NULL OR validate_content_safety(system_prompt)),
  ADD CONSTRAINT prompts_user_prompt_template_safety CHECK (user_prompt_template IS NULL OR validate_content_safety(user_prompt_template));

ALTER TABLE public.problems DROP CONSTRAINT IF EXISTS problems_title_safety;
ALTER TABLE public.problems DROP CONSTRAINT IF EXISTS problems_description_safety;

ALTER TABLE public.problems
  ADD CONSTRAINT problems_title_safety CHECK (title IS NULL OR validate_content_safety(title)),
  ADD CONSTRAINT problems_description_safety CHECK (description IS NULL OR validate_content_safety(description));

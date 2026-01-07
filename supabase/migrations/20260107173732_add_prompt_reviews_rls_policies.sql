-- Enable RLS on prompt_reviews
ALTER TABLE prompt_reviews ENABLE ROW LEVEL SECURITY;

-- RLS policies for prompt_reviews
DROP POLICY IF EXISTS "prompt_reviews_select" ON prompt_reviews;
CREATE POLICY "prompt_reviews_select" ON prompt_reviews FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM prompts pr
    WHERE pr.id = prompt_reviews.prompt_id
      AND COALESCE(pr.is_deleted, FALSE) = FALSE
      AND public.can_view_problem(pr.problem_id, auth.uid())
  )
);

DROP POLICY IF EXISTS "prompt_reviews_insert" ON prompt_reviews;
CREATE POLICY "prompt_reviews_insert" ON prompt_reviews FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM prompts pr
    WHERE pr.id = prompt_reviews.prompt_id
      AND COALESCE(pr.is_deleted, FALSE) = FALSE
      AND public.can_contribute_problem(pr.problem_id, auth.uid())
  )
);

DROP POLICY IF EXISTS "prompt_reviews_update" ON prompt_reviews;
CREATE POLICY "prompt_reviews_update" ON prompt_reviews FOR UPDATE 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "prompt_reviews_delete" ON prompt_reviews;
CREATE POLICY "prompt_reviews_delete" ON prompt_reviews FOR DELETE 
USING (user_id = auth.uid());;

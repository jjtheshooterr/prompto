-- Remove the conflicting prompts_select_policy
DROP POLICY IF EXISTS "prompts_select_policy" ON prompts;

-- Ensure the correct policy exists and is properly named
DROP POLICY IF EXISTS "Anyone can view non-deleted public prompts" ON prompts;

-- Create a single, clear RLS policy for prompts
CREATE POLICY "prompts_public_select_policy" ON prompts
  FOR SELECT
  USING (
    (is_deleted = false OR is_deleted IS NULL) AND (
      -- Public prompts that are listed and not hidden
      (visibility = 'public' AND is_listed = true AND (is_hidden = false OR is_hidden IS NULL))
      OR
      -- Unlisted prompts that are not hidden (accessible via direct link)
      (visibility = 'unlisted' AND (is_hidden = false OR is_hidden IS NULL))
      OR
      -- Private prompts for workspace members
      (visibility = 'private' AND is_workspace_member(workspace_id, auth.uid()) AND (is_hidden = false OR is_hidden IS NULL))
      OR
      -- User's own prompts (regardless of visibility)
      (created_by = auth.uid())
    )
  );;

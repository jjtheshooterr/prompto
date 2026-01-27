-- =====================================================
-- WEEK 1 PRIORITY #1: Report Deduplication
-- =====================================================
-- Prevents users from spamming multiple reports for the same content
-- Stops report count inflation and reduces moderator noise
-- Apply this migration in Week 1 after launch

-- =====================================================
-- STEP 0: De-dupe existing spam safely (if any)
-- =====================================================
-- Keep the earliest report per (content_type, content_id, reporter_id)
-- This runs BEFORE adding the unique constraint

DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH ranked AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY content_type, content_id, reporter_id
        ORDER BY created_at ASC
      ) AS rn
    FROM public.reports
  )
  DELETE FROM public.reports r
  USING ranked
  WHERE r.id = ranked.id
    AND ranked.rn > 1;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % duplicate reports', deleted_count;
END $$;

-- =====================================================
-- STEP 1: Add partial UNIQUE index (RECOMMENDED)
-- =====================================================
-- Allows re-reporting after dismissal
-- Prevents spam during moderation window
-- Preserves audit history
-- Zero runtime overhead after index build

CREATE UNIQUE INDEX IF NOT EXISTS reports_active_unique 
  ON reports (content_type, content_id, reporter_id)
  WHERE status IN ('pending', 'reviewed');

COMMENT ON INDEX reports_active_unique IS 
  'Prevents duplicate active reports from same user. Allows re-reporting after dismissal.';

-- =====================================================
-- STEP 2: Recalculate report_count (one-time rebuild)
-- =====================================================
-- Since spam could have inflated counts, rebuild from scratch

-- Rebuild prompts.report_count
UPDATE public.prompts p
SET 
  report_count = COALESCE(x.cnt, 0),
  is_reported = (COALESCE(x.cnt, 0) > 0)
FROM (
  SELECT content_id, COUNT(*)::int AS cnt
  FROM public.reports
  WHERE content_type = 'prompt'
    AND status = 'pending'  -- Change to remove this filter for lifetime counts
  GROUP BY content_id
) x
WHERE p.id = x.content_id;

-- Set zeroes for prompts with no reports
UPDATE public.prompts
SET 
  report_count = 0,
  is_reported = false
WHERE id NOT IN (
  SELECT content_id
  FROM public.reports
  WHERE content_type = 'prompt'
    AND status = 'pending'
);

-- Rebuild problems.report_count
UPDATE public.problems pr
SET 
  report_count = COALESCE(x.cnt, 0),
  is_reported = (COALESCE(x.cnt, 0) > 0)
FROM (
  SELECT content_id, COUNT(*)::int AS cnt
  FROM public.reports
  WHERE content_type = 'problem'
    AND status = 'pending'
  GROUP BY content_id
) x
WHERE pr.id = x.content_id;

-- Set zeroes for problems with no reports
UPDATE public.problems
SET 
  report_count = 0,
  is_reported = false
WHERE id NOT IN (
  SELECT content_id
  FROM public.reports
  WHERE content_type = 'problem'
    AND status = 'pending'
);

-- =====================================================
-- STEP 3: Helper function for UI state
-- =====================================================
-- Check if user has already reported this content
-- Use in UI to show "Already Reported" state

CREATE OR REPLACE FUNCTION has_active_report(
  p_content_type TEXT,
  p_content_id UUID,
  p_reporter_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM reports
    WHERE content_type = p_content_type
      AND content_id = p_content_id
      AND reporter_id = COALESCE(p_reporter_id, auth.uid())
      AND status IN ('pending', 'reviewed')
  );
$$;

GRANT EXECUTE ON FUNCTION has_active_report TO authenticated, anon;

COMMENT ON FUNCTION has_active_report IS 
  'Check if user has already submitted an active report for this content. Used for UI state.';

-- =====================================================
-- VERIFICATION QUERIES (run after migration)
-- =====================================================

-- Check for any remaining duplicates (should return 0)
/*
SELECT 
  content_type, 
  content_id, 
  reporter_id, 
  COUNT(*) as duplicate_count
FROM reports
WHERE status IN ('pending', 'reviewed')
GROUP BY content_type, content_id, reporter_id
HAVING COUNT(*) > 1;
*/

-- Verify report counts match reality
/*
SELECT 
  'prompts' as table_name,
  COUNT(*) as prompts_with_mismatched_counts
FROM prompts p
WHERE p.report_count != (
  SELECT COUNT(*)
  FROM reports r
  WHERE r.content_type = 'prompt'
    AND r.content_id = p.id
    AND r.status = 'pending'
);
*/

-- =====================================================
-- UI INTEGRATION EXAMPLE
-- =====================================================
/*
-- In your report form component:
const { data: alreadyReported } = await supabase
  .rpc('has_active_report', {
    p_content_type: 'prompt',
    p_content_id: promptId
  });

if (alreadyReported) {
  // Show "Already Reported" state
  // Disable report button
}
*/

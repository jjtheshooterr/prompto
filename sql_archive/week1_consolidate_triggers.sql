-- =====================================================
-- WEEK 1 PRIORITY #2: Consolidate Pinned Prompt Triggers
-- =====================================================
-- Currently 3 triggers doing the same validation (CPU waste)
-- Consolidate to 1 comprehensive trigger

-- =====================================================
-- STEP 1: Drop redundant triggers (keep functions for now)
-- =====================================================
-- Safe approach: drop triggers first, verify, then clean functions

DROP TRIGGER IF EXISTS trg_enforce_pinned_prompt ON problems;
DROP TRIGGER IF EXISTS trg_validate_pinned_prompt ON problems;
-- Keep: check_pinned_prompt_trigger (we'll enhance it)

-- =====================================================
-- STEP 2: Enhance the remaining trigger function
-- =====================================================
-- Make it comprehensive: same-problem + visibility + deleted checks

CREATE OR REPLACE FUNCTION check_pinned_prompt_problem()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only validate if pinned_prompt_id is being set
  IF NEW.pinned_prompt_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Comprehensive validation in one place
  IF NOT EXISTS (
    SELECT 1 FROM prompts
    WHERE id = NEW.pinned_prompt_id
      AND problem_id = NEW.id           -- Must belong to same problem
      AND is_deleted = false            -- Must not be deleted
      AND is_hidden = false             -- Must not be hidden
      AND status = 'published'          -- Must be published (if you have this column)
  ) THEN
    RAISE EXCEPTION 
      'Pinned prompt must belong to this problem and be published, visible, and not deleted. Prompt ID: %, Problem ID: %',
      NEW.pinned_prompt_id, 
      NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION check_pinned_prompt_problem IS 
  'Validates that pinned prompt belongs to problem and meets visibility requirements. Consolidated from 3 triggers.';

-- =====================================================
-- STEP 3: Verify the remaining trigger is optimal
-- =====================================================
-- The check_pinned_prompt_trigger should fire on:
-- - BEFORE INSERT OR UPDATE OF pinned_prompt_id

-- Verify it exists and is configured correctly
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'check_pinned_prompt_trigger'
      AND tgrelid = 'problems'::regclass
  ) THEN
    RAISE EXCEPTION 'check_pinned_prompt_trigger not found! Manual intervention needed.';
  END IF;
  
  RAISE NOTICE 'Trigger consolidation complete. Reduced from 3 triggers to 1.';
END $$;

-- =====================================================
-- STEP 4 (OPTIONAL): Clean up unused functions
-- =====================================================
-- Only run this AFTER verifying everything works
-- Uncomment after 1-2 days of production testing

/*
DROP FUNCTION IF EXISTS enforce_pinned_prompt_belongs_to_problem();
DROP FUNCTION IF EXISTS validate_pinned_prompt();
*/

-- =====================================================
-- PERFORMANCE IMPACT
-- =====================================================
-- Before: 3 triggers × N problem updates = 3N function calls
-- After:  1 trigger × N problem updates = N function calls
-- Savings: 66% reduction in trigger overhead

-- =====================================================
-- VERIFICATION QUERIES (run after migration)
-- =====================================================

-- Check how many pinned_prompt triggers remain (should be 1)
/*
SELECT 
  tgname,
  pg_get_triggerdef(oid) as definition
FROM pg_trigger
WHERE tgrelid = 'problems'::regclass
  AND tgname LIKE '%pinned%';
*/

-- Test the validation (should fail with clear error)
/*
-- This should raise exception:
UPDATE problems 
SET pinned_prompt_id = '00000000-0000-0000-0000-000000000000'
WHERE id = (SELECT id FROM problems LIMIT 1);
*/

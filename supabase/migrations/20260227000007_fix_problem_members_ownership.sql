-- Fix missing problem_members entries for problem owners
-- This ensures all problem owners have the 'owner' role in problem_members

BEGIN;

-- Insert missing owner memberships for all problems
INSERT INTO public.problem_members (problem_id, user_id, role)
SELECT 
  p.id as problem_id,
  p.owner_id as user_id,
  'owner' as role
FROM public.problems p
WHERE p.owner_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM public.problem_members pm 
    WHERE pm.problem_id = p.id 
      AND pm.user_id = p.owner_id
  )
ON CONFLICT (problem_id, user_id) 
DO UPDATE SET role = 'owner';

-- Also ensure created_by users are members if they're not already
INSERT INTO public.problem_members (problem_id, user_id, role)
SELECT 
  p.id as problem_id,
  p.created_by as user_id,
  'owner' as role
FROM public.problems p
WHERE p.created_by IS NOT NULL
  AND p.owner_id IS NULL  -- Only if owner_id is not set
  AND NOT EXISTS (
    SELECT 1 
    FROM public.problem_members pm 
    WHERE pm.problem_id = p.id 
      AND pm.user_id = p.created_by
  )
ON CONFLICT (problem_id, user_id) 
DO UPDATE SET role = 'owner';

COMMIT;

-- Verification
DO $$
DECLARE
  v_problems_count int;
  v_members_count int;
  v_missing_count int;
BEGIN
  -- Count total problems
  SELECT COUNT(*) INTO v_problems_count
  FROM public.problems
  WHERE owner_id IS NOT NULL OR created_by IS NOT NULL;
  
  -- Count problem_members with owner role
  SELECT COUNT(*) INTO v_members_count
  FROM public.problem_members
  WHERE role = 'owner';
  
  -- Count problems without owner membership
  SELECT COUNT(*) INTO v_missing_count
  FROM public.problems p
  WHERE (p.owner_id IS NOT NULL OR p.created_by IS NOT NULL)
    AND NOT EXISTS (
      SELECT 1 
      FROM public.problem_members pm 
      WHERE pm.problem_id = p.id 
        AND pm.user_id = COALESCE(p.owner_id, p.created_by)
        AND pm.role = 'owner'
    );
  
  RAISE NOTICE '✅ Problem ownership fix applied:';
  RAISE NOTICE '   Total problems: %', v_problems_count;
  RAISE NOTICE '   Owner memberships: %', v_members_count;
  RAISE NOTICE '   Missing memberships: %', v_missing_count;
  
  IF v_missing_count = 0 THEN
    RAISE NOTICE '🎉 All problem owners have proper memberships!';
  ELSE
    RAISE WARNING '⚠️ Some problems still missing owner memberships';
  END IF;
END $$;

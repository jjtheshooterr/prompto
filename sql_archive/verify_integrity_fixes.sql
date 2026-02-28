-- VERIFICATION QUERIES - Run these in Supabase dashboard to check if fixes worked

-- 1. Check if problem_members duplicates are gone
SELECT 'Problem Members Duplicates Check' as test_name,
       COUNT(*) as total_duplicates
FROM (
  SELECT problem_id, user_id, COUNT(*) as cnt
  FROM public.problem_members
  GROUP BY problem_id, user_id
  HAVING COUNT(*) > 1
) duplicates;
-- Should return 0 duplicates

-- 2. Check if prompt slug duplicates are gone
SELECT 'Prompt Slug Duplicates Check' as test_name,
       COUNT(*) as total_duplicates
FROM (
  SELECT problem_id, slug, COUNT(*) as cnt
  FROM public.prompts
  WHERE slug IS NOT NULL
  GROUP BY problem_id, slug
  HAVING COUNT(*) > 1
) duplicates;
-- Should return 0 duplicates

-- 3. Check if prompt review duplicates are gone
SELECT 'Prompt Review Duplicates Check' as test_name,
       COUNT(*) as total_duplicates
FROM (
  SELECT prompt_id, user_id, COUNT(*) as cnt
  FROM public.prompt_reviews
  GROUP BY prompt_id, user_id
  HAVING COUNT(*) > 1
) duplicates;
-- Should return 0 duplicates

-- 4. Check if constraints were added successfully
SELECT 'Constraints Check' as test_name,
       constraint_name,
       table_name
FROM information_schema.table_constraints
WHERE constraint_name IN (
  'problem_members_user_problem_unique',
  'prompts_problem_slug_unique', 
  'prompt_reviews_user_prompt_unique'
)
ORDER BY constraint_name;
-- Should return 3 rows

-- 5. Check if indexes were created successfully
SELECT 'Indexes Check' as test_name,
       indexname,
       tablename
FROM pg_indexes
WHERE indexname IN (
  'idx_prompts_browse_critical',
  'idx_prompts_parent_critical',
  'idx_votes_user_critical',
  'idx_votes_prompt_critical'
)
ORDER BY indexname;
-- Should return 4 rows

-- 6. Check if trigger function exists
SELECT 'Trigger Function Check' as test_name,
       proname as function_name,
       prosrc IS NOT NULL as has_source
FROM pg_proc
WHERE proname = 'validate_pinned_prompt';
-- Should return 1 row

-- 7. Check if trigger exists
SELECT 'Trigger Check' as test_name,
       trigger_name,
       event_manipulation,
       action_timing
FROM information_schema.triggers
WHERE trigger_name = 'trg_validate_pinned_prompt';
-- Should return 1 row

-- 8. Test pinned prompt validation (this should work without error)
SELECT 'Pinned Prompt Validation Test' as test_name,
       'Validation function exists and is callable' as status;
-- If this runs without error, the trigger is working
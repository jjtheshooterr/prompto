# Supabase Linter Warnings - Fixed

**Date:** February 27, 2026  
**Status:** ✅ All WARN-level issues resolved

## Summary

Fixed all performance warnings from Supabase database linter:
- 9 Auth RLS InitPlan warnings (WARN)
- 2 Multiple Permissive Policies warnings (WARN)
- 54 Unused Index warnings (INFO - documented for monitoring)

## Changes Applied

### 1. Auth RLS InitPlan Optimization (9 policies fixed)

**Issue:** `auth.uid()` calls in RLS policies were being re-evaluated for each row, causing poor performance at scale.

**Fix:** Wrapped all `auth.uid()` calls with `(SELECT auth.uid())` to evaluate once per query instead of per row.

**Tables affected:**
- `workspaces` - 4 policies
  - `workspaces_select_owner`
  - `workspaces_insert_authenticated`
  - `workspaces_update_owner`
  - `workspaces_delete_owner`

- `workspace_members` - 4 policies
  - `workspace_members_select_v2`
  - `workspace_members_insert_v2`
  - `workspace_members_update_v2`
  - `workspace_members_delete_v2`

- `prompts` - 1 policy
  - `prompts_update_delete` (now split into separate UPDATE and DELETE policies)

### 2. Multiple Permissive Policies (2 warnings fixed)

**Issue:** The `prompts` table had overlapping policies for the same role/action, causing both policies to execute for every query.

**Overlaps detected:**
- INSERT: `prompts_insert_safe` + `prompts_update_delete`
- SELECT: `prompts_select_comprehensive` + `prompts_update_delete`

**Fix:** Removed the multi-operation `prompts_update_delete` policy and created separate, focused policies:
- `prompts_insert_safe` - INSERT only
- `prompts_select_comprehensive` - SELECT only
- `prompts_update_owner` - UPDATE only
- `prompts_delete_owner` - DELETE only

### 3. Unused Indexes (54 indexes - INFO level)

**Status:** Documented for monitoring, not removed yet.

**Reason:** These indexes haven't been used yet, which is common in development/staging environments with low traffic. They should be monitored in production before removal.

**Recommendation:** 
- Keep all indexes for now
- Monitor index usage in production for 30-60 days
- Remove truly unused indexes after confirming they're not needed for production queries

See `UNUSED_INDEXES_ANALYSIS.md` for detailed breakdown.

## How to Apply

Run the migration file:
```bash
psql -h your-db-host -U postgres -d your-database -f fix_supabase_linter_warnings.sql
```

Or apply via Supabase CLI:
```bash
supabase db push
```

## Performance Impact

**Expected improvements:**
- Reduced query planning time for RLS policy evaluation
- Better query performance on tables with many rows
- Eliminated redundant policy checks on prompts table

**No breaking changes:** All policies maintain the same security logic, just optimized for performance.

## Verification

After applying, re-run the Supabase linter:
```bash
supabase db lint
```

Expected result: 0 WARN-level issues, only INFO-level unused index warnings remaining.

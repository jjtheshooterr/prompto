# Security Linter Fixes Complete

## Issues Fixed

### ERROR Level (Critical - All Fixed ✅)
1. **Security Definer Views** - 3 views fixed
   - `public.search_prompts_v1` - Changed to `security_invoker=true`
   - `public.search_problems_v1` - Changed to `security_invoker=true`
   - `public.prompt_rankings` - Changed to `security_invoker=true`

   **Why this matters**: Views with SECURITY DEFINER bypass RLS policies and run with the permissions of the view creator, which is a security risk. Using `security_invoker=true` ensures views respect the calling user's permissions.

### WARN Level (Fixed ✅)
2. **Function Search Path Mutable** - 4 functions fixed
   - `public.tg_set_prompt_lineage` - Added `SET search_path = public`
   - `public.get_prompt_children` - Added `SET search_path = public`
   - `public.get_prompt_lineage` - Added `SET search_path = public`
   - `public.immutable_array_to_string` - Added `SET search_path = public`

   **Why this matters**: Functions without explicit search_path can be vulnerable to search_path injection attacks where malicious users manipulate the search path to execute unintended code.

### WARN Level (Remaining - Low Priority)
3. **Extensions in Public Schema** - 2 warnings
   - `pg_trgm` extension in public schema
   - `unaccent` extension in public schema

   **Status**: Not fixed in this migration as it requires CASCADE drops and recreation of all dependent objects. This is a best practice issue but not a security vulnerability.

4. **Auth Leaked Password Protection Disabled** - 1 warning
   - Supabase Auth leaked password protection is disabled

   **Status**: This is a Supabase Auth configuration setting, not a database migration issue. Can be enabled in Supabase dashboard under Authentication > Policies.

## Changes Applied

### Migration File
- **File**: `supabase/migrations/20260227000001_fix_security_linter_issues.sql`
- **Applied**: ✅ Successfully applied to local database

### What Changed
1. Dropped and recreated 3 views with `security_invoker=true`
2. Updated 4 functions to include `SET search_path = public`
3. Recreated materialized views that depend on the fixed views

## Verification

Run the Supabase linter again to verify:
```bash
# In Supabase Studio, go to Database > Linter
# Or use CLI:
supabase db lint
```

Expected results:
- ✅ 0 ERROR-level issues
- ⚠️ 3 WARN-level issues remaining (extensions + auth config)

## Remaining Warnings (Optional)

### To Fix Extensions Warning
Moving extensions to the `extensions` schema requires:
1. Creating `extensions` schema
2. Dropping extensions with CASCADE (affects all dependent objects)
3. Recreating extensions in new schema
4. Updating all function calls to use `extensions.function_name()`
5. Recreating all materialized views and indexes

This is a significant change and should be done carefully in a separate migration if needed.

### To Fix Auth Warning
Enable leaked password protection in Supabase:
1. Go to Supabase Dashboard
2. Navigate to Authentication > Policies
3. Enable "Leaked Password Protection"
4. This checks passwords against HaveIBeenPwned.org database

## Files Modified
1. `supabase/migrations/20260227000001_fix_security_linter_issues.sql` - New migration
2. Database views and functions updated

---

**Status**: ✅ All critical (ERROR-level) security issues resolved
**Date**: February 27, 2026
**Applied to**: Local Supabase instance

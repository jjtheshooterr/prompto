# User Profiles & Attribution Migration - APPLIED ✅

**Date Applied**: January 27, 2026  
**Migration File**: `profiles_attribution_migration.sql`  
**Status**: Successfully applied to production database

---

## What Was Applied

### 1. Username System ✅
- Added `profiles_username_format` constraint (3-20 chars, a-z 0-9 underscore)
- Cleaned existing usernames (replaced dots with underscores)
- Case-insensitive username lookups via index

### 2. Public Profiles View ✅
- Created `public_profiles` view (security-safe, no sensitive data)
- Granted SELECT access to anon and authenticated users
- Exposes: id, username, display_name, avatar_url, reputation, stats

### 3. Performance Indexes ✅
- `idx_prompts_created_by_date` - User's prompts by date
- `idx_prompts_created_by_parent` - User's forks
- `idx_problems_created_by_date` - User's problems by date
- `idx_profiles_username_lower` - Case-insensitive username lookup

### 4. RLS Policies ✅
- `public_profiles_select_all` - Anyone can read profiles
- `profiles_update_self` - Users can update their own profile

### 5. Helper Functions ✅
- `is_username_available(text)` - Check username availability
- `get_profile_by_username(text)` - Lookup profile by username

### 6. Profile Query Functions ✅
- `get_user_prompts(uuid, sort, limit, offset)` - Get user's original prompts
- `get_user_forks(uuid, sort, limit, offset)` - Get user's forks with parent attribution
- `get_user_problems(uuid, sort, limit, offset)` - Get user's problems

---

## Pre-Migration Data Cleanup

**Issue Found**: Existing usernames contained dots (`.`) which violated new format constraint.

**Solution Applied**:
```sql
UPDATE profiles 
SET username = REPLACE(username, '.', '_')
WHERE username IS NOT NULL AND username ~ '\.';
```

**Affected Users**: 9 users (jaxon.thomas* → jaxon_thomas*)

---

## Bug Fixes Applied

**Issue**: Original migration had ORDER BY bug (can't cast int to timestamptz)

**Fix**: Rewrote query functions to use conditional logic instead of CASE expressions:
- `get_user_prompts` - Fixed sorting by score/fork_count
- `get_user_forks` - Fixed sorting by score
- `get_user_problems` - Fixed sorting by activity

---

## Verification Results

All components verified successfully:

✅ Username constraint exists  
✅ Public profiles view created  
✅ All 4 indexes created  
✅ Both RLS policies active  
✅ All 5 functions created and working  
✅ Username availability check works  
✅ Profile lookup works (case-insensitive)  
✅ Query functions work with all sort options  

---

## Next Steps for UI Implementation

Follow the guide in `profiles_ui_quickstart.md`:

1. **Profile Pages** (`/u/[username]`)
   - Use `get_profile_by_username()` to fetch profile
   - Use `get_user_prompts()`, `get_user_forks()`, `get_user_problems()` for content

2. **Author Attribution**
   - Join with `public_profiles` view in queries
   - Display author name + link to profile

3. **Username Settings**
   - Check availability with `is_username_available()`
   - Update via standard Supabase update (RLS enforces ownership)

4. **Profile Discovery**
   - Add username to search indexes
   - Link from prompt/problem cards to author profiles

---

## Database Schema Changes

### New Constraint
```sql
profiles.username CHECK (username IS NULL OR username ~ '^[a-z0-9_]{3,20}$')
```

### New View
```sql
public.public_profiles (safe subset of profiles table)
```

### New Indexes
- 3 content indexes (prompts/problems by created_by)
- 1 username lookup index (case-insensitive)

### New Functions
- 5 functions total (1 availability check, 1 profile lookup, 3 content queries)

### New RLS Policies
- 2 policies on profiles table (select all, update self)

---

## Performance Impact

**Positive**:
- Faster profile queries (new indexes)
- Efficient username lookups (case-insensitive index)
- Optimized content queries (created_by indexes)

**Negligible**:
- Minimal overhead from new constraint
- View has no performance cost (just a query alias)

---

## Security Considerations

✅ **Safe**: Public profiles view only exposes non-sensitive data  
✅ **Safe**: RLS enforces profile update ownership  
✅ **Safe**: All query functions use SECURITY INVOKER (respect RLS)  
✅ **Safe**: Username availability function uses SECURITY DEFINER with explicit search_path  

---

## Rollback Plan (If Needed)

```sql
-- Drop functions
DROP FUNCTION IF EXISTS get_user_problems;
DROP FUNCTION IF EXISTS get_user_forks;
DROP FUNCTION IF EXISTS get_user_prompts;
DROP FUNCTION IF EXISTS get_profile_by_username;
DROP FUNCTION IF EXISTS is_username_available;

-- Drop policies
DROP POLICY IF EXISTS profiles_update_self ON profiles;
DROP POLICY IF EXISTS public_profiles_select_all ON profiles;

-- Drop indexes
DROP INDEX IF EXISTS idx_profiles_username_lower;
DROP INDEX IF EXISTS idx_problems_created_by_date;
DROP INDEX IF EXISTS idx_prompts_created_by_parent;
DROP INDEX IF EXISTS idx_prompts_created_by_date;

-- Drop view
DROP VIEW IF EXISTS public_profiles;

-- Drop constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_username_format;
```

**Note**: Rollback would NOT restore original usernames with dots.

---

## Migration Timeline

- **Week 1-2**: Report dedup + trigger consolidation ✅
- **Week 2**: Performance optimizations (RLS, indexes) ✅
- **Week 2-3**: User profiles & attribution ✅ **← YOU ARE HERE**
- **Week 3-4**: UI implementation (next step)

---

## Success Metrics

- ✅ Zero downtime during migration
- ✅ All existing data preserved (usernames cleaned, not lost)
- ✅ All functions tested and working
- ✅ No RLS violations
- ✅ Performance indexes in place

---

## Documentation References

- **Implementation Plan**: `profiles_implementation_plan.md`
- **UI Quick Start**: `profiles_ui_quickstart.md`
- **Feature Summary**: `PROFILES_FEATURE_SUMMARY.md`
- **Migration SQL**: `profiles_attribution_migration.sql`

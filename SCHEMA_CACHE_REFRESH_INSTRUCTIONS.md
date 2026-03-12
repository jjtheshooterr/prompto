# Schema Cache Refresh Instructions

## Problem
After applying the migrations, the `prompt_comparisons` table exists in the database but PostgREST (Supabase's API layer) hasn't refreshed its schema cache yet, so API requests can't see the new table.

## Solutions (Pick One)

### Option 1: Wait (Easiest)
PostgREST automatically refreshes its schema cache every 1-2 minutes. Just wait and refresh your browser.

### Option 2: Restart Supabase Project (Fastest)
1. Go to https://supabase.com/dashboard/project/yknsbonffoaxxcwvxrls
2. Click **Settings** → **General**
3. Scroll down to **Danger Zone**
4. Click **Restart project**
5. Wait 30 seconds for restart to complete
6. Refresh your app

### Option 3: Make a Query from Dashboard
1. Go to https://supabase.com/dashboard/project/yknsbonffoaxxcwvxrls/editor
2. Click **SQL Editor**
3. Run this query:
   ```sql
   SELECT * FROM prompt_comparisons LIMIT 1;
   ```
4. This forces PostgREST to reload the schema
5. Refresh your app

### Option 4: Use Supabase CLI
```bash
npx supabase db remote exec "NOTIFY pgrst, 'reload schema'" --linked
```

## Verification
Once the cache is refreshed, you should see:
- No more "prompt_comparisons table not found" errors in console
- Recent Comparisons section appears on /compare page (if there's data)
- The page loads without errors

## Current Status
- ✅ Migration `20260221000000_battle_mode.sql` is applied
- ✅ Table `prompt_comparisons` exists in database
- ⏳ PostgREST schema cache needs refresh
- ✅ Error handling added to gracefully handle missing table

## Why This Happens
Supabase uses PostgREST to automatically generate REST APIs from your database schema. When you add new tables via migrations, PostgREST needs to reload its internal schema cache to expose the new tables via the API. This usually happens automatically within 1-2 minutes, but can be forced with a restart.

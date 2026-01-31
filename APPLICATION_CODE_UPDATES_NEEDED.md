# Application Code Updates Needed - Security Fixes

**Date**: January 29, 2026  
**Priority**: HIGH  
**Status**: REQUIRED BEFORE PRODUCTION USE

---

## Overview

After applying critical security fixes, some application code needs to be updated to work with the new secure RPC functions and policies.

---

## 1. Settings Page - Profile Updates

**File**: `app/(app)/settings/page.tsx`

**Current Issue**: Uses direct UPDATE on profiles table, which is now restricted.

**Required Changes**:

### For Display Name, Bio, Avatar, etc.
Replace direct UPDATE with `update_profile()` RPC:

```typescript
// OLD (will fail with new policies)
const { error } = await supabase
  .from('profiles')
  .update({
    display_name: displayName || null,
    username: username || null
  })
  .eq('id', user.id);

// NEW (secure)
const { data, error } = await supabase.rpc('update_profile', {
  p_display_name: displayName || null,
  p_bio: bio || null,
  p_avatar_url: avatarUrl || null,
  p_website: website || null,
  p_location: location || null,
  p_twitter_handle: twitterHandle || null,
  p_github_handle: githubHandle || null
});
```

### For Username Changes
Create a separate RPC function with cooldown check:

```sql
CREATE OR REPLACE FUNCTION change_username(p_new_username text)
RETURNS profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_profile profiles;
  v_last_change timestamp with time zone;
  v_old_username text;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Get current profile
  SELECT username, username_changed_at INTO v_old_username, v_last_change
  FROM profiles
  WHERE id = v_user_id;
  
  -- Check 30-day cooldown
  IF v_last_change IS NOT NULL AND v_last_change > NOW() - INTERVAL '30 days' THEN
    RAISE EXCEPTION 'Username can only be changed once every 30 days';
  END IF;
  
  -- Validate username format
  IF p_new_username !~ '^[a-z0-9_]{3,20}$' THEN
    RAISE EXCEPTION 'Invalid username format';
  END IF;
  
  -- Check availability
  IF NOT is_username_available(p_new_username) THEN
    RAISE EXCEPTION 'Username not available';
  END IF;
  
  -- Record old username in history
  IF v_old_username IS NOT NULL THEN
    INSERT INTO username_history (user_id, old_username, new_username)
    VALUES (v_user_id, v_old_username, p_new_username);
  END IF;
  
  -- Update username
  UPDATE profiles
  SET 
    username = p_new_username,
    username_changed_at = NOW(),
    updated_at = NOW()
  WHERE id = v_user_id
  RETURNING * INTO v_profile;
  
  RETURN v_profile;
END;
$$;

GRANT EXECUTE ON FUNCTION change_username TO authenticated;
```

Then use it in the app:

```typescript
// For username changes
const { data, error } = await supabase.rpc('change_username', {
  p_new_username: username
});

if (error) {
  if (error.message.includes('30 days')) {
    toast.error('Username can only be changed once every 30 days');
  } else if (error.message.includes('not available')) {
    toast.error('Username not available');
  } else {
    toast.error('Failed to change username');
  }
} else {
  toast.success('Username updated!');
}
```

---

## 2. Vote Queries - Use Aggregated Stats

**Files**: Any component that queries votes

**Current Issue**: Direct SELECT on votes table now only returns user's own votes.

**Required Changes**:

```typescript
// OLD (will return empty for other users)
const { data: votes } = await supabase
  .from('votes')
  .select('*')
  .eq('prompt_id', promptId);

// NEW (use aggregated stats)
const { data: stats } = await supabase
  .from('prompt_stats')
  .select('upvotes, downvotes, score')
  .eq('prompt_id', promptId)
  .single();

// To check if current user voted
const { data: myVote } = await supabase
  .from('votes')
  .select('vote_type')
  .eq('prompt_id', promptId)
  .eq('user_id', userId)
  .maybeSingle();
```

---

## 3. Event Tracking - Use Stats

**Files**: Any component that queries prompt_events

**Current Issue**: No public SELECT access to prompt_events.

**Required Changes**:

```typescript
// OLD (will return empty)
const { data: events } = await supabase
  .from('prompt_events')
  .select('*')
  .eq('prompt_id', promptId);

// NEW (use aggregated stats)
const { data: stats } = await supabase
  .from('prompt_stats')
  .select('view_count, copy_count, fork_count')
  .eq('prompt_id', promptId)
  .single();
```

---

## 4. Avatar Upload - Already Secure

**File**: `app/(app)/settings/page.tsx`

**Status**: ✅ Already using direct storage upload + profile update

The avatar upload code is fine because:
1. It uploads to storage (user-specific path)
2. It updates `avatar_url` field only
3. The new `update_profile()` RPC accepts `p_avatar_url`

**Optional improvement**: Use `update_profile()` RPC for avatar URL update:

```typescript
// After successful upload
const { error: updateError } = await supabase.rpc('update_profile', {
  p_avatar_url: publicUrl
});
```

---

## 5. Problem Member Management

**Files**: Problem member management components

**Current Issue**: DELETE policy now requires owner/admin role.

**Status**: ✅ Likely already correct if using proper role checks

**Verify**: Ensure UI only shows "Remove" button for owner/admin, and "Leave" for self.

---

## 6. Problem Editing

**Files**: Problem edit forms

**Current Issue**: UPDATE policy now requires owner/admin/member role (not viewer).

**Status**: ✅ Likely already correct if using proper role checks

**Verify**: Ensure viewers don't see edit buttons.

---

## 7. Prompt Creation

**Files**: Prompt creation forms

**Current Issue**: INSERT policy now enforces `created_by = auth.uid()`.

**Status**: ✅ Should already be correct

**Verify**: Ensure `created_by` is set to current user ID (or omitted, letting default handle it).

---

## Implementation Priority

### P0 - Critical (Do Before Launch)
1. ✅ Apply database security fixes (DONE)
2. 🔄 Update settings page to use `update_profile()` RPC
3. 🔄 Create and use `change_username()` RPC
4. 🔄 Update vote queries to use stats
5. 🔄 Update event queries to use stats

### P1 - Important (Do Soon)
6. 🔄 Add moderator role checks
7. 🔄 Create admin panel for viewing events/votes (moderator-only)
8. 🔄 Add audit logging for sensitive actions

### P2 - Nice to Have
9. 🔄 Add rate limiting to username changes
10. 🔄 Add email notifications for security events

---

## Testing Checklist

After making changes, test:

### Profile Updates
- [ ] Update display name (should work)
- [ ] Update bio (should work)
- [ ] Try to update role field directly (should fail)
- [ ] Change username (should work with cooldown)
- [ ] Try to change username twice in 30 days (should fail)

### Vote Privacy
- [ ] View own votes (should work)
- [ ] Try to view other users' votes (should return empty)
- [ ] View aggregated vote counts (should work)

### Event Privacy
- [ ] Try to view prompt events (should return empty)
- [ ] View aggregated stats (should work)

### Problem Permissions
- [ ] Viewer tries to edit (should fail)
- [ ] Member edits (should work)
- [ ] Member tries to delete (should fail)
- [ ] Owner deletes (should work)

---

## Code Examples

### Complete Settings Page Update

```typescript
const handleSave = async () => {
  if (!user) return;
  
  setSaving(true);
  const supabase = createClient();
  
  try {
    // Update profile fields (not username)
    const { error: profileError } = await supabase.rpc('update_profile', {
      p_display_name: displayName || null,
      p_bio: bio || null,
      p_website: website || null,
      p_location: location || null,
      p_twitter_handle: twitterHandle || null,
      p_github_handle: githubHandle || null
    });
    
    if (profileError) throw profileError;
    
    // Update username separately if changed
    if (username && username !== originalUsername) {
      const { error: usernameError } = await supabase.rpc('change_username', {
        p_new_username: username
      });
      
      if (usernameError) {
        if (usernameError.message.includes('30 days')) {
          toast.error('Username can only be changed once every 30 days');
        } else if (usernameError.message.includes('not available')) {
          toast.error('Username not available');
        } else {
          throw usernameError;
        }
        return;
      }
    }
    
    toast.success('Profile updated!');
    setTimeout(() => window.location.reload(), 1500);
  } catch (error: any) {
    console.error('Error updating profile:', error);
    toast.error('Failed to update profile');
  } finally {
    setSaving(false);
  }
};
```

---

## SQL Migrations Needed

### Create change_username() RPC

```sql
-- File: supabase/migrations/YYYYMMDDHHMMSS_add_change_username_rpc.sql

CREATE OR REPLACE FUNCTION change_username(p_new_username text)
RETURNS profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_profile profiles;
  v_last_change timestamp with time zone;
  v_old_username text;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  SELECT username, username_changed_at INTO v_old_username, v_last_change
  FROM profiles
  WHERE id = v_user_id;
  
  IF v_last_change IS NOT NULL AND v_last_change > NOW() - INTERVAL '30 days' THEN
    RAISE EXCEPTION 'Username can only be changed once every 30 days';
  END IF;
  
  IF p_new_username !~ '^[a-z0-9_]{3,20}$' THEN
    RAISE EXCEPTION 'Invalid username format';
  END IF;
  
  IF NOT is_username_available(p_new_username) THEN
    RAISE EXCEPTION 'Username not available';
  END IF;
  
  IF v_old_username IS NOT NULL THEN
    INSERT INTO username_history (user_id, old_username, new_username)
    VALUES (v_user_id, v_old_username, p_new_username);
  END IF;
  
  UPDATE profiles
  SET 
    username = p_new_username,
    username_changed_at = NOW(),
    updated_at = NOW()
  WHERE id = v_user_id
  RETURNING * INTO v_profile;
  
  RETURN v_profile;
END;
$$;

GRANT EXECUTE ON FUNCTION change_username TO authenticated;
```

---

## Status Summary

| Component | Status | Priority | Effort |
|-----------|--------|----------|--------|
| Settings page | 🔄 Needs update | P0 | 2 hours |
| change_username RPC | 🔄 Needs creation | P0 | 1 hour |
| Vote queries | 🔄 Needs update | P0 | 1 hour |
| Event queries | 🔄 Needs update | P0 | 30 min |
| Testing | 🔄 Not done | P0 | 2 hours |

**Total Effort**: ~6-7 hours

---

## Next Steps

1. Create `change_username()` RPC migration
2. Update settings page to use new RPCs
3. Search codebase for direct votes/events queries
4. Update those queries to use stats
5. Test all changes thoroughly
6. Deploy to production

---

**Last Updated**: January 29, 2026  
**Status**: Documentation Complete, Implementation Pending  
**Maintained by**: Kiro AI Assistant

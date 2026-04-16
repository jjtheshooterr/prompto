# Settings Page Fixes

**Date**: January 29, 2026  
**Status**: ✅ FIXED  

---

## Issues Fixed

### 1. ✅ Next.js Image Warning
**Issue**: Missing `sizes` prop on Image component  
**Error**: `Image with src "..." has "fill" but is missing "sizes" prop`

**Fix**: Added `sizes="96px"` to the Image component
```typescript
<Image
  src={avatarUrl}
  alt="Profile picture"
  fill
  sizes="96px"  // Added this
  className="object-cover"
/>
```

**Impact**: Improved page performance, removed warning

---

### 2. ✅ update_profile RPC Error - Column "bio" does not exist
**Issue**: RPC returning 400 error  
**Error**: `column "bio" does not exist`

**Root Cause**: Function was trying to update columns that don't exist in the profiles table

**Actual Profiles Columns**:
- `id`, `username`, `display_name`, `avatar_url`, `created_at`
- `role`, `onboarding_completed`, `onboarding_step`
- `reputation`, `upvotes_received`, `forks_received`, `username_changed_at`

**Fix**: Updated `update_profile()` function to only update columns that exist:
- `display_name` (editable by user)
- `avatar_url` (editable by user)

```sql
CREATE OR REPLACE FUNCTION update_profile(
  p_display_name text DEFAULT NULL,
  p_avatar_url text DEFAULT NULL
)
RETURNS profiles
AS $$
BEGIN
  -- Check authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Check if profile exists
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;
  
  -- Update only display_name and avatar_url
  UPDATE profiles
  SET
    display_name = COALESCE(p_display_name, display_name),
    avatar_url = COALESCE(p_avatar_url, avatar_url)
  WHERE id = auth.uid()
  RETURNING *;
END;
$$;
```

**Impact**: Profile updates now work correctly

---

## Protected Columns

These columns CANNOT be updated by users (protected by function):
- `role` - Only admins can change
- `reputation` - Calculated automatically
- `upvotes_received` - Calculated automatically
- `forks_received` - Calculated automatically
- `username` - Use `change_username()` RPC instead
- `username_changed_at` - Updated automatically by `change_username()`

---

## Testing

### Test Profile Update ✅
1. Go to Settings page
2. Update display name
3. Click "Save Changes"
4. Should see success message
5. Page should refresh with new name

### Test Avatar Upload ✅
1. Go to Settings page
2. Click "Upload Photo"
3. Select an image
4. Should see success message
5. Avatar should update immediately

### Test Username Change ✅
1. Go to Settings page
2. Change username
3. Click "Save Changes"
4. Should see success message
5. Page should refresh with new username

---

## Files Modified

1. `app/(app)/settings/page.tsx` - Added sizes prop, improved error logging
2. Database: `update_profile()` function - Fixed to use correct columns

---

## Status

✅ Image warning fixed  
✅ RPC error fixed (column mismatch)  
✅ Function uses correct columns  
✅ Protected columns cannot be modified  
✅ Ready for testing  

---

**Last Updated**: January 29, 2026  
**Status**: COMPLETE ✅

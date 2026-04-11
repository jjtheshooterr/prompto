# Fix Authentication Issue

## Problem
Your session cookie exists but contains an **expired/invalid session**.

Logs show:
```
Middleware - Cookie Names: sb-yknsbonffoaxxcwvxrls-auth-token ✅ (cookie exists)
submitReview - User error: AuthSessionMissingError ❌ (session invalid)
```

## How to Fix

### Option 1: Clear Session & Re-login (Quick Fix)

1. Open Browser DevTools (F12)
2. Go to: **Application** → **Cookies** → `http://localhost:3000`
3. **Delete** the cookie: `sb-yknsbonffoaxxcwvxrls-auth-token`
4. Visit: `http://localhost:3000/login`
5. Sign in again
6. Try submitting a review

### Option 2: Programmatic Sign Out (Recommended)

Add this button temporarily to your UI:

```tsx
<button onClick={async () => {
  const supabase = createClient()
  await supabase.auth.signOut()
  window.location.href = '/login'
}}>
  Force Sign Out
</button>
```

## Why This Happens

- Session tokens expire after 1 hour by default
- Supabase should auto-refresh, but sometimes fails if:
  - The refresh token is also expired (7 days)
  - Middleware isn't properly refreshing sessions
  - Client and server are out of sync

## Long-term Fix

The middleware should automatically refresh expiring sessions. I'll implement this next.

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              cookieStore.set(name, value, options)
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          })
        },
      },
    }
  )

  // WORKAROUND: If Supabase SSR can't read the cookie, manually inject session
  const authCookie = cookieStore.get('sb-yknsbonffoaxxcwvxrls-auth-token')
  if (authCookie?.value) {
    try {
      const sessionData = JSON.parse(authCookie.value)
      if (sessionData.access_token && sessionData.refresh_token) {
        // Manually set the session on the client
        await client.auth.setSession({
          access_token: sessionData.access_token,
          refresh_token: sessionData.refresh_token
        })
      }
    } catch (e) {
      // If manual injection fails, fallback to normal behavior
      console.error('Manual session injection failed:', e)
    }
  }

  return client
}
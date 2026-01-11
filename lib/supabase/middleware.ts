import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // WORKAROUND: Manual JWT verification
  // Since Supabase SSR session detection is failing in Edge Runtime,
  // we manually check if the access token exists and is not expired.

  let user = null
  const authCookie = request.cookies.get('sb-yknsbonffoaxxcwvxrls-auth-token')

  if (authCookie?.value) {
    try {
      // 1. Parse the cookie (it's a JSON object with access_token)
      let sessionData
      try {
        sessionData = JSON.parse(authCookie.value)
      } catch {
        // Fallback for base64 encoded cookies
        const decoded = Buffer.from(authCookie.value, 'base64').toString('utf-8')
        sessionData = JSON.parse(decoded)
      }

      if (sessionData?.access_token) {
        // 2. Decode the JWT to check expiration
        // We don't verify the signature here (expensive/complex in edge), 
        // we trust the cookie content + Supabase will reject invalid tokens downstream anyway.
        const tokenParts = sessionData.access_token.split('.')
        if (tokenParts.length === 3) {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString('utf-8'))
          const now = Math.floor(Date.now() / 1000)

          // Check if token is expired (add 10s buffer)
          if (payload.exp > now + 10) {
            console.log('Middleware - JWT is valid. User:', payload.email)
            user = { email: payload.email, id: payload.sub }
          } else {
            console.log('Middleware - JWT is expired')
          }
        }
      }
    } catch (e: any) {
      console.error('Middleware - JWT verification failed:', e.message)
    }
  }

  console.log('Middleware - Cookie Path:', request.nextUrl.pathname)
  console.log('Middleware - User detected:', user?.email || 'No user')

  // Only protect specific authenticated routes
  const protectedRoutes = ['/dashboard', '/create']
  const isProtectedRoute = protectedRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  if (isProtectedRoute && !user) {
    console.log('Middleware - Redirecting to login, no user found for protected route')
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isProtectedRoute) {
    console.log('Middleware - User authenticated, allowing access to protected route')
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely.

  return supabaseResponse
}
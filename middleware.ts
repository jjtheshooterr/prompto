import { NextResponse, type NextRequest } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Global rate limiter setup. We fail open gracefully if Upstash credentials are missing.
let rateLimiter: Ratelimit | null = null
let authRateLimiter: Ratelimit | null = null

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })

    // General global rate limit: 100 requests per 10 seconds per IP
    rateLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '10 s'),
      analytics: true,
    })

    // Strict rate limit for authentication routes to prevent credential stuffing: 5 req per 60s
    authRateLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '60 s'),
      analytics: true,
    })
  } catch (err) {
    console.error('Failed to initialize Upstash ratelimiters:', err)
  }
}

// UX gate only — not a security boundary.
// Real enforcement happens at the DB level via RLS and server actions.
// For /admin routes, the reports page additionally verifies profiles.role = 'admin'
// server-side before rendering anything.
const PROTECTED = ['/dashboard', '/create', '/settings', '/workspace', '/admin']
const AUTH_ROUTES = ['/login', '/signup', '/api/auth']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // --- RATE LIMITING ---
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || '127.0.0.1'
  
  // Apply strict rate limiting for authentication routes
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route))
  if (isAuthRoute && authRateLimiter) {
    const { success, limit, reset, remaining } = await authRateLimiter.limit(ip)
    if (!success) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      })
    }
  } 
  // Apply general rate limit for other routes
  else if (rateLimiter) {
    const { success, limit, reset, remaining } = await rateLimiter.limit(ip)
    if (!success) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      })
    }
  }

  // --- ROUTE PROTECTION ---
  const isProtected = PROTECTED.some((p) => pathname.startsWith(p))
  if (!isProtected) return NextResponse.next()

  // Supabase SSR sets a project-specific cookie containing "-auth-token"
  const hasAuth = [...req.cookies.getAll()].some((c) =>
    c.name.includes('-auth-token')
  )

  if (!hasAuth) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
import { updateSession } from '@/lib/supabase/middleware'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Apply rate limiting to API routes and server actions
  if (pathname.startsWith('/api/') || pathname.includes('/_next/data/')) {
    const ip = getClientIp(request)
    
    // IP-based rate limit: 200 requests per minute
    const ipLimit = await rateLimit(`ip:${ip}`, {
      interval: 60000,
      maxRequests: 200
    })
    
    if (!ipLimit.success) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((ipLimit.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Limit': '200',
          'X-RateLimit-Remaining': String(ipLimit.remaining),
          'X-RateLimit-Reset': String(ipLimit.resetAt)
        }
      })
    }
    
    // Add rate limit headers to response
    const response = await updateSession(request)
    response.headers.set('X-RateLimit-Limit', '200')
    response.headers.set('X-RateLimit-Remaining', String(ipLimit.remaining))
    response.headers.set('X-RateLimit-Reset', String(ipLimit.resetAt))
    
    return response
  }
  
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
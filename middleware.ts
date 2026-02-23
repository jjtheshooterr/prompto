import { NextResponse, type NextRequest } from 'next/server'

// UX gate only — not a security boundary.
// Real enforcement happens at the DB level via RLS and server actions.
const PROTECTED = ['/dashboard', '/create', '/settings', '/workspace']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

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
    '/dashboard/:path*',
    '/create/:path*',
    '/settings/:path*',
    '/workspace/:path*',
  ],
}
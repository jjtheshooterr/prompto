import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  console.log('Auth callback hit - code:', !!code, 'next:', next)

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      console.log('Code exchange successful, redirecting to:', next)
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
    console.log('Code exchange failed:', error)
  } else {
    // No code, but user might already be logged in from client-side auth
    console.log('No code provided, checking existing session...')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      console.log('User already authenticated, redirecting to:', next)
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  console.log('Auth callback failed, redirecting to login')
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`)
}
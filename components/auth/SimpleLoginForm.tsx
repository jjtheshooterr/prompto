'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Turnstile } from '@marsidev/react-turnstile'
import { verifyTurnstileToken } from '@/lib/actions/turnstile.actions'

export default function SimpleLoginForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string>('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (loading) return // Prevent multiple submissions

    console.log('Form submitted - preventDefault called')

    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    console.log('Attempting login for:', email)

    const hasTurnstile = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

    if (hasTurnstile && !turnstileToken) {
      setError('Please complete the security challenge')
      setLoading(false)
      return
    }

    if (hasTurnstile && turnstileToken) {
      const verification = await verifyTurnstileToken(turnstileToken)
      if (!verification.success) {
        setError(verification.error || 'Verification failed')
        setLoading(false)
        return
      }
    }

    const supabase = createClient()

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.log('Login error:', error.message)
        setError(error.message)
        setLoading(false)
      } else if (data.session) {
        console.log('Login successful! User:', data.session.user.email)
        console.log('Session data:', data.session)

        // Test redirect to a simple page first
        console.log('About to redirect to problems page for testing...')
        window.location.href = '/problems'

      } else {
        setError('Login failed - no session created')
        setLoading(false)
      }
    } catch (err) {
      console.log('Login exception:', err)
      setError('Login failed: ' + (err instanceof Error ? err.message : 'Unknown error'))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground tracking-tight">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Welcome back to Promptvexity
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4">
            <div className="text-sm text-destructive">
              {error}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={loading}
                className="mt-1 appearance-none relative block w-full px-3 py-2 bg-background border border-border placeholder:text-muted-foreground text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:z-10 sm:text-sm disabled:opacity-50 transition-all"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={loading}
                className="mt-1 appearance-none relative block w-full px-3 py-2 bg-background border border-border placeholder:text-muted-foreground text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:z-10 sm:text-sm disabled:opacity-50 transition-all"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div className="flex justify-center py-2">
            {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? (
              <Turnstile
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                onSuccess={(token) => setTurnstileToken(token)}
                onError={() => setError('Verification challenge failed to load.')}
              />
            ) : (
              <p className="text-xs text-muted-foreground">CAPTCHA disabled (dev mode)</p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <a href="/signup" className="font-medium text-primary hover:text-primary/80 transition-colors">
                Sign up
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
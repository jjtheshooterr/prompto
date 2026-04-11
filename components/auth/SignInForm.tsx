'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Turnstile } from '@marsidev/react-turnstile'
import { verifyTurnstileToken } from '@/lib/actions/turnstile.actions'

export default function SignInForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string>('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)
    
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
      setError('Please enter both email and password')
      setLoading(false)
      return
    }

    if (!turnstileToken) {
      setError('Please complete the security challenge')
      setLoading(false)
      return
    }

    const verification = await verifyTurnstileToken(turnstileToken)
    if (!verification.success) {
      setError(verification.error || 'Verification failed')
      setLoading(false)
      return
    }

    const supabase = createClient()
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else if (data.session) {
        setSuccess(true)
        console.log('Login successful, session created')
        console.log('User:', data.session.user.email)
        console.log('Access token exists:', !!data.session.access_token)
        
        // Use window.location for more reliable redirect
        setTimeout(() => {
          console.log('Attempting redirect to dashboard...')
          window.location.href = '/dashboard'
        }, 1000)
      } else {
        setError('Login failed - no session created')
      }
    } catch (err) {
      setError('Login failed: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
    
    setLoading(false)
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 px-4 py-3 rounded">
          ✅ Login successful! Redirecting to dashboard...
        </div>
        
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition-colors"
        >
          Go to Dashboard (Click if not redirected)
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-foreground">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 block w-full px-3 py-2 bg-background border border-border text-foreground placeholder:text-muted-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
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
          required
          autoComplete="current-password"
          className="mt-1 block w-full px-3 py-2 bg-background border border-border text-foreground placeholder:text-muted-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          placeholder="Enter your password"
        />
      </div>

      <div className="flex justify-center py-2">
        {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? (
          <Turnstile
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
            onSuccess={(token) => setTurnstileToken(token)}
            onError={() => setError('Verification challenge failed to load.')}
          />
        ) : (
          <div className="text-sm text-destructive border border-destructive/20 bg-destructive/10 p-3 rounded">
            Security configuration missing. Cannot load CAPTCHA.
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  )
}
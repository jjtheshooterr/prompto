'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SignUpForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const router = useRouter()

  const checkUsername = async (value: string) => {
    if (!value || value.length < 3) {
      setUsernameAvailable(null)
      return
    }

    // Validate format
    if (!/^[a-z0-9_]{3,20}$/.test(value)) {
      setUsernameAvailable(false)
      return
    }

    setCheckingUsername(true)
    const supabase = createClient()
    const { data } = await supabase.rpc('is_username_available', { u: value })
    setUsernameAvailable(data)
    setCheckingUsername(false)
  }

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase()
    setUsername(value)
    
    // Debounce the check
    const timeoutId = setTimeout(() => checkUsername(value), 500)
    return () => clearTimeout(timeoutId)
  }

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const displayName = formData.get('display_name') as string

    console.log('Attempting signup for:', email)

    const supabase = createClient()
    
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          username: username || null
        }
      }
    })

    if (signUpError) {
      console.log('Signup error:', signUpError.message)
      setError(signUpError.message)
      setLoading(false)
    } else if (data.session) {
      console.log('Signup successful, session created:', data.session.user.email)
      
      // Update profile with username if provided
      if (username && data.user) {
        await supabase
          .from('profiles')
          .update({ 
            username: username,
            display_name: displayName || email.split('@')[0]
          })
          .eq('id', data.user.id)
      }
      
      // User is immediately logged in (email confirmation disabled)
      setTimeout(() => {
        console.log('Redirecting to dashboard...')
        router.push('/dashboard')
      }, 1000)
    } else if (data.user && !data.session) {
      // Email confirmation required
      setError('Please check your email for confirmation link!')
      setLoading(false)
    } else {
      setError('Signup failed - please try again')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSignUp} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">
            {error}
          </div>
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
          placeholder="Enter your email"
        />
      </div>

      <div>
        <label htmlFor="display_name" className="block text-sm font-medium text-gray-700">
          Display Name
        </label>
        <input
          id="display_name"
          name="display_name"
          type="text"
          autoComplete="name"
          className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
          placeholder="Your name"
        />
      </div>

      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
          Username (optional)
        </label>
        <div className="mt-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">@</span>
          <input
            id="username"
            name="username"
            type="text"
            value={username}
            onChange={handleUsernameChange}
            pattern="[a-z0-9_]{3,20}"
            className="appearance-none relative block w-full pl-8 pr-10 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
            placeholder="username"
          />
          {checkingUsername && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">⏳</span>
          )}
          {!checkingUsername && usernameAvailable === true && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600">✓</span>
          )}
          {!checkingUsername && usernameAvailable === false && username.length >= 3 && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600">✗</span>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-500">
          3-20 characters • lowercase letters, numbers, and underscores only
        </p>
        {usernameAvailable === true && username && (
          <p className="mt-1 text-xs text-green-600">
            ✓ Available! Your profile will be at prompto.com/u/{username}
          </p>
        )}
        {usernameAvailable === false && username.length >= 3 && (
          <p className="mt-1 text-xs text-red-600">
            ✗ Username taken or invalid format
          </p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
          placeholder="Create a password"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Creating account...' : 'Create account'}
      </button>
    </form>
  )
}

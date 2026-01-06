'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function SignInForm() {
  const [loading, setLoading] = useState(false)

  const handleSignIn = async (formData: FormData) => {
    setLoading(true)
    
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const supabase = createClient()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert(error.message)
      setLoading(false)
    } else if (data.session) {
      console.log('Login successful, session created:', data.session.user.email)
      // Force a full page reload to ensure session is picked up
      window.location.replace('/dashboard')
    } else {
      alert('Login failed - no session created')
      setLoading(false)
    }
  }

  return (
    <form action={handleSignIn} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  )
}
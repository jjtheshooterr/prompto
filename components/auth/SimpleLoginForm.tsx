'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SimpleLoginForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log('Form submitted - preventDefault called')
    
    setLoading(true)
    setError(null)
    setSuccess(false)
    
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    console.log('Attempting login for:', email)

    const supabase = createClient()
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.log('Login error:', error.message)
        setError(error.message)
      } else if (data.session) {
        console.log('Login successful! User:', data.session.user.email)
        
        // Direct redirect to dashboard
        setTimeout(() => {
          console.log('Redirecting to dashboard...')
          window.location.replace('/dashboard')
        }, 500)
        
      } else {
        setError('Login failed - no session created')
      }
    } catch (err) {
      console.log('Login exception:', err)
      setError('Login failed: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
    
    setLoading(false)
  }

  const handleManualRedirect = () => {
    console.log('Manual redirect clicked')
    window.location.href = '/dashboard'
  }

  if (success) {
    return (
      <div style={{ padding: '50px', maxWidth: '400px', margin: '0 auto', fontFamily: 'Arial' }}>
        <h1>Login Successful!</h1>
        
        <div style={{ color: 'green', marginBottom: '20px', padding: '10px', border: '1px solid green' }}>
          ✅ Welcome back, {user?.email}!
        </div>

        <button
          onClick={handleManualRedirect}
          style={{
            width: '100%',
            padding: '15px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            marginBottom: '10px'
          }}
        >
          Go to Dashboard
        </button>

        <a 
          href="/dashboard"
          style={{
            display: 'block',
            width: '100%',
            padding: '15px',
            backgroundColor: '#007bff',
            color: 'white',
            textDecoration: 'none',
            textAlign: 'center',
            borderRadius: '4px',
            fontSize: '16px'
          }}
        >
          Direct Link to Dashboard
        </a>
      </div>
    )
  }

  return (
    <div style={{ padding: '50px', maxWidth: '400px', margin: '0 auto', fontFamily: 'Arial' }}>
      <h1>Login</h1>
      
      {error && (
        <div style={{ color: 'red', marginBottom: '20px', padding: '10px', border: '1px solid red' }}>
          Error: {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
          <input
            name="email"
            type="email"
            required
            style={{ 
              width: '100%', 
              padding: '12px', 
              border: '2px solid #333',
              borderRadius: '4px',
              fontSize: '16px',
              backgroundColor: 'white',
              color: 'black'
            }}
            placeholder="Enter your email"
          />
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Password:</label>
          <input
            name="password"
            type="password"
            required
            style={{ 
              width: '100%', 
              padding: '12px', 
              border: '2px solid #333',
              borderRadius: '4px',
              fontSize: '16px',
              backgroundColor: 'white',
              color: 'black'
            }}
            placeholder="Enter your password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '15px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}
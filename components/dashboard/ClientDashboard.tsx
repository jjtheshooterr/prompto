'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function ClientDashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      console.log('Client dashboard - User:', user?.email || 'No user')
      setUser(user)
      setLoading(false)
    }

    getUser()
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <div style={{ padding: '50px', fontFamily: 'Arial' }}>
        <h1>Loading...</h1>
      </div>
    )
  }

  return (
    <div style={{ padding: '50px', fontFamily: 'Arial' }}>
      <h1>🎉 Dashboard</h1>
      
      {user ? (
        <div>
          <div style={{ color: 'green', marginBottom: '20px', padding: '10px', border: '1px solid green' }}>
            ✅ Welcome back, {user.email}!
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <h2>Quick Actions</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
              <a href="/problems/new" style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', textDecoration: 'none', color: 'black' }}>
                <h3>Create Problem</h3>
                <p>Add a new coding problem</p>
              </a>
              <a href="/prompts/new" style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', textDecoration: 'none', color: 'black' }}>
                <h3>Create Prompt</h3>
                <p>Add a new prompt solution</p>
              </a>
              <a href="/problems" style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', textDecoration: 'none', color: 'black' }}>
                <h3>Browse Problems</h3>
                <p>Explore existing problems</p>
              </a>
            </div>
          </div>
          
          <button
            onClick={handleSignOut}
            style={{
              padding: '10px 20px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Sign Out
          </button>
        </div>
      ) : (
        <div>
          <div style={{ color: 'red', marginBottom: '20px', padding: '10px', border: '1px solid red' }}>
            ❌ No user session found
          </div>
          <a href="/login" style={{ color: 'blue', textDecoration: 'underline' }}>
            Go to Login
          </a>
        </div>
      )}
    </div>
  )
}
'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function DebugAuthPage() {
  const [clientState, setClientState] = useState<any>(null)
  const [serverState, setServerState] = useState<any>(null)

  useEffect(() => {
    // Check client state
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      setClientState({
        hasSession: !!session,
        userEmail: session?.user?.email || null,
        error: error?.message || null,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      })
    })

    // Check server state
    fetch('/debug-auth').then(r => r.json()).then(setServerState)
  }, [])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Authentication Debug</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="border p-4 rounded">
          <h2 className="font-bold mb-2">Client Side</h2>
          <pre className="text-xs overflow-auto">{JSON.stringify(clientState, null, 2)}</pre>
        </div>

        <div className="border p-4 rounded">
          <h2 className="font-bold mb-2">Server Side</h2>
          <pre className="text-xs overflow-auto">{JSON.stringify(serverState, null, 2)}</pre>
        </div>
      </div>

      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-bold mb-2">Expected Behavior:</h3>
        <ul className="list-disc list-inside text-sm">
          <li>Both sides should have the SAME <code>supabaseUrl</code></li>
          <li>Both sides should show <code>hasAnonKey: true</code></li>
          <li>Client should have <code>hasSession: true</code></li>
          <li>Server should have <code>hasUser: true</code> and same <code>userEmail</code></li>
        </ul>
      </div>

      <div className="mt-4 flex gap-2">
        <a href="/debug-logout" className="px-4 py-2 bg-red-600 text-white rounded">
          Force Logout
        </a>
        <a href="/login" className="px-4 py-2 bg-blue-600 text-white rounded">
          Go to Login
        </a>
      </div>
    </div>
  )
}
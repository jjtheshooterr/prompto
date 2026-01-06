import { getUser } from '@/lib/actions/auth.actions'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export default async function DebugAuthPage() {
  const user = await getUser()
  
  let connectionTest = null
  let cookieInfo = null
  let sessionInfo = null
  
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('profiles').select('count').limit(1)
    connectionTest = { data, error }
    
    // Get session info
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    sessionInfo = { session: sessionData.session ? 'exists' : 'null', error: sessionError }
    
    // Get cookie info
    const cookieStore = await cookies()
    const authCookies = cookieStore.getAll().filter(cookie => 
      cookie.name.includes('supabase') || cookie.name.includes('auth')
    )
    cookieInfo = authCookies
  } catch (err) {
    connectionTest = { error: err }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Authentication Debug</h1>
        
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Current User</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Session Info</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(sessionInfo, null, 2)}
            </pre>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Auth Cookies</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(cookieInfo, null, 2)}
            </pre>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Supabase Connection Test</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(connectionTest, null, 2)}
            </pre>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
            <div className="space-y-2 text-sm">
              <div><strong>NEXT_PUBLIC_SUPABASE_URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL}</div>
              <div><strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</div>
              <div><strong>NEXT_PUBLIC_SITE_URL:</strong> {process.env.NEXT_PUBLIC_SITE_URL}</div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-x-4">
              <a href="/login" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Go to Login
              </a>
              <a href="/signup" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                Go to Signup
              </a>
              <a href="/dashboard" className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                Go to Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/actions/auth.actions'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const user = await getUser()
  
  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()

  // Get user's recent problems and prompts
  const { data: problems } = await supabase
    .from('problems')
    .select('*')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: prompts } = await supabase
    .from('prompts')
    .select('*, problems(title, slug)')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'there'

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {displayName}!</h1>
        <p className="text-gray-600">Here's what you've been working on.</p>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <Link 
          href="/problems/new"
          className="block p-6 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all"
        >
          <h3 className="text-lg font-semibold mb-2">Create Problem</h3>
          <p className="text-gray-600">Define a new problem for the community to solve.</p>
        </Link>
        
        <Link 
          href="/prompts/new"
          className="block p-6 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all"
        >
          <h3 className="text-lg font-semibold mb-2">Create Prompt</h3>
          <p className="text-gray-600">Add a new prompt solution to an existing problem.</p>
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Problems */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Your Recent Problems</h2>
            <Link href="/problems/new" className="text-blue-600 hover:underline text-sm">
              Create New
            </Link>
          </div>
          
          {!problems || problems.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <p className="text-gray-600 mb-4">You haven't created any problems yet.</p>
              <Link 
                href="/problems/new"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Your First Problem
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {problems.map((problem) => (
                <div key={problem.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium mb-1">
                    <Link href={`/problems/${problem.slug}`} className="hover:text-blue-600">
                      {problem.title}
                    </Link>
                  </h3>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {problem.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{new Date(problem.created_at).toLocaleDateString()}</span>
                    <span className="capitalize">{problem.visibility}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Prompts */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Your Recent Prompts</h2>
            <Link href="/prompts/new" className="text-blue-600 hover:underline text-sm">
              Create New
            </Link>
          </div>
          
          {!prompts || prompts.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <p className="text-gray-600 mb-4">You haven't created any prompts yet.</p>
              <Link 
                href="/prompts/new"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Your First Prompt
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {prompts.map((prompt) => (
                <div key={prompt.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium mb-1">
                    <Link href={`/prompts/${prompt.id}`} className="hover:text-blue-600">
                      {prompt.title}
                    </Link>
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Problem: <Link href={`/problems/${prompt.problems?.slug}`} className="text-blue-600 hover:underline">
                      {prompt.problems?.title}
                    </Link>
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{new Date(prompt.created_at).toLocaleDateString()}</span>
                    <span className="capitalize">{prompt.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
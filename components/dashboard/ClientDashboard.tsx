'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface UserStats {
  problemsCreated: number
  promptsSubmitted: number
  votesCast: number
  promptsForked: number
}

interface RecentActivity {
  id: string
  type: 'problem' | 'prompt' | 'vote' | 'fork'
  title: string
  created_at: string
  target_title?: string
}

export default function ClientDashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<UserStats>({
    problemsCreated: 0,
    promptsSubmitted: 0,
    votesCast: 0,
    promptsForked: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [myPrompts, setMyPrompts] = useState<any[]>([])
  const [topPrompts, setTopPrompts] = useState<any[]>([])

  useEffect(() => {
    const loadDashboardData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setLoading(false)
        return
      }

      setUser(user)

      // Load user statistics
      const [problemsResult, promptsResult, votesResult, forksResult] = await Promise.all([
        // Problems created by user
        supabase
          .from('problems')
          .select('id')
          .eq('created_by', user.id),
        
        // Prompts submitted by user
        supabase
          .from('prompts')
          .select('id')
          .eq('created_by', user.id),
        
        // Votes cast by user
        supabase
          .from('votes')
          .select('prompt_id')
          .eq('user_id', user.id),
        
        // Prompts forked by user (prompts with parent_prompt_id)
        supabase
          .from('prompts')
          .select('id')
          .eq('created_by', user.id)
          .not('parent_prompt_id', 'is', null)
      ])

      setStats({
        problemsCreated: problemsResult.data?.length || 0,
        promptsSubmitted: promptsResult.data?.length || 0,
        votesCast: votesResult.data?.length || 0,
        promptsForked: forksResult.data?.length || 0
      })

      // Load user's recent prompts
      const { data: userPrompts, error: userPromptsError } = await supabase
        .from('prompts')
        .select('id, title, status, created_at, problem_id')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      console.log('User prompts query:', { data: userPrompts?.length, error: userPromptsError })

      // Fetch stats separately for user prompts
      if (userPrompts && userPrompts.length > 0) {
        // Get problems for user prompts
        const problemIds = [...new Set(userPrompts.map(p => p.problem_id).filter(Boolean))]
        const { data: problemsData } = await supabase
          .from('problems')
          .select('id, title')
          .in('id', problemIds)

        const promptIds = userPrompts.map(p => p.id)
        const { data: statsData } = await supabase
          .from('prompt_stats')
          .select('*')
          .in('prompt_id', promptIds)

        // Attach stats and problems to prompts
        const promptsWithStats = userPrompts.map(prompt => {
          const stats = statsData?.find(s => s.prompt_id === prompt.id)
          const problem = problemsData?.find(p => p.id === prompt.problem_id)
          return {
            ...prompt,
            problems: problem ? { title: problem.title } : null,
            prompt_stats: stats ? [stats] : [{
              upvotes: 0,
              downvotes: 0,
              score: 0,
              copy_count: 0,
              view_count: 0,
              fork_count: 0
            }]
          }
        })

        setMyPrompts(promptsWithStats)
      } else {
        setMyPrompts([])
      }

      // Load top-rated prompts from the platform
      const { data: topPromptsData, error: topPromptsError } = await supabase
        .from('prompts')
        .select('id, title, system_prompt, model, created_at, parent_prompt_id, notes, problem_id')
        .eq('is_listed', true)
        .eq('is_hidden', false)
        .eq('visibility', 'public')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(5)

      console.log('Top prompts query:', { data: topPromptsData?.length, error: topPromptsError })

      if (topPromptsData && topPromptsData.length > 0) {
        // Get problems for top prompts
        const problemIds = [...new Set(topPromptsData.map(p => p.problem_id).filter(Boolean))]
        const { data: problemsData } = await supabase
          .from('problems')
          .select('id, title, slug')
          .in('id', problemIds)

        const promptIds = topPromptsData.map(p => p.id)
        const { data: statsData } = await supabase
          .from('prompt_stats')
          .select('*')
          .in('prompt_id', promptIds)

        // Attach stats and problems to prompts and sort by upvotes
        const promptsWithStats = topPromptsData.map(prompt => {
          const stats = statsData?.find(s => s.prompt_id === prompt.id)
          const problem = problemsData?.find(p => p.id === prompt.problem_id)
          return {
            ...prompt,
            problems: problem ? { title: problem.title, slug: problem.slug } : null,
            prompt_stats: stats ? [stats] : [{
              upvotes: 0,
              downvotes: 0,
              score: 0,
              copy_count: 0,
              view_count: 0,
              fork_count: 0
            }]
          }
        }).sort((a, b) => {
          const aUpvotes = a.prompt_stats[0]?.upvotes || 0
          const bUpvotes = b.prompt_stats[0]?.upvotes || 0
          return bUpvotes - aUpvotes
        })

        setTopPrompts(promptsWithStats)
      } else {
        setTopPrompts([])
      }

      setLoading(false)
    }

    loadDashboardData()
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome to your Promptvexity dashboard</p>
          
          {user ? (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700">✅ Welcome back, {user.email}!</p>
            </div>
          ) : (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">❌ No user session found</p>
              <Link href="/login" className="text-blue-600 underline">Go to Login</Link>
            </div>
          )}
        </div>

        {user && (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{stats.problemsCreated}</div>
                    <div className="text-sm text-gray-600">Problems Created</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{stats.promptsSubmitted}</div>
                    <div className="text-sm text-gray-600">Prompts Submitted</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{stats.votesCast}</div>
                    <div className="text-sm text-gray-600">Votes Cast</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{stats.promptsForked}</div>
                    <div className="text-sm text-gray-600">Prompts Forked</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Link
                href="/create/problem"
                className="block p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold">Create Problem</h3>
                </div>
                <p className="text-gray-600">Define a new coding problem for the community to solve</p>
              </Link>

              <Link
                href="/problems"
                className="block p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold">Browse Problems</h3>
                </div>
                <p className="text-gray-600">Explore existing problems and their prompt solutions</p>
              </Link>

              <Link
                href="/compare"
                className="block p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold">Compare Prompts</h3>
                </div>
                <p className="text-gray-600">Side-by-side comparison of different prompt approaches</p>
              </Link>
            </div>

            {/* My Recent Prompts */}
            {myPrompts.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">My Recent Prompts</h2>
                  <Link href="/create/prompt" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    Create New →
                  </Link>
                </div>
                <div className="space-y-4">
                  {myPrompts.map((prompt) => (
                    <div key={prompt.id} className={`p-4 border rounded-lg hover:bg-gray-50 ${prompt.parent_prompt_id ? 'border-l-4 border-l-orange-400' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {prompt.parent_prompt_id && (
                              <div className="flex items-center gap-1 text-orange-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                                </svg>
                                <span className="text-xs font-medium bg-orange-100 px-2 py-1 rounded">Fork</span>
                              </div>
                            )}
                            <Link 
                              href={`/prompts/${prompt.id}`}
                              className="font-medium text-gray-900 hover:text-blue-600"
                            >
                              {prompt.title}
                            </Link>
                            {prompt.status === 'draft' && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                                Draft
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {prompt.problems?.title} • {new Date(prompt.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>↑ {prompt.prompt_stats?.[0]?.upvotes || 0}</span>
                          <span>↓ {prompt.prompt_stats?.[0]?.downvotes || 0}</span>
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                            </svg>
                            {prompt.prompt_stats?.[0]?.fork_count || 0}
                          </span>
                          <Link 
                            href={`/prompts/${prompt.id}/edit`}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            Edit
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Rated Prompts Section */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Top Rated Prompts</h2>
                <Link href="/prompts?sort=top" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View All →
                </Link>
              </div>
              
              {topPrompts.length > 0 ? (
                <div className="space-y-4">
                  {topPrompts.map((prompt) => (
                    <div key={prompt.id} className={`p-4 border rounded-lg hover:bg-gray-50 ${prompt.parent_prompt_id ? 'border-l-4 border-l-orange-400' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {prompt.parent_prompt_id && (
                              <div className="flex items-center gap-1 text-orange-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                                </svg>
                                <span className="text-xs font-medium bg-orange-100 px-2 py-1 rounded">Fork</span>
                              </div>
                            )}
                            <Link 
                              href={`/prompts/${prompt.id}`}
                              className="font-medium text-gray-900 hover:text-blue-600"
                            >
                              {prompt.title}
                            </Link>
                          </div>
                          <p className="text-sm text-gray-600">
                            {prompt.problems?.title} • {new Date(prompt.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="text-green-600">↑ {prompt.prompt_stats?.[0]?.upvotes || 0}</span>
                          <span className="text-red-600">↓ {prompt.prompt_stats?.[0]?.downvotes || 0}</span>
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                            </svg>
                            {prompt.prompt_stats?.[0]?.fork_count || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No top rated prompts yet</h3>
                  <p className="text-gray-600 mb-4">Be the first to create and vote on prompts!</p>
                  <Link 
                    href="/create/prompt"
                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Prompt
                  </Link>
                </div>
              )}
            </div>

            {/* Getting Started Section (only show if user has no activity) */}
            {stats.problemsCreated === 0 && stats.promptsSubmitted === 0 && (
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 text-sm font-medium">1</span>
                    </div>
                    <div>
                      <h3 className="font-medium">Create Your First Problem</h3>
                      <p className="text-gray-600 text-sm">Define a coding challenge that needs AI prompt solutions</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-600 text-sm font-medium">2</span>
                    </div>
                    <div>
                      <h3 className="font-medium">Browse Existing Problems</h3>
                      <p className="text-gray-600 text-sm">Explore problems created by the community and add your prompt solutions</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-purple-600 text-sm font-medium">3</span>
                    </div>
                    <div>
                      <h3 className="font-medium">Compare & Vote</h3>
                      <p className="text-gray-600 text-sm">Compare different approaches and vote on the best solutions</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-center">
              <button
                onClick={handleSignOut}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
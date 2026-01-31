'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { toast } from 'sonner'

export default function ComparePage() {
  const [prompts, setPrompts] = useState<any[]>([])
  const [problem, setProblem] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [userVotes, setUserVotes] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      // Get user
      const supabase = createClient()
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)

      // Get prompt IDs from localStorage or URL
      const urlParams = new URLSearchParams(window.location.search)
      const urlIds = urlParams.get('ids')?.split(',') || []
      const storageIds = JSON.parse(localStorage.getItem('comparePrompts') || '[]')
      const promptIds = [...new Set([...urlIds, ...storageIds])].filter(Boolean)

      console.log('Compare page - URL IDs:', urlIds)
      console.log('Compare page - Storage IDs:', storageIds)
      console.log('Compare page - Final prompt IDs:', promptIds)
      console.log('Compare page - localStorage raw:', localStorage.getItem('comparePrompts'))

      if (promptIds.length === 0) {
        console.log('No prompt IDs found for comparison')
        setLoading(false)
        return
      }

      // Fetch prompts client-side using separate queries to avoid relationship issues
      const { data: promptsData, error: promptsError } = await supabase
        .from('prompts')
        .select('*')
        .in('id', promptIds)

      console.log('Compare prompts query:', { data: promptsData?.length, error: promptsError })

      if (promptsError) {
        console.error('Error loading prompts for comparison:', promptsError)
        setLoading(false)
        return
      }

      if (promptsData && promptsData.length > 0) {
        // Get problems separately
        const problemIds = [...new Set(promptsData.map(p => p.problem_id).filter(Boolean))]
        const { data: problemsData } = await supabase
          .from('problems')
          .select('id, title, goal, inputs, constraints, success_criteria')
          .in('id', problemIds)

        // Fetch stats separately
        const { data: statsData } = await supabase
          .from('prompt_stats')
          .select('*')
          .in('prompt_id', promptIds)

        // Attach stats and problems to prompts
        const promptsWithData = promptsData.map(prompt => {
          const stats = statsData?.find(s => s.prompt_id === prompt.id)
          const problem = problemsData?.find(p => p.id === prompt.problem_id)
          return {
            ...prompt,
            problems: problem,
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

        setPrompts(promptsWithData)

        // Set problem data from the first prompt (assuming all prompts are for the same problem)
        if (promptsWithData.length > 0 && promptsWithData[0].problems) {
          setProblem(promptsWithData[0].problems)
        }
      } else {
        setPrompts([])
      }

      // Get user votes if logged in
      if (currentUser && promptIds.length > 0) {
        const { data: votesData } = await supabase
          .from('votes')
          .select('prompt_id, value')
          .eq('user_id', currentUser.id)
          .in('prompt_id', promptIds)

        const votes: Record<string, number> = {}
        votesData?.forEach(vote => {
          votes[vote.prompt_id] = vote.value
        })
        setUserVotes(votes)
      }

      setLoading(false)
    }

    loadData()
  }, [])

  const handleVote = async (promptId: string, value: 1 | -1) => {
    if (!user) {
      toast('Please log in to vote')
      return
    }

    try {
      const supabase = createClient()

      if (userVotes[promptId] === value) {
        // Clear vote
        console.log('Clearing vote for prompt:', promptId, 'user:', user.id)
        const { error } = await supabase
          .from('votes')
          .delete()
          .eq('prompt_id', promptId)
          .eq('user_id', user.id)

        if (error) {
          console.error('Failed to clear vote:', error)
          toast.error('Could not clear vote')
          return
        }

        setUserVotes(prev => ({ ...prev, [promptId]: 0 }))
        console.log('Vote cleared successfully')

        // Skip RPC call since it may not be available on hosted instance
      } else {
        // Check if vote exists first
        console.log('Setting vote for prompt:', promptId, 'user:', user.id, 'value:', value)

        const { data: existingVote, error: voteError } = await supabase
          .from('votes')
          .select('*')
          .eq('prompt_id', promptId)
          .eq('user_id', user.id)
          .maybeSingle()

        let error = null

        if (voteError) {
          console.error('Error checking existing vote:', voteError)
        }

        if (existingVote) {
          // Update existing vote
          console.log('Updating existing vote')
          const result = await supabase
            .from('votes')
            .update({ value })
            .eq('prompt_id', promptId)
            .eq('user_id', user.id)
          error = result.error
        } else {
          // Insert new vote
          console.log('Inserting new vote')
          const result = await supabase
            .from('votes')
            .insert({
              prompt_id: promptId,
              user_id: user.id,
              value
            })
          error = result.error
        }

        if (error) {
          console.error('Failed to vote:', error)
          toast.error('Could not record vote')
          return
        }

        // Vote stats are updated by database triggers automatically

        setUserVotes(prev => ({ ...prev, [promptId]: value }))
        console.log('Vote set successfully')

        // Skip RPC call since it may not be available on hosted instance
      }
    } catch (error) {
      console.error('Vote failed:', error)
      toast.error('Vote failed')
    }
  }

  const clearComparison = () => {
    localStorage.removeItem('comparePrompts')
    setPrompts([])
  }

  // Helper function to safely render content that might be an object
  const renderContent = (content: any) => {
    if (typeof content === 'string') {
      return content
    } else if (typeof content === 'object' && content !== null) {
      return JSON.stringify(content, null, 2)
    }
    return String(content || '')
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading comparison...</div>
      </div>
    )
  }

  if (prompts.length === 0) {
    const storageIds = JSON.parse(localStorage.getItem('comparePrompts') || '[]')

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Compare Prompts</h1>
          {storageIds.length > 0 ? (
            <div>
              <p className="text-gray-600 mb-4">
                Found {storageIds.length} prompt(s) in comparison, but couldn't load them from the database.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                This might be due to deleted prompts or permission issues.
              </p>
              <button
                onClick={() => {
                  localStorage.removeItem('comparePrompts')
                  window.location.reload()
                }}
                className="inline-block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors mr-4"
              >
                Clear Comparison
              </button>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">
                No prompts selected for comparison.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Browse problems and click "Compare" on prompts to add them here.
              </p>
            </div>
          )}
          <Link
            href="/problems"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Problems
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Compare Prompts</h1>
          <p className="text-gray-600">
            Side-by-side comparison of {prompts.length} prompts
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              // Add a test prompt for debugging
              const testIds = ['f73f7f17-0268-4630-bd9a-89088fc85370', 'faf187f0-2b00-4818-a237-bd655566fd11']
              localStorage.setItem('comparePrompts', JSON.stringify(testIds))
              window.dispatchEvent(new CustomEvent('compareUpdated'))
              window.location.reload()
            }}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Test Compare
          </button>
          <button
            onClick={clearComparison}
            className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Problem Context */}
      {problem && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Problem Goal */}
            <div className="lg:col-span-3">
              <h2 className="text-xl font-semibold text-blue-900 mb-2">
                Problem: {problem.title}
              </h2>
              {problem.goal && (
                <p className="text-blue-800 font-medium mb-4">
                  Goal: {problem.goal}
                </p>
              )}
            </div>

            {/* Expected Inputs */}
            {problem.inputs && problem.inputs.length > 0 && (
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Expected Inputs</h3>
                <ul className="space-y-1">
                  {problem.inputs.map((input: any, index: number) => (
                    <li key={index} className="text-sm text-blue-800">
                      <span className="font-medium">{input.name}</span>
                      {input.required && <span className="text-red-600 ml-1">*</span>}
                      <div className="text-blue-600 text-xs">{input.description}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Constraints */}
            {problem.constraints && problem.constraints.length > 0 && (
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Constraints</h3>
                <ul className="space-y-1">
                  {problem.constraints.map((constraint: any, index: number) => (
                    <li key={index} className="text-sm text-blue-800">
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${constraint.severity === 'hard' ? 'bg-red-500' : 'bg-yellow-500'
                        }`}></span>
                      {constraint.rule}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Success Criteria */}
            {problem.success_criteria && problem.success_criteria.length > 0 && (
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Success Criteria</h3>
                <ul className="space-y-1">
                  {problem.success_criteria.map((criterion: any, index: number) => (
                    <li key={index} className="text-sm text-blue-800">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                      {criterion.criterion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row overflow-x-auto divide-y lg:divide-y-0 lg:divide-x divide-gray-200 border border-gray-200 rounded-lg bg-white shadow-sm">
        {prompts.map((prompt) => {
          const stats = prompt.prompt_stats?.[0] || {
            upvotes: 0,
            downvotes: 0,
            score: 0,
            copy_count: 0,
            view_count: 0,
            fork_count: 0
          }

          return (
            <div key={prompt.id} className="flex-1 min-w-[320px] p-5 space-y-4 bg-white">
              {/* Header */}
              <div>
                <Link
                  href={`/prompts/${prompt.id}`}
                  className="text-lg font-semibold hover:text-blue-600 transition-colors"
                >
                  {prompt.title}
                </Link>
                <div className="text-sm text-gray-500 mt-1">
                  Model: {prompt.model}
                </div>
              </div>

              {/* Stats */}
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-0.5 text-green-600">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    {stats.upvotes}
                  </span>
                  <span className="flex items-center gap-0.5 text-red-600">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    {stats.downvotes}
                  </span>
                  <span className="text-gray-500 ml-1">Score: {stats.score}</span>
                </div>

                {user && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleVote(prompt.id, 1)}
                      className={`p-1 rounded transition-colors ${userVotes[prompt.id] === 1
                          ? 'bg-green-600 text-white'
                          : 'border border-green-600 text-green-600 hover:bg-green-50'
                        }`}
                      title="Vote Up"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleVote(prompt.id, -1)}
                      className={`p-1 rounded transition-colors ${userVotes[prompt.id] === -1
                          ? 'bg-red-600 text-white'
                          : 'border border-red-600 text-red-600 hover:bg-red-50'
                        }`}
                      title="Vote Down"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* System Prompt */}
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">System Prompt</div>
                <div className="bg-gray-50 p-3 rounded text-xs font-mono max-h-48 overflow-y-auto">
                  {renderContent(prompt.system_prompt)}
                </div>
              </div>

              {/* User Template */}
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">User Template</div>
                <div className="bg-gray-50 p-3 rounded text-xs font-mono max-h-32 overflow-y-auto">
                  {renderContent(prompt.user_prompt_template)}
                </div>
              </div>

              {/* Example I/O */}
              {(prompt.example_input || prompt.example_output) && (
                <div className="space-y-2">
                  {prompt.example_input && (
                    <div>
                      <div className="text-xs font-medium text-gray-700 mb-1">Example Input</div>
                      <div className="bg-blue-50 p-2 rounded text-xs font-mono max-h-24 overflow-y-auto">
                        {renderContent(prompt.example_input)}
                      </div>
                    </div>
                  )}

                  {prompt.example_output && (
                    <div>
                      <div className="text-xs font-medium text-gray-700 mb-1">Example Output</div>
                      <div className="bg-green-50 p-2 rounded text-xs font-mono max-h-24 overflow-y-auto">
                        {renderContent(prompt.example_output)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Usage Stats */}
              <div className="text-xs text-gray-500 space-y-1">
                <div className="flex justify-between">
                  <span>Views:</span>
                  <span>{stats.view_count}</span>
                </div>
                <div className="flex justify-between">
                  <span>Copies:</span>
                  <span>{stats.copy_count}</span>
                </div>
                <div className="flex justify-between">
                  <span>Forks:</span>
                  <span>{stats.fork_count}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                {user && (
                  <button
                    onClick={() => {
                      // Simple client-side fork - just redirect to create prompt with pre-filled data
                      const params = new URLSearchParams({
                        fork: prompt.id,
                        problem: prompt.problem_id || ''
                      })
                      window.location.href = `/create/prompt?${params.toString()}`
                    }}
                    className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  >
                    Fork
                  </button>
                )}

                <Link
                  href={`/prompts/${prompt.id}`}
                  className="flex-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-center"
                >
                  View Details
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ComparePage() {
  const [prompts, setPrompts] = useState<any[]>([])
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

      if (promptIds.length === 0) {
        setLoading(false)
        return
      }

      // Fetch prompts client-side
      const { data: promptsData } = await supabase
        .from('prompts')
        .select(`
          *,
          prompt_stats (
            upvotes,
            downvotes,
            score,
            copy_count,
            view_count,
            fork_count
          )
        `)
        .in('id', promptIds)

      setPrompts(promptsData || [])

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
      alert('Please log in to vote')
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
          alert(`Failed to clear vote: ${error.message || JSON.stringify(error)}`)
          return
        }

        setUserVotes(prev => ({ ...prev, [promptId]: 0 }))
        console.log('Vote cleared successfully')
        
        // Skip RPC call since it may not be available on hosted instance
      } else {
        // Check if vote exists first
        console.log('Setting vote for prompt:', promptId, 'user:', user.id, 'value:', value)
        
        const { data: existingVote } = await supabase
          .from('votes')
          .select('*')
          .eq('prompt_id', promptId)
          .eq('user_id', user.id)
          .single()

        let error = null

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
          alert(`Failed to vote: ${error.message || JSON.stringify(error)}`)
          return
        }

        // Track vote event (don't fail if this fails)
        try {
          await supabase
            .from('prompt_events')
            .insert({
              prompt_id: promptId,
              user_id: user.id,
              event_type: value === 1 ? 'vote_up' : 'vote_down'
            })
        } catch (eventError) {
          console.warn('Failed to track vote event:', eventError)
        }

        setUserVotes(prev => ({ ...prev, [promptId]: value }))
        console.log('Vote set successfully')
        
        // Skip RPC call since it may not be available on hosted instance
      }
    } catch (error) {
      console.error('Vote failed:', error)
      alert(`Vote failed: ${error instanceof Error ? error.message : JSON.stringify(error)}`)
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
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Compare Prompts</h1>
          <p className="text-gray-600 mb-6">
            No prompts selected for comparison. Browse problems and add prompts to compare.
          </p>
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
        
        <button
          onClick={clearComparison}
          className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
        >
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
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
            <div key={prompt.id} className="bg-white border rounded-lg p-6 space-y-4">
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
                <div className="flex items-center gap-2">
                  <span className="text-green-600">↑{stats.upvotes}</span>
                  <span className="text-red-600">↓{stats.downvotes}</span>
                  <span className="text-gray-500">Score: {stats.score}</span>
                </div>
                
                {user && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleVote(prompt.id, 1)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        userVotes[prompt.id] === 1
                          ? 'bg-green-600 text-white'
                          : 'border border-green-600 text-green-600 hover:bg-green-50'
                      }`}
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => handleVote(prompt.id, -1)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        userVotes[prompt.id] === -1
                          ? 'bg-red-600 text-white'
                          : 'border border-red-600 text-red-600 hover:bg-red-50'
                      }`}
                    >
                      ↓
                    </button>
                  </div>
                )}
              </div>

              {/* System Prompt */}
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">System Prompt</div>
                <div className="bg-gray-50 p-3 rounded text-xs font-mono max-h-32 overflow-y-auto">
                  {renderContent(prompt.system_prompt)}
                </div>
              </div>

              {/* User Template */}
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">User Template</div>
                <div className="bg-gray-50 p-3 rounded text-xs font-mono max-h-24 overflow-y-auto">
                  {renderContent(prompt.user_prompt_template)}
                </div>
              </div>

              {/* Example I/O */}
              {(prompt.example_input || prompt.example_output) && (
                <div className="space-y-2">
                  {prompt.example_input && (
                    <div>
                      <div className="text-xs font-medium text-gray-700 mb-1">Example Input</div>
                      <div className="bg-blue-50 p-2 rounded text-xs font-mono max-h-20 overflow-y-auto">
                        {renderContent(prompt.example_input)}
                      </div>
                    </div>
                  )}
                  
                  {prompt.example_output && (
                    <div>
                      <div className="text-xs font-medium text-gray-700 mb-1">Example Output</div>
                      <div className="bg-green-50 p-2 rounded text-xs font-mono max-h-20 overflow-y-auto">
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
                    className="flex-1 px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  >
                    Fork
                  </button>
                )}
                
                <Link
                  href={`/prompts/${prompt.id}`}
                  className="flex-1 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-center"
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
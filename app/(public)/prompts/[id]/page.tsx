'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import ForkModal from '@/components/prompts/ForkModal'
import ForkLineage from '@/components/prompts/ForkLineage'
import ReportModal from '@/components/moderation/ReportModal'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

export default function PromptDetailPage() {
  const params = useParams()
  const router = useRouter()
  const promptId = params.id as string
  
  const [prompt, setPrompt] = useState<any>(null)
  const [userVote, setUserVote] = useState<number | null>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showForkModal, setShowForkModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)

  useEffect(() => {
    const loadInitialData = async () => {
      await loadData()

      // Track view event client-side
      if (user) {
        const supabase = createClient()
        
        // Insert view event
        try {
          await supabase
            .from('prompt_events')
            .insert({
              prompt_id: promptId,
              user_id: user.id,
              event_type: 'view'
            })
        } catch (eventError) {
          console.warn('Failed to track view event:', eventError)
        }

        // Update view count using RPC function
        try {
          await supabase.rpc('increment_view_count', { prompt_id: promptId })
        } catch (rpcError) {
          console.warn('RPC failed for view count:', rpcError)
        }
      }

      setLoading(false)
    }

    loadInitialData()
  }, [promptId])

  const handleVote = async (value: 1 | -1) => {
    if (!user) {
      alert('Please log in to vote')
      return
    }

    try {
      const supabase = createClient()

      if (userVote === value) {
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

        setUserVote(null)
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
          console.error('Error details:', JSON.stringify(error, null, 2))
          alert(`Failed to vote: ${error.message || 'Unknown error'}`)
          return
        }

        // Track vote event
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

        setUserVote(value)
      }

      // Note: Vote stats are updated by database triggers automatically
      // Wait a moment for the trigger to complete, then refresh the data
      setTimeout(async () => {
        await loadData()
      }, 500)
    } catch (error) {
      console.error('Vote failed:', error)
      alert(`Vote failed: ${error instanceof Error ? error.message : JSON.stringify(error)}`)
    }
  }

  const loadData = async () => {
    const supabase = createClient()
    
    // Get user
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    setUser(currentUser)

    // Get prompt with fresh stats using separate queries to avoid relationship conflicts
    const { data: promptData, error: promptError } = await supabase
      .from('prompts')
      .select('*')
      .eq('id', promptId)
      .single()

    console.log('Prompt query result:', promptData)
    console.log('Prompt query error:', promptError)

    if (promptData) {
      // Fetch problem separately to avoid relationship conflicts
      let problemData = null
      if (promptData.problem_id) {
        const { data: problem } = await supabase
          .from('problems')
          .select('title, slug')
          .eq('id', promptData.problem_id)
          .single()
        problemData = problem
      }

      // Fetch stats separately to avoid nested query issues
      const { data: statsData, error: statsError } = await supabase
        .from('prompt_stats')
        .select('*')
        .eq('prompt_id', promptId)
        .single()
      
      console.log('Stats query result:', statsData)
      console.log('Stats query error:', statsError)
      
      if (statsData) {
        promptData.prompt_stats = [statsData]
      } else {
        // Create default stats if none exist
        promptData.prompt_stats = [{
          upvotes: 0,
          downvotes: 0,
          score: 0,
          copy_count: 0,
          view_count: 0,
          fork_count: 0
        }]
      }
      
      // Add problem data to prompt
      promptData.problems = problemData
      
      setPrompt(promptData)
    }

    // Get user's vote if logged in
    if (currentUser) {
      const { data: voteData, error: voteError } = await supabase
        .from('votes')
        .select('value')
        .eq('prompt_id', promptId)
        .eq('user_id', currentUser.id)
        .maybeSingle()

      if (voteError) {
        console.error('Error fetching user vote:', voteError)
      }
      
      setUserVote(voteData?.value || null)
    }
  }

  const handleCopy = async () => {
    const text = `${prompt.system_prompt}\n\n${prompt.user_prompt_template}`
    await navigator.clipboard.writeText(text)
    
    if (user) {
      // Track copy event client-side
      const supabase = createClient()
      
      // Insert copy event
      try {
        await supabase
          .from('prompt_events')
          .insert({
            prompt_id: promptId,
            user_id: user.id,
            event_type: 'copy'
          })
      } catch (eventError) {
        console.warn('Failed to track copy event:', eventError)
      }

      // Update copy count using RPC function
      try {
        await supabase.rpc('increment_copy_count', { prompt_id: promptId })
      } catch (rpcError) {
        console.warn('RPC failed for copy count:', rpcError)
      }
    }
    
    alert('Prompt copied to clipboard!')
  }

  const handleForkSuccess = (newPromptId: string) => {
    // Redirect to edit the new forked prompt
    router.push(`/prompts/${newPromptId}/edit`)
  }

  const handleAddToCompare = () => {
    const selected = JSON.parse(localStorage.getItem('comparePrompts') || '[]')
    if (!selected.includes(promptId)) {
      selected.push(promptId)
      localStorage.setItem('comparePrompts', JSON.stringify(selected))
      alert('Added to comparison!')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!prompt) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Prompt not found</div>
      </div>
    )
  }

  const stats = prompt.prompt_stats?.[0] || {
    upvotes: 0,
    downvotes: 0,
    score: 0,
    copy_count: 0,
    view_count: 0,
    fork_count: 0
  }

  console.log('Prompt data:', prompt)
  console.log('Stats data:', stats)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/problems" className="hover:text-gray-700">Problems</Link>
        <span>/</span>
        <Link 
          href={`/problems/${prompt.problems?.slug}`} 
          className="hover:text-gray-700"
        >
          {prompt.problems?.title}
        </Link>
        <span>/</span>
        <span>{prompt.title}</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">{prompt.title}</h1>
        
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-gray-500">
            Model: {prompt.model} • Created {new Date(prompt.created_at).toLocaleDateString()}
            {prompt.status === 'draft' && (
              <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                Draft
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {/* Vote buttons */}
            {user && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleVote(1)}
                  className={`px-3 py-1 rounded transition-colors ${
                    userVote === 1
                      ? 'bg-green-600 text-white'
                      : 'border border-green-600 text-green-600 hover:bg-green-50'
                  }`}
                >
                  ↑ {stats.upvotes}
                </button>
                <button
                  onClick={() => handleVote(-1)}
                  className={`px-3 py-1 rounded transition-colors ${
                    userVote === -1
                      ? 'bg-red-600 text-white'
                      : 'border border-red-600 text-red-600 hover:bg-red-50'
                  }`}
                >
                  ↓ {stats.downvotes}
                </button>
              </div>
            )}
            
            <div className="text-sm text-gray-500">
              Score: {stats.score}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Copy Prompt
          </button>
          
          {user && (
            <button
              onClick={() => setShowForkModal(true)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Fork
            </button>
          )}
          
          <button
            onClick={handleAddToCompare}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Add to Compare
          </button>

          <button
            onClick={() => setShowReportModal(true)}
            className="px-3 py-2 text-gray-500 hover:text-red-600 transition-colors"
            title="Report this prompt"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* System Prompt */}
          <div>
            <h3 className="text-lg font-semibold mb-3">System Prompt</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="whitespace-pre-wrap font-mono text-sm">
                {prompt.system_prompt}
              </pre>
            </div>
          </div>

          {/* User Prompt Template */}
          <div>
            <h3 className="text-lg font-semibold mb-3">User Prompt Template</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="whitespace-pre-wrap font-mono text-sm">
                {prompt.user_prompt_template}
              </pre>
            </div>
          </div>

          {/* Example Input/Output */}
          {(prompt.example_input || prompt.example_output) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {prompt.example_input && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Example Input</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap font-mono text-sm">
                      {prompt.example_input}
                    </pre>
                  </div>
                </div>
              )}
              
              {prompt.example_output && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Example Output</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap font-mono text-sm">
                      {prompt.example_output}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {prompt.notes && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Notes</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm">{prompt.notes}</p>
              </div>
            </div>
          )}

          {/* Fork Lineage */}
          <ForkLineage 
            promptId={promptId} 
            parentPromptId={prompt.parent_prompt_id}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Model Parameters */}
          {prompt.params && Object.keys(prompt.params).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Parameters</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-sm">
                  {JSON.stringify(prompt.params, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Stats */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Statistics</h3>
            <div className="bg-white border rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Views</span>
                <span className="font-medium">{stats.view_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Copies</span>
                <span className="font-medium">{stats.copy_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Forks</span>
                <span className="font-medium">{stats.fork_count}</span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="text-gray-600">Total Score</span>
                <span className="font-bold">{stats.score}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fork Modal */}
      <ForkModal
        isOpen={showForkModal}
        onClose={() => setShowForkModal(false)}
        promptId={promptId}
        onSuccess={handleForkSuccess}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        contentType="prompt"
        contentId={promptId}
        contentTitle={prompt.title}
      />
    </div>
  )
}
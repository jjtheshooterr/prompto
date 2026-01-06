'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { trackPromptEvent } from '@/lib/actions/events.actions'
import { setVote, clearVote, getUserVote } from '@/lib/actions/votes.actions'
import { forkPrompt } from '@/lib/actions/prompts.actions'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function PromptDetailPage() {
  const params = useParams()
  const promptId = params.id as string
  
  const [prompt, setPrompt] = useState<any>(null)
  const [userVote, setUserVote] = useState<number | null>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      
      // Get user
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)

      // Get prompt
      const { data: promptData } = await supabase
        .from('prompts')
        .select(`
          *,
          problems (title, slug),
          prompt_stats (
            upvotes,
            downvotes,
            score,
            copy_count,
            view_count,
            fork_count
          )
        `)
        .eq('id', promptId)
        .single()

      setPrompt(promptData)

      // Get user's vote if logged in
      if (currentUser) {
        const vote = await getUserVote(promptId)
        setUserVote(vote)
      }

      // Track view event
      if (currentUser) {
        await trackPromptEvent(promptId, 'view')
      }

      setLoading(false)
    }

    loadData()
  }, [promptId])

  const handleVote = async (value: 1 | -1) => {
    if (!user) return

    try {
      if (userVote === value) {
        await clearVote(promptId)
        setUserVote(null)
      } else {
        await setVote(promptId, value)
        setUserVote(value)
      }
    } catch (error) {
      console.error('Vote failed:', error)
    }
  }

  const handleCopy = async () => {
    const text = `${prompt.system_prompt}\n\n${prompt.user_prompt_template}`
    await navigator.clipboard.writeText(text)
    
    if (user) {
      await trackPromptEvent(promptId, 'copy')
    }
    
    alert('Prompt copied to clipboard!')
  }

  const handleFork = async () => {
    if (!user) return

    try {
      const forkedPrompt = await forkPrompt(promptId)
      window.location.href = `/prompts/${forkedPrompt.id}`
    } catch (error) {
      console.error('Fork failed:', error)
    }
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
              onClick={handleFork}
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
    </div>
  )
}
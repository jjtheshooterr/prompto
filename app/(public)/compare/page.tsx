'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { toast } from 'sonner'

function renderContent(content: any): string {
  if (typeof content === 'string') return content
  if (typeof content === 'object' && content !== null) return JSON.stringify(content, null, 2)
  return String(content || '')
}

export default function ComparePage() {
  const [prompts, setPrompts] = useState<any[]>([])
  const [problem, setProblem] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [userVotes, setUserVotes] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)

      const urlParams = new URLSearchParams(window.location.search)
      const urlIds = urlParams.get('ids')?.split(',') || []
      const storageIds = JSON.parse(localStorage.getItem('comparePrompts') || '[]')
      const promptIds = [...new Set([...urlIds, ...storageIds])].filter(Boolean)

      if (promptIds.length === 0) { setLoading(false); return }

      const { data: promptsData, error: promptsError } = await supabase
        .from('prompts').select('*').in('id', promptIds)

      if (promptsError || !promptsData || promptsData.length === 0) { setLoading(false); return }

      const problemIds = [...new Set(promptsData.map((p: any) => p.problem_id).filter(Boolean))]
      const [{ data: problemsData }, { data: statsData }] = await Promise.all([
        supabase.from('problems').select('id, title, goal, inputs, constraints, success_criteria').in('id', problemIds),
        supabase.from('prompt_stats').select('*').in('prompt_id', promptIds),
      ])

      const promptsWithData = promptsData.map((prompt: any) => {
        const stats = statsData?.find((s: any) => s.prompt_id === prompt.id)
        const pb = problemsData?.find((p: any) => p.id === prompt.problem_id)
        return {
          ...prompt, problems: pb,
          prompt_stats: stats ? [stats] : [{ upvotes: 0, downvotes: 0, score: 0, copy_count: 0, view_count: 0, fork_count: 0 }]
        }
      })

      setPrompts(promptsWithData)
      if (promptsWithData.length > 0 && promptsWithData[0].problems) setProblem(promptsWithData[0].problems)

      if (currentUser) {
        const { data: votesData } = await supabase.from('votes').select('prompt_id, value').eq('user_id', currentUser.id).in('prompt_id', promptIds)
        const votes: Record<string, number> = {}
        votesData?.forEach((v: any) => { votes[v.prompt_id] = v.value })
        setUserVotes(votes)
      }

      setLoading(false)
    }
    loadData()
  }, [])

  const handleVote = async (promptId: string, value: 1 | -1) => {
    if (!user) { toast('Please log in to vote'); return }
    const supabase = createClient()
    if (userVotes[promptId] === value) {
      await supabase.from('votes').delete().eq('prompt_id', promptId).eq('user_id', user.id)
      setUserVotes(prev => ({ ...prev, [promptId]: 0 }))
    } else {
      const { data: existing } = await supabase.from('votes').select('id').eq('prompt_id', promptId).eq('user_id', user.id).maybeSingle()
      const { error } = existing
        ? await supabase.from('votes').update({ value }).eq('prompt_id', promptId).eq('user_id', user.id)
        : await supabase.from('votes').insert({ prompt_id: promptId, user_id: user.id, value })
      if (error) { toast.error('Could not record vote'); return }
      setUserVotes(prev => ({ ...prev, [promptId]: value }))
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Compare Prompts</h1>

      {!loading && prompts.length > 0 && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Manual Comparison</h2>
            <button
              onClick={() => { localStorage.removeItem('comparePrompts'); setPrompts([]) }}
              className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
            >
              Clear Selection
            </button>
          </div>

          {/* Problem context */}
          {problem && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-1">Problem: {problem.title}</h3>
              {problem.goal && <p className="text-blue-800 text-sm">{problem.goal}</p>}
            </div>
          )}

          <div className="flex flex-col lg:flex-row overflow-x-auto divide-y lg:divide-y-0 lg:divide-x divide-gray-200 border border-gray-200 rounded-lg bg-white shadow-sm">
            {prompts.map((prompt: any) => {
              const stats = prompt.prompt_stats?.[0] || { upvotes: 0, downvotes: 0, score: 0, copy_count: 0, view_count: 0, fork_count: 0 }
              return (
                <div key={prompt.id} className="flex-1 min-w-[320px] p-5 space-y-4 bg-white">
                  <div>
                    <Link href={`/prompts/${prompt.id}`} className="text-lg font-semibold hover:text-blue-600 transition-colors">
                      {prompt.title}
                    </Link>
                    <div className="text-sm text-gray-500 mt-1">Model: {prompt.model}</div>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-green-600">↑{stats.upvotes}</span>
                      <span className="text-red-600">↓{stats.downvotes}</span>
                      <span className="text-gray-500">Score: {stats.score}</span>
                    </div>
                    {user && (
                      <div className="flex gap-1">
                        {([1, -1] as const).map(v => (
                          <button
                            key={v}
                            onClick={() => handleVote(prompt.id, v)}
                            className={`p-1 rounded transition-colors text-xs border ${userVotes[prompt.id] === v
                              ? (v === 1 ? 'bg-green-600 text-white border-green-600' : 'bg-red-600 text-white border-red-600')
                              : (v === 1 ? 'border-green-600 text-green-600 hover:bg-green-50' : 'border-red-600 text-red-600 hover:bg-red-50')
                              }`}
                          >
                            {v === 1 ? '▲' : '▼'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">System Prompt</div>
                    <div className="bg-gray-50 p-3 rounded text-xs font-mono max-h-48 overflow-y-auto">{renderContent(prompt.system_prompt)}</div>
                  </div>

                  {prompt.user_prompt_template && (
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">User Template</div>
                      <div className="bg-gray-50 p-3 rounded text-xs font-mono max-h-28 overflow-y-auto">{renderContent(prompt.user_prompt_template)}</div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    {user && (
                      <Link
                        href={`/create/prompt?fork=${prompt.id}&problem=${prompt.problem_id}`}
                        className="flex-1 px-3 py-1.5 text-xs border border-orange-400 text-orange-600 rounded hover:bg-orange-50 transition-colors text-center"
                      >
                        Fork
                      </Link>
                    )}
                    <Link href={`/prompts/${prompt.id}`} className="flex-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-center">
                      View Details
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {!loading && prompts.length === 0 && (
        <div className="text-center py-8 text-sm text-gray-500">
          <p className="mb-3">No prompts in your comparison queue.</p>
          <p>Browse problems and click <strong>Compare</strong> on any prompt card.</p>
          <Link href="/problems" className="mt-4 inline-block px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
            Browse Problems
          </Link>
        </div>
      )}
    </div>
  )
}
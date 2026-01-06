'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PromptCardProps {
  prompt: any
  onAddToCompare?: (promptId: string) => void
  showProblemTitle?: boolean
}

interface ParentPrompt {
  id: string
  title: string
}

export default function PromptCard({ prompt, onAddToCompare, showProblemTitle = false }: PromptCardProps) {
  const [parentPrompt, setParentPrompt] = useState<ParentPrompt | null>(null)

  const stats = prompt.prompt_stats?.[0] || {
    upvotes: 0,
    downvotes: 0,
    score: 0,
    copy_count: 0,
    view_count: 0,
    fork_count: 0
  }

  // Extract fork reason and changes summary from notes if this is a fork
  const getForkDetails = () => {
    if (!prompt.parent_prompt_id || !prompt.notes) return { reason: null, changes: null }
    
    // Extract the reason and changes from "Forked from {id}. {reason} | Changes: {changes}"
    const match = prompt.notes.match(/^Forked from [^.]+\.\s*([^|]+)(?:\s*\|\s*Changes:\s*(.+))?$/)
    if (match) {
      return {
        reason: match[1]?.trim() || null,
        changes: match[2]?.trim() || null
      }
    }
    
    // Fallback for old format
    const oldMatch = prompt.notes.match(/^Forked from [^.]+\.\s*(.+)$/)
    return {
      reason: oldMatch ? oldMatch[1] : null,
      changes: null
    }
  }

  const forkDetails = getForkDetails()

  useEffect(() => {
    const loadParentPrompt = async () => {
      if (!prompt.parent_prompt_id) return

      const supabase = createClient()
      const { data } = await supabase
        .from('prompts')
        .select('id, title')
        .eq('id', prompt.parent_prompt_id)
        .single()

      if (data) {
        setParentPrompt(data)
      }
    }

    loadParentPrompt()
  }, [prompt.parent_prompt_id])

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${prompt.parent_prompt_id ? 'border-l-4 border-orange-400' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          {/* Fork indicator and title */}
          <div className="flex items-center gap-2 mb-1">
            {prompt.parent_prompt_id && (
              <div className="flex items-center gap-1 text-orange-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                <span className="text-xs font-medium bg-orange-100 px-2 py-1 rounded">Fork</span>
              </div>
            )}
          </div>

          <Link
            href={`/prompts/${prompt.id}`}
            className="text-xl font-semibold hover:text-blue-600 transition-colors block"
          >
            {prompt.title}
          </Link>

          {/* Fork reason and changes summary - the key addition! */}
          {forkDetails.reason && (
            <div className="mt-2 text-sm text-orange-700 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                <span className="font-medium">Forked to:</span>
                <span>{forkDetails.reason}</span>
              </div>
              {forkDetails.changes && (
                <div className="mt-2 text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded border border-orange-300">
                  <span className="font-medium">Changes:</span> {forkDetails.changes}
                </div>
              )}
              {parentPrompt && (
                <div className="mt-1 text-xs text-orange-600">
                  from <Link href={`/prompts/${parentPrompt.id}`} className="underline hover:text-orange-800">{parentPrompt.title}</Link>
                </div>
              )}
            </div>
          )}

          <div className="text-sm text-gray-500 mt-2">
            Model: {prompt.model} • {new Date(prompt.created_at).toLocaleDateString()}
            {showProblemTitle && prompt.problems?.title && (
              <>
                {' • '}
                <Link href={`/problems/${prompt.problems.slug}`} className="hover:text-gray-700">
                  {prompt.problems.title}
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <span className="text-green-600">↑{stats.upvotes}</span>
            <span className="text-red-600">↓{stats.downvotes}</span>
          </div>
          <div className="text-gray-500">
            Score: {stats.score}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-sm text-gray-600 mb-2">System Prompt:</div>
        <div className="bg-gray-50 p-3 rounded text-sm font-mono line-clamp-3">
          {prompt.system_prompt}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex gap-4 text-sm text-gray-500">
          <span>{stats.view_count} views</span>
          <span>{stats.copy_count} copies</span>
          {/* Show fork count with icon - Fix #3 */}
          {stats.fork_count > 0 && (
            <span className="flex items-center gap-1 text-orange-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              {stats.fork_count} forks
            </span>
          )}
        </div>

        <div className="flex gap-2">
          {onAddToCompare && (
            <button
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              onClick={() => onAddToCompare(prompt.id)}
            >
              Compare
            </button>
          )}
          <Link
            href={`/prompts/${prompt.id}`}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  )
}
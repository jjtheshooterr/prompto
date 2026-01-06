'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface ForkLineageProps {
  promptId: string
  parentPromptId?: string | null
}

interface Fork {
  id: string
  title: string
  created_at: string
  created_by: string
  notes?: string
  profiles?: {
    username: string
  } | null
}

interface ParentPrompt {
  id: string
  title: string
}

export default function ForkLineage({ promptId, parentPromptId }: ForkLineageProps) {
  const [forks, setForks] = useState<Fork[]>([])
  const [parentPrompt, setParentPrompt] = useState<ParentPrompt | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createClient()

        // Load forks of this prompt
        const { data: forksData } = await supabase
          .from('prompts')
          .select(`
            id,
            title,
            created_at,
            created_by,
            notes
          `)
          .eq('parent_prompt_id', promptId)
          .order('created_at', { ascending: false })
          .limit(10)

        if (forksData) {
          // Transform the data to match our interface - remove profiles lookup for now
          const transformedForks = forksData.map(fork => ({
            ...fork,
            profiles: null // Skip profiles lookup to avoid 400 errors
          }))
          setForks(transformedForks)
        }

        // Load parent prompt if this is a fork
        if (parentPromptId) {
          const { data: parentData } = await supabase
            .from('prompts')
            .select('id, title')
            .eq('id', parentPromptId)
            .single()

          if (parentData) {
            setParentPrompt(parentData)
          }
        }
      } catch (error) {
        console.error('Failed to load fork lineage:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [promptId, parentPromptId])

  if (loading) {
    return <div className="text-sm text-gray-500">Loading lineage...</div>
  }

  return (
    <div className="space-y-4">
      {/* Parent Link */}
      {parentPrompt && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-sm text-blue-600 font-medium mb-1">
            Forked from:
          </div>
          <Link 
            href={`/prompts/${parentPromptId}`}
            className="text-blue-700 hover:text-blue-800 font-medium"
          >
            {parentPrompt.title}
          </Link>
        </div>
      )}

      {/* Forks List */}
      {forks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">
            Forks ({forks.length})
          </h3>
          <div className="space-y-2">
            {forks.map((fork) => (
              <div key={fork.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1 text-orange-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                        </svg>
                        <span className="text-xs font-medium bg-orange-100 px-2 py-1 rounded">Fork</span>
                      </div>
                      <Link 
                        href={`/prompts/${fork.id}`}
                        className="font-medium text-gray-900 hover:text-blue-600"
                      >
                        {fork.title}
                      </Link>
                    </div>
                    
                    {/* Fork reason and changes extraction and display */}
                    {fork.notes && (() => {
                      // Extract reason and changes from enhanced format
                      const match = fork.notes.match(/^Forked from [^.]+\.\s*([^|]+)(?:\s*\|\s*Changes:\s*(.+))?$/)
                      if (match) {
                        const reason = match[1]?.trim()
                        const changes = match[2]?.trim()
                        return (
                          <div className="space-y-2 mb-2">
                            {reason && (
                              <div className="text-sm text-orange-700 bg-orange-50 px-3 py-2 rounded border border-orange-200">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">Forked to:</span>
                                  <span>{reason}</span>
                                </div>
                              </div>
                            )}
                            {changes && (
                              <div className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded border border-orange-300">
                                <span className="font-medium">Changes:</span> {changes}
                              </div>
                            )}
                          </div>
                        )
                      }
                      
                      // Fallback for old format
                      const oldMatch = fork.notes.match(/^Forked from [^.]+\.\s*(.+)$/)
                      const reason = oldMatch ? oldMatch[1] : null
                      return reason ? (
                        <div className="text-sm text-orange-700 bg-orange-50 px-3 py-2 rounded border border-orange-200 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Forked to:</span>
                            <span>{reason}</span>
                          </div>
                        </div>
                      ) : null
                    })()}
                    
                    <div className="text-xs text-gray-500">
                      by {fork.profiles?.username || 'Unknown'} • {new Date(fork.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
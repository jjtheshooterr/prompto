'use client'

import { useEffect, useState } from 'react'
import { getPromptChildren, getPromptLineage } from '@/lib/actions/prompts.actions'
import Link from 'next/link'

interface ForkLineageProps {
  promptId: string
}

export default function ForkLineage({ promptId }: ForkLineageProps) {
  const [children, setChildren] = useState<any[]>([])
  const [lineage, setLineage] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [childrenData, lineageData] = await Promise.all([
          getPromptChildren(promptId),
          getPromptLineage(promptId)
        ])
        setChildren(childrenData)
        setLineage(lineageData)
      } catch (error) {
        console.error('Failed to load fork lineage:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [promptId])

  if (loading) {
    return <div className="text-sm text-gray-400 animate-pulse">Loading lineage...</div>
  }

  // Filter out the current prompt from the lineage breadcrumb for the 'path' display
  const ancestors = lineage.slice(0, -1)
  const current = lineage[lineage.length - 1]

  return (
    <div className="space-y-6">
      {/* Lineage Breadcrumb */}
      {lineage.length > 1 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Evolution Path
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {ancestors.map((item, index) => (
              <div key={item.id} className="flex items-center gap-2">
                <Link
                  href={`/prompts/${item.id}`}
                  className="text-blue-600 hover:underline font-medium"
                >
                  {item.title}
                </Link>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            ))}
            <span className="font-bold text-gray-900">{current?.title}</span>
            <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold ring-1 ring-inset ring-blue-700/10">
              Depth: {current?.depth || 0}
            </span>
          </div>
        </div>
      )}

      {/* Children (Forks) */}
      {children.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              Direct Evolutions ({children.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {children.map((child) => (
              <div key={child.id} className="group border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50/30 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <Link
                    href={`/prompts/${child.id}`}
                    className="font-medium text-gray-900 group-hover:text-blue-600 truncate mr-4"
                  >
                    {child.title}
                  </Link>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(child.created_at).toLocaleDateString()}
                  </span>
                </div>
                {child.improvement_summary ? (
                  <p className="text-sm text-gray-600 line-clamp-2 italic">
                    &quot;{child.improvement_summary}&quot;
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 italic">No improvement summary provided.</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {lineage.length <= 1 && children.length === 0 && (
        <div className="text-sm text-gray-500 italic py-4">
          No fork history yet. Be the first to evolve this prompt!
        </div>
      )}
    </div>
  )
}

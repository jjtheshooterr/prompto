'use client'

import Link from 'next/link'

interface PromptCardProps {
  prompt: {
    id: string
    title: string
    model: string | null
    status: string
    user_prompt_template: string
    created_at: string
    prompt_stats?: {
      upvotes: number
      downvotes: number
      score: number
      copy_count: number
      view_count: number
      fork_count: number
    }[]
  }
  showCompareCheckbox?: boolean
  isSelected?: boolean
  onSelectionChange?: (id: string, selected: boolean) => void
}

export default function PromptCard({ 
  prompt, 
  showCompareCheckbox = false,
  isSelected = false,
  onSelectionChange 
}: PromptCardProps) {
  const stats = prompt.prompt_stats?.[0]
  
  const statusColors = {
    experimental: 'bg-yellow-100 text-yellow-800',
    tested: 'bg-blue-100 text-blue-800',
    production: 'bg-green-100 text-green-800'
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {showCompareCheckbox && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => onSelectionChange?.(prompt.id, e.target.checked)}
                className="rounded border-gray-300"
              />
            )}
            <Link href={`/prompts/${prompt.id}`} className="flex-1">
              <h4 className="font-medium text-gray-900 hover:text-blue-600">
                {prompt.title}
              </h4>
            </Link>
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 text-xs rounded-full ${statusColors[prompt.status as keyof typeof statusColors]}`}>
              {prompt.status}
            </span>
            {prompt.model && (
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                {prompt.model}
              </span>
            )}
          </div>
        </div>
        
        {stats && (
          <div className="text-right text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <span className="text-green-600">↑{stats.upvotes}</span>
              <span className="text-red-600">↓{stats.downvotes}</span>
              <span className="font-medium">({stats.score})</span>
            </div>
          </div>
        )}
      </div>
      
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
        {prompt.user_prompt_template}
      </p>
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{new Date(prompt.created_at).toLocaleDateString()}</span>
        {stats && (
          <div className="flex gap-3">
            <span>{stats.view_count} views</span>
            <span>{stats.copy_count} copies</span>
            <span>{stats.fork_count} forks</span>
          </div>
        )}
      </div>
    </div>
  )
}
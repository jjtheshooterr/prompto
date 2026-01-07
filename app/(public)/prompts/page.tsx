'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import PromptCard from '@/components/prompts/PromptCard'
import Link from 'next/link'

interface Prompt {
  id: string
  title: string
  system_prompt: string
  model: string
  created_at: string
  parent_prompt_id?: string
  notes?: string
  problems: {
    title: string
    slug: string
  }
  prompt_stats: Array<{
    upvotes: number
    downvotes: number
    score: number
    copy_count: number
    view_count: number
    fork_count: number
  }>
}

export default function AllPromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'originals' | 'forks'>('all')
  const [sort, setSort] = useState<'newest' | 'top' | 'most_forked'>('newest')

  useEffect(() => {
    const loadPrompts = async () => {
      setLoading(true)
      const supabase = createClient()

      let query = supabase
        .from('prompts')
        .select(`
          id,
          title,
          system_prompt,
          model,
          created_at,
          parent_prompt_id,
          notes,
          problems!inner (
            title,
            slug
          )
        `)
        .eq('is_listed', true)
        .eq('is_hidden', false)
        .eq('visibility', 'public')

      // Apply filter
      if (filter === 'originals') {
        query = query.is('parent_prompt_id', null)
      } else if (filter === 'forks') {
        query = query.not('parent_prompt_id', 'is', null)
      }

      // Apply sort (we'll sort after fetching stats)
      if (sort === 'newest') {
        query = query.order('created_at', { ascending: false })
      }
      // Note: 'top' and 'most_forked' sorting will be done client-side after fetching stats

      query = query.limit(20)

      const { data, error } = await query

      if (error) {
        console.error('Error loading prompts:', error)
      } else if (data) {
        // Transform the data and fetch stats separately
        const transformedPrompts = data.map(prompt => ({
          ...prompt,
          problems: Array.isArray(prompt.problems) ? prompt.problems[0] : prompt.problems
        }))

        // Fetch stats for all prompts
        const promptIds = transformedPrompts.map(p => p.id)
        const { data: statsData } = await supabase
          .from('prompt_stats')
          .select('*')
          .in('prompt_id', promptIds)

        console.log('Fetched stats for prompts:', statsData)

        // Attach stats to prompts
        const promptsWithStats = transformedPrompts.map(prompt => {
          const stats = statsData?.find(s => s.prompt_id === prompt.id)
          return {
            ...prompt,
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

        // Apply client-side sorting for stats-based sorts
        let sortedPrompts = promptsWithStats
        if (sort === 'top') {
          sortedPrompts = promptsWithStats.sort((a, b) => {
            const aUpvotes = a.prompt_stats[0]?.upvotes || 0
            const bUpvotes = b.prompt_stats[0]?.upvotes || 0
            if (bUpvotes !== aUpvotes) {
              return bUpvotes - aUpvotes
            }
            // Fallback to created_at for same upvote counts
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          })
        } else if (sort === 'most_forked') {
          sortedPrompts = promptsWithStats.sort((a, b) => {
            const aForks = a.prompt_stats[0]?.fork_count || 0
            const bForks = b.prompt_stats[0]?.fork_count || 0
            return bForks - aForks
          })
        }

        setPrompts(sortedPrompts)
      }

      setLoading(false)
    }

    loadPrompts()
  }, [filter, sort])

  const addToCompare = (promptId: string) => {
    const selected = JSON.parse(localStorage.getItem('comparePrompts') || '[]')
    if (!selected.includes(promptId)) {
      selected.push(promptId)
      localStorage.setItem('comparePrompts', JSON.stringify(selected))
      alert('Added to comparison!')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">All Prompts</h1>
        <p className="text-gray-600">
          Browse all prompts across problems. See originals, forks, and their evolution.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8 bg-white p-6 rounded-lg shadow">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex gap-2">
            <span className="text-sm font-medium text-gray-700">Show:</span>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Prompts
            </button>
            <button
              onClick={() => setFilter('originals')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                filter === 'originals'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Originals Only
            </button>
            <button
              onClick={() => setFilter('forks')}
              className={`px-3 py-1 text-sm rounded transition-colors flex items-center gap-1 ${
                filter === 'forks'
                  ? 'bg-orange-600 text-white'
                  : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              Forks Only
            </button>
          </div>

          <div className="flex gap-2">
            <span className="text-sm font-medium text-gray-700">Sort:</span>
            <button
              onClick={() => setSort('newest')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                sort === 'newest'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Newest
            </button>
            <button
              onClick={() => setSort('top')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                sort === 'top'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Top Rated
            </button>
            <button
              onClick={() => setSort('most_forked')}
              className={`px-3 py-1 text-sm rounded transition-colors flex items-center gap-1 ${
                sort === 'most_forked'
                  ? 'bg-orange-600 text-white'
                  : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              Most Forked
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-gray-600">
            Showing {prompts.length} prompts
            {filter === 'forks' && ' (forks only)'}
            {filter === 'originals' && ' (originals only)'}
          </div>

          <div className="space-y-6">
            {prompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                onAddToCompare={addToCompare}
                showProblemTitle={true}
              />
            ))}
          </div>
        </>
      )}

      {prompts.length === 0 && !loading && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No prompts found</h3>
          <p className="text-gray-600 mb-4">
            {filter === 'forks' 
              ? 'No forks found. Try browsing all prompts or create your first fork!'
              : 'No prompts match your criteria. Try different filters or create a new prompt.'
            }
          </p>
          <div className="flex gap-3 justify-center">
            <Link 
              href="/problems"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Problems
            </Link>
            <Link 
              href="/create/prompt"
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Create Prompt
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
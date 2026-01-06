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
          ),
          prompt_stats (
            upvotes,
            downvotes,
            score,
            copy_count,
            view_count,
            fork_count
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

      // Apply sort
      if (sort === 'newest') {
        query = query.order('created_at', { ascending: false })
      } else if (sort === 'top') {
        query = query.order('prompt_stats.score', { ascending: false, nullsFirst: false })
      } else if (sort === 'most_forked') {
        query = query.order('prompt_stats.fork_count', { ascending: false, nullsFirst: false })
      }

      query = query.limit(20)

      const { data, error } = await query

      if (error) {
        console.error('Error loading prompts:', error)
      } else {
        // Transform the data to match our interface
        const transformedPrompts = (data || []).map(prompt => ({
          ...prompt,
          problems: Array.isArray(prompt.problems) ? prompt.problems[0] : prompt.problems
        }))
        setPrompts(transformedPrompts)
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

      {/* Compare Button */}
      {prompts.length > 0 && (
        <div className="fixed bottom-6 right-6">
          <Link
            href="/compare"
            className="px-6 py-3 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-700 transition-colors"
          >
            Compare Selected
          </Link>
        </div>
      )}
    </div>
  )
}
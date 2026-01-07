'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface TopRatedPrompt {
  id: string
  title: string
  system_prompt: string
  model: string
  created_at: string
  upvotes: number
  downvotes: number
  score: number
  problems: {
    title: string
    slug: string
  }[]
  profiles?: {
    username: string
  } | null
}

export default function TopRatedPrompts() {
  const [prompts, setPrompts] = useState<TopRatedPrompt[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadTopRatedPrompts = async () => {
      try {
        const supabase = createClient()
        
        // Get all public prompts
        const { data: promptsData } = await supabase
          .from('prompts')
          .select(`
            id,
            title,
            system_prompt,
            model,
            created_at,
            created_by,
            problems (
              title,
              slug
            )
          `)
          .eq('is_listed', true)
          .eq('is_hidden', false)
          .eq('visibility', 'public')
          .order('created_at', { ascending: false })

        if (promptsData && promptsData.length > 0) {
          // Fetch stats separately for all prompts
          const promptIds = promptsData.map(p => p.id)
          const { data: statsData } = await supabase
            .from('prompt_stats')
            .select('*')
            .in('prompt_id', promptIds)

          // Fetch profiles for creators
          const creatorIds = [...new Set(promptsData.map(p => p.created_by))]
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, username')
            .in('id', creatorIds)

          // Attach stats and profiles to prompts
          const promptsWithStats = promptsData.map(prompt => {
            const stats = statsData?.find(s => s.prompt_id === prompt.id)
            const profile = profilesData?.find(p => p.id === prompt.created_by)
            return {
              ...prompt,
              upvotes: stats?.upvotes || 0,
              downvotes: stats?.downvotes || 0,
              score: stats?.score || 0,
              profiles: profile ? { username: profile.username } : null
            }
          })

          // Sort by upvotes descending, then by created_at for ties
          const topRated = promptsWithStats
            .filter(p => p.upvotes > 0) // Only show prompts with at least 1 upvote
            .sort((a, b) => {
              if (b.upvotes !== a.upvotes) {
                return b.upvotes - a.upvotes
              }
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            })
            .slice(0, 3) // Top 3

          setPrompts(topRated as TopRatedPrompt[])
        }
      } catch (error) {
        console.error('Failed to load top rated prompts:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTopRatedPrompts()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg border animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-full mb-4"></div>
            <div className="flex gap-2">
              <div className="h-6 bg-gray-200 rounded w-16"></div>
              <div className="h-6 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Top Rated Prompts</h2>
        <Link 
          href="/prompts?sort=top" 
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          View All →
        </Link>
      </div>
      
      {prompts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prompts.map((prompt, index) => (
            <Link
              key={prompt.id}
              href={`/prompts/${prompt.id}`}
              className="block bg-white p-6 rounded-lg border hover:shadow-md transition-shadow relative"
            >
              {/* Ranking badge */}
              <div className="absolute -top-2 -left-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                {index + 1}
              </div>
              
              <div className="flex items-start justify-between mb-3">
                <span className="px-2 py-1 text-xs rounded font-medium bg-blue-100 text-blue-700">
                  {prompt.model}
                </span>
                <div className="flex items-center gap-3 text-sm">
                  <span className="flex items-center gap-1 text-green-600 font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    {prompt.upvotes}
                  </span>
                  {prompt.downvotes > 0 && (
                    <span className="flex items-center gap-1 text-red-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      {prompt.downvotes}
                    </span>
                  )}
                </div>
              </div>
              
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                {prompt.title}
              </h3>
              
              <p className="text-gray-600 text-sm line-clamp-3 mb-3">
                {prompt.system_prompt}
              </p>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex flex-col gap-1">
                  <span>by {prompt.profiles?.username || 'Anonymous'}</span>
                  {prompt.problems && prompt.problems.length > 0 && (
                    <span className="text-blue-600">
                      {prompt.problems[0].title}
                    </span>
                  )}
                </div>
                <span>{new Date(prompt.created_at).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No top rated prompts yet</h3>
          <p className="text-gray-600 mb-4">Be the first to create and vote on prompts!</p>
          <Link 
            href="/create/prompt"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Prompt
          </Link>
        </div>
      )}
    </div>
  )
}
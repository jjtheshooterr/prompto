'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface TrendingProblem {
  id: string
  title: string
  description: string
  industry: string
  slug: string
  created_at: string
  prompt_count: number
  total_votes: number
  profiles?: {
    username: string
  }
}

export default function TrendingProblems() {
  const [problems, setProblems] = useState<TrendingProblem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadTrendingProblems = async () => {
      try {
        const supabase = createClient()
        
        // Get problems with their prompt counts and vote totals
        const { data } = await supabase
          .from('problems')
          .select(`
            id,
            title,
            description,
            industry,
            slug,
            created_at,
            profiles!created_by (
              username
            )
          `)
          .order('created_at', { ascending: false })
          .limit(6)

        if (data) {
          // Get prompt counts and vote totals for each problem
          const problemsWithStats = await Promise.all(
            data.map(async (problem) => {
              // Count prompts for this problem
              const { count: promptCount } = await supabase
                .from('prompts')
                .select('id', { count: 'exact' })
                .eq('problem_id', problem.id)
                .eq('is_listed', true)
                .eq('is_hidden', false)

              // Get total votes for all prompts in this problem
              const { data: promptIds } = await supabase
                .from('prompts')
                .select('id')
                .eq('problem_id', problem.id)
                .eq('is_listed', true)
                .eq('is_hidden', false)

              let totalVotes = 0
              if (promptIds && promptIds.length > 0) {
                const { data: stats } = await supabase
                  .from('prompt_stats')
                  .select('upvotes, downvotes')
                  .in('prompt_id', promptIds.map(p => p.id))

                totalVotes = stats?.reduce((sum, stat) => sum + (stat.upvotes || 0) + (stat.downvotes || 0), 0) || 0
              }

              return {
                ...problem,
                prompt_count: promptCount || 0,
                total_votes: totalVotes
              }
            })
          )

          // Sort by activity (prompt count + votes)
          const sorted = problemsWithStats.sort((a, b) => {
            const scoreA = a.prompt_count * 3 + a.total_votes
            const scoreB = b.prompt_count * 3 + b.total_votes
            return scoreB - scoreA
          })

          setProblems(sorted)
        }
      } catch (error) {
        console.error('Failed to load trending problems:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTrendingProblems()
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
        <h2 className="text-2xl font-bold">Trending Problems</h2>
        <Link 
          href="/problems" 
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          View All →
        </Link>
      </div>
      
      {problems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {problems.map((problem) => (
            <Link
              key={problem.id}
              href={`/problems/${problem.slug}`}
              className="block bg-white p-6 rounded-lg border hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <span className={`px-2 py-1 text-xs rounded font-medium ${
                  problem.industry === 'dev' ? 'bg-blue-100 text-blue-700' :
                  problem.industry === 'marketing' ? 'bg-green-100 text-green-700' :
                  problem.industry === 'content' ? 'bg-purple-100 text-purple-700' :
                  problem.industry === 'data' ? 'bg-orange-100 text-orange-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {problem.industry}
                </span>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    {problem.prompt_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                    </svg>
                    {problem.total_votes}
                  </span>
                </div>
              </div>
              
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                {problem.title}
              </h3>
              
              <p className="text-gray-600 text-sm line-clamp-3 mb-3">
                {problem.description}
              </p>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>by {problem.profiles?.username || 'Anonymous'}</span>
                <span>{new Date(problem.created_at).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No problems yet</h3>
          <p className="text-gray-600 mb-4">Be the first to create a problem for the community!</p>
          <Link 
            href="/create/problem"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Problem
          </Link>
        </div>
      )}
    </div>
  )
}
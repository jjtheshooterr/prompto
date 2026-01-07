'use client'

import { createClient } from '@/lib/supabase/client'
import { listPromptsByProblem } from '@/lib/actions/prompts.actions'
import PromptCard from '@/components/prompts/PromptCard'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { useEffect, useState } from 'react'

interface ProblemDetailPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ sort?: 'newest' | 'top' }>
}

export default function ProblemDetailPage({ params, searchParams }: ProblemDetailPageProps) {
  const [problem, setProblem] = useState<any>(null)
  const [prompts, setPrompts] = useState<any[]>([])
  const [sort, setSort] = useState<'newest' | 'top'>('top')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      const { slug } = await params
      const { sort: sortParam = 'top' } = await searchParams
      
      setSort(sortParam)
      
      // Use client-side Supabase to get problem with proper auth context
      const supabase = createClient()
      const { data: problemData, error } = await supabase
        .from('problems')
        .select(`
          *,
          inputs,
          constraints,
          success_criteria
        `)
        .eq('slug', slug)
        .eq('is_deleted', false)
        .single()
      
      if (error || !problemData) {
        console.error('Error fetching problem:', error)
        notFound()
        return
      }

      setProblem(problemData)
      
      // Get prompts client-side as well
      let promptQuery = supabase
        .from('prompts')
        .select('*')
        .eq('problem_id', problemData.id)
        .eq('is_listed', true)
        .eq('is_hidden', false)
        .eq('is_deleted', false)

      if (sortParam === 'newest') {
        promptQuery = promptQuery.order('created_at', { ascending: false })
      } else {
        promptQuery = promptQuery.order('created_at', { ascending: false })
      }

      const { data: promptsData, error: promptsError } = await promptQuery

      if (promptsError) {
        console.error('Error fetching prompts:', promptsError)
        setPrompts([])
      } else {
        // Get stats for prompts if needed
        const promptIds = promptsData?.map(p => p.id) || []
        if (promptIds.length > 0) {
          const { data: statsData } = await supabase
            .from('prompt_stats')
            .select('*')
            .in('prompt_id', promptIds)

          // Attach stats to prompts
          const promptsWithStats = (promptsData || []).map(prompt => {
            const stats = statsData?.find(s => s.prompt_id === prompt.id)
            return {
              ...prompt,
              upvotes: stats?.upvotes || 0,
              downvotes: stats?.downvotes || 0,
              score: (stats?.upvotes || 0) - (stats?.downvotes || 0),
              views: stats?.views || 0,
              copies: stats?.copies || 0,
              forks: stats?.forks || 0
            }
          })

          // Sort by score if 'top' sort
          if (sortParam === 'top') {
            promptsWithStats.sort((a, b) => b.upvotes - a.upvotes)
          }

          setPrompts(promptsWithStats)
        } else {
          setPrompts([])
        }
      }
      
      setLoading(false)
    }

    loadData()
  }, [params, searchParams])

  const addToCompare = (promptId: string) => {
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

  if (!problem) {
    notFound()
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Problem Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link href="/problems" className="hover:text-gray-700">Problems</Link>
          <span>/</span>
          <span>{problem.title}</span>
        </div>

        <h1 className="text-3xl font-bold mb-4">{problem.title}</h1>
        <p className="text-gray-600 text-lg mb-6">{problem.description}</p>

        {/* Problem Goal */}
        {problem.goal && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Goal</h3>
            <p className="text-blue-800">{problem.goal}</p>
          </div>
        )}

        {/* Structured Information */}
        {(problem.inputs || problem.constraints || problem.success_criteria) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Expected Inputs */}
            {problem.inputs && problem.inputs.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Expected Inputs</h3>
                <ul className="space-y-2">
                  {problem.inputs.map((input: any, index: number) => (
                    <li key={index} className="text-sm">
                      <div className="font-medium text-gray-900">
                        {input.name}
                        {input.required && <span className="text-red-600 ml-1">*</span>}
                      </div>
                      <div className="text-gray-600 text-xs">{input.description}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Constraints */}
            {problem.constraints && problem.constraints.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Constraints</h3>
                <ul className="space-y-2">
                  {problem.constraints.map((constraint: any, index: number) => (
                    <li key={index} className="text-sm flex items-start">
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 mt-1.5 flex-shrink-0 ${
                        constraint.severity === 'hard' ? 'bg-red-500' : 'bg-yellow-500'
                      }`}></span>
                      <span className="text-gray-700">{constraint.rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Success Criteria */}
            {problem.success_criteria && problem.success_criteria.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Success Criteria</h3>
                <ul className="space-y-2">
                  {problem.success_criteria.map((criterion: any, index: number) => (
                    <li key={index} className="text-sm flex items-start">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2 mt-1.5 flex-shrink-0"></span>
                      <span className="text-gray-700">{criterion.criterion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {problem.tags && problem.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {problem.tags.map((tag: string, index: number) => (
              <span
                key={`${tag}-${index}`}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            <span className="mr-4">Industry: {problem.industry}</span>
            <span>{prompts.length} prompts</span>
          </div>

          <Link
            href={`/create/prompt?problem=${problem.id}`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Prompt
          </Link>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="mb-6">
        <div className="flex gap-2">
          <Link
            href={`/problems/${problem.slug}?sort=top`}
            className={`px-4 py-2 rounded-lg transition-colors ${
              sort === 'top'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Top Rated
          </Link>
          <Link
            href={`/problems/${problem.slug}?sort=newest`}
            className={`px-4 py-2 rounded-lg transition-colors ${
              sort === 'newest'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Newest
          </Link>
        </div>
      </div>

      {/* Prompts List */}
      <div className="space-y-6">
        {prompts.map((prompt) => (
          <PromptCard
            key={prompt.id}
            prompt={prompt}
            onAddToCompare={addToCompare}
          />
        ))}
      </div>

      {prompts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No prompts yet for this problem.</p>
          <Link
            href={`/create/prompt?problem=${problem.id}`}
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Be the First to Add a Prompt
          </Link>
        </div>
      )}
    </div>
  )
}
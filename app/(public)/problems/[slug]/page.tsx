'use client'

import { getPublicProblemBySlug } from '@/lib/actions/problems.actions'
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
      
      const problemData = await getPublicProblemBySlug(slug)
      
      if (!problemData) {
        notFound()
        return
      }

      setProblem(problemData)
      const promptsData = await listPromptsByProblem(problemData.id, sortParam)
      setPrompts(promptsData)
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

        {problem.tags && problem.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {problem.tags.map((tag: string) => (
              <span
                key={tag}
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
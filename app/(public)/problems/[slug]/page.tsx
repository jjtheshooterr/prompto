import { getProblemBySlug } from '@/lib/actions/problems.actions'
import { listPromptsByProblem } from '@/lib/actions/prompts.actions'
import PromptCard from '@/components/prompts/PromptCard'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

// Enable ISR with 5-minute revalidation
export const revalidate = 300

interface ProblemDetailPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ sort?: 'newest' | 'top' }>
}

export default async function ProblemDetailPage({ params, searchParams }: ProblemDetailPageProps) {
  const { slug } = await params
  const { sort = 'top' } = await searchParams

  // Fetch problem and prompts server-side
  const problem = await getProblemBySlug(slug)
  
  if (!problem) {
    notFound()
  }

  const prompts = await listPromptsByProblem(problem.id, sort)

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
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 mt-1.5 flex-shrink-0 ${constraint.severity === 'hard' ? 'bg-red-500' : 'bg-yellow-500'
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
            <span className="mr-4">{prompts.length} prompts</span>
            {problem.author && (
              <span>
                by {problem.author.display_name || problem.author.username || 'Anonymous'}
              </span>
            )}
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
            className={`px-4 py-2 rounded-lg transition-colors ${sort === 'top'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Top Rated
          </Link>
          <Link
            href={`/problems/${problem.slug}?sort=newest`}
            className={`px-4 py-2 rounded-lg transition-colors ${sort === 'newest'
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
        {/* Pinned Prompt Section */}
        {problem.pinned_prompt_id && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              Recommended Solution
            </h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">Featured solution coming soon...</p>
            </div>
          </div>
        )}

        {/* Section Headers */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">
            {sort === 'top' ? 'Top Rated Prompts' : 'Latest Prompts'}
          </h2>
          <div className="text-sm text-gray-500">
            {prompts.length} prompt{prompts.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Prompts */}
        <Suspense fallback={<div>Loading prompts...</div>}>
          {prompts.map((prompt) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
            />
          ))}
        </Suspense>
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
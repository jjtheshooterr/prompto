import { getPublicProblemBySlug } from '@/lib/actions/problems.actions'
import { listPromptsByProblem } from '@/lib/actions/prompts.actions'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface ProblemDetailPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ sort?: 'newest' | 'top' }>
}

export default async function ProblemDetailPage({ params, searchParams }: ProblemDetailPageProps) {
  const { slug } = await params
  const { sort = 'top' } = await searchParams
  
  const problem = await getPublicProblemBySlug(slug)
  
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
            href={`/problems/${slug}?sort=top`}
            className={`px-4 py-2 rounded-lg transition-colors ${
              sort === 'top'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Top Rated
          </Link>
          <Link
            href={`/problems/${slug}?sort=newest`}
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
        {prompts.map((prompt) => {
          const stats = prompt.prompt_stats?.[0] || {
            upvotes: 0,
            downvotes: 0,
            score: 0,
            copy_count: 0,
            view_count: 0,
            fork_count: 0
          }

          return (
            <div key={prompt.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <Link
                    href={`/prompts/${prompt.id}`}
                    className="text-xl font-semibold hover:text-blue-600 transition-colors"
                  >
                    {prompt.title}
                  </Link>
                  <div className="text-sm text-gray-500 mt-1">
                    Model: {prompt.model} • {new Date(prompt.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-green-600">↑{stats.upvotes}</span>
                    <span className="text-red-600">↓{stats.downvotes}</span>
                  </div>
                  <div className="text-gray-500">
                    Score: {stats.score}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-2">System Prompt:</div>
                <div className="bg-gray-50 p-3 rounded text-sm font-mono line-clamp-3">
                  {prompt.system_prompt}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex gap-4 text-sm text-gray-500">
                  <span>{stats.view_count} views</span>
                  <span>{stats.copy_count} copies</span>
                  <span>{stats.fork_count} forks</span>
                </div>

                <div className="flex gap-2">
                  <button
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      const selected = JSON.parse(localStorage.getItem('comparePrompts') || '[]')
                      if (!selected.includes(prompt.id)) {
                        selected.push(prompt.id)
                        localStorage.setItem('comparePrompts', JSON.stringify(selected))
                      }
                    }}
                  >
                    Compare
                  </button>
                  <Link
                    href={`/prompts/${prompt.id}`}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
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
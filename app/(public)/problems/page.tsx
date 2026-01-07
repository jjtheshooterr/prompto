import { listProblems } from '@/lib/actions/problems.actions'
import Link from 'next/link'
import { Suspense } from 'react'

interface ProblemsPageProps {
  searchParams: Promise<{
    search?: string
    industry?: string
    sort?: 'newest' | 'top'
  }>
}

export default async function ProblemsPage({ searchParams }: ProblemsPageProps) {
  const params = await searchParams
  const problems = await listProblems({
    search: params.search || '',
    industry: params.industry || '',
    sort: params.sort || 'newest'
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Browse Problems</h1>
        <p className="text-gray-600">
          Discover coding problems and their prompt solutions from the community.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8 bg-white p-6 rounded-lg shadow">
        <form method="get" className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <input
              type="text"
              name="search"
              placeholder="Search problems..."
              defaultValue={params.search}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <select
            name="industry"
            defaultValue={params.industry}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Industries</option>
            <option value="dev">Development & Technology</option>
            <option value="marketing">Marketing</option>
            <option value="content">Content Creation</option>
            <option value="data">Data & Analytics</option>
            <option value="finance">Finance</option>
            <option value="healthcare">Healthcare</option>
            <option value="education">Education</option>
            <option value="legal">Legal</option>
            <option value="sales">Sales</option>
            <option value="support">Customer Support</option>
            <option value="hr">Human Resources</option>
            <option value="video">Video & Media</option>
          </select>

          <select
            name="sort"
            defaultValue={params.sort}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="newest">Newest</option>
            <option value="top">Top Rated</option>
          </select>

          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Problems Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {problems.map((problem) => (
          <Link
            key={problem.id}
            href={`/problems/${problem.slug}`}
            className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
          >
            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-2">{problem.title}</h3>
              <p className="text-gray-600 text-sm line-clamp-3">
                {problem.description}
              </p>
            </div>

            {problem.tags && problem.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {problem.tags.slice(0, 3).map((tag: string, index: number) => (
                  <span
                    key={`${tag}-${index}`}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
                {problem.tags.length > 3 && (
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                    +{problem.tags.length - 3} more
                  </span>
                )}
              </div>
            )}

            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>{problem.industry}</span>
              <span>
                {Array.isArray(problem.prompts) ? problem.prompts.length : 0} prompts
              </span>
            </div>

            <div className="mt-4 text-xs text-gray-400">
              {new Date(problem.created_at).toLocaleDateString()}
            </div>
          </Link>
        ))}
      </div>

      {problems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No problems found matching your criteria.</p>
          <Link
            href="/create/problem"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create the First Problem
          </Link>
        </div>
      )}
    </div>
  )
}
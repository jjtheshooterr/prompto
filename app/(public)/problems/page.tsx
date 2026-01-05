import { listPublicProblems } from '@/lib/actions/problems.actions'
import ProblemCard from '@/components/problems/ProblemCard'

interface SearchParams {
  search?: string
  industry?: string
  sort?: 'newest' | 'top'
}

export default async function ProblemsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const problems = await listPublicProblems({
    search: params.search,
    industry: params.industry,
    sort: params.sort || 'newest'
  })

  const industries = [
    'video', 'dev', 'legal', 'marketing', 'data', 'content',
    'support', 'sales', 'hr', 'finance', 'education', 'healthcare'
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Browse Problems</h1>
        <p className="text-gray-600 mb-6">
          Discover real-world problems and the prompts that solve them.
        </p>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-64">
            <input
              type="text"
              placeholder="Search problems..."
              defaultValue={params.search}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            defaultValue={params.industry || ''}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Industries</option>
            {industries.map(industry => (
              <option key={industry} value={industry}>
                {industry.charAt(0).toUpperCase() + industry.slice(1)}
              </option>
            ))}
          </select>
          
          <select
            defaultValue={params.sort || 'newest'}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Newest</option>
            <option value="top">Top Rated</option>
          </select>
        </div>
      </div>

      {/* Results */}
      {problems.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No problems found</h3>
          <p className="text-gray-600">Try adjusting your search criteria.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {problems.map((problem) => (
            <ProblemCard key={problem.id} problem={problem} />
          ))}
        </div>
      )}
    </div>
  )
}
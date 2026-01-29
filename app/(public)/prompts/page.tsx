import { createClient } from '@/lib/supabase/server'
import PromptCard from '@/components/prompts/PromptCard'
import Link from 'next/link'
import PromptsFilterClient from './PromptsFilterClient'

// Enable ISR with 2-minute revalidation
export const revalidate = 120

interface AllPromptsPageProps {
  searchParams: Promise<{
    filter?: 'all' | 'originals' | 'forks'
    sort?: 'newest' | 'top' | 'most_forked'
    page?: string
  }>
}

export default async function AllPromptsPage({ searchParams }: AllPromptsPageProps) {
  const params = await searchParams
  const filter = (params.filter || 'all') as 'all' | 'originals' | 'forks'
  const sort = (params.sort || 'newest') as 'newest' | 'top' | 'most_forked'
  const currentPage = Number(params.page) || 1
  const limit = 12

  const supabase = await createClient()

  // Get total count
  let countQuery = supabase
    .from('prompts')
    .select('id', { count: 'exact', head: true })
    .eq('is_listed', true)
    .eq('is_hidden', false)
    .eq('is_deleted', false)
    .eq('visibility', 'public')

  if (filter === 'originals') {
    countQuery = countQuery.is('parent_prompt_id', null)
  } else if (filter === 'forks') {
    countQuery = countQuery.not('parent_prompt_id', 'is', null)
  }

  const { count } = await countQuery
  const total = count || 0
  const totalPages = Math.ceil(total / limit)
  const offset = (currentPage - 1) * limit

  // Get prompts using RPC
  const { data: promptsData, error } = await supabase
    .rpc('get_ranked_prompts', {
      sort_by: sort,
      filter_type: filter,
      limit_count: limit,
      offset_count: offset
    })

  let prompts: any[] = []

  if (!error && promptsData && promptsData.length > 0) {
    // Get problems separately
    const problemIds = [...new Set(promptsData.map((p: any) => p.problem_id).filter(Boolean))]
    const { data: problemsData } = await supabase
      .from('problems')
      .select('id, title, slug')
      .in('id', problemIds)

    // Get stats
    const promptIds = promptsData.map((p: any) => p.id)
    const { data: statsData } = await supabase
      .from('prompt_stats')
      .select('*')
      .in('prompt_id', promptIds)

    // Attach problems and format stats
    prompts = promptsData.map((prompt: any) => {
      const stats = statsData?.find(s => s.prompt_id === prompt.id)
      const problem = problemsData?.find(p => p.id === prompt.problem_id)

      return {
        ...prompt,
        problems: problem ? { title: problem.title, slug: problem.slug } : { title: 'Unknown Problem', slug: '' },
        prompt_stats: [stats || {
          upvotes: 0,
          downvotes: 0,
          score: 0,
          copy_count: 0,
          view_count: 0,
          fork_count: 0
        }]
      }
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">All Prompts</h1>
        <p className="text-gray-600">
          Browse all prompts across problems. See originals, forks, and their evolution.
        </p>
      </div>

      {/* Filters - Client Component */}
      <PromptsFilterClient filter={filter} sort={sort} />

      {/* Results */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {prompts.length} of {total} prompts
        {filter === 'forks' && ' (forks only)'}
        {filter === 'originals' && ' (originals only)'}
      </div>

      <div className="space-y-6">
        {prompts.map((prompt) => (
          <PromptCard
            key={prompt.id}
            prompt={prompt}
            showProblemTitle={true}
          />
        ))}
      </div>

      {prompts.length === 0 && (
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <nav className="flex items-center gap-2">
            <Link
              href={`/prompts?filter=${filter}&sort=${sort}&page=${Math.max(1, currentPage - 1)}`}
              className={`px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors ${
                currentPage === 1 ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              Previous
            </Link>
            
            {[...Array(totalPages)].map((_, i) => {
              const page = i + 1
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <Link
                    key={page}
                    href={`/prompts?filter=${filter}&sort=${sort}&page=${page}`}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </Link>
                )
              } else if (
                page === currentPage - 2 ||
                page === currentPage + 2
              ) {
                return <span key={page} className="px-2 text-gray-400">...</span>
              }
              return null
            })}
            
            <Link
              href={`/prompts?filter=${filter}&sort=${sort}&page=${Math.min(totalPages, currentPage + 1)}`}
              className={`px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors ${
                currentPage === totalPages ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              Next
            </Link>
          </nav>
        </div>
      )}
    </div>
  )
}
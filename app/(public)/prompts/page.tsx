import { createClient } from '@/lib/supabase/server'
import PromptCard from '@/components/prompts/PromptCard'
import Link from 'next/link'
import PromptsFilterClient from './PromptsFilterClient'

// Enable ISR with 2-minute revalidation
export const revalidate = 120

interface AllPromptsPageProps {
  searchParams: Promise<{
    filter?: 'all' | 'originals' | 'forks'
    sort?: 'newest' | 'top' | 'most_forked' | 'best'
    search?: string
    page?: string
  }>
}

export default async function AllPromptsPage({ searchParams }: AllPromptsPageProps) {
  const params = await searchParams
  const filter = (params.filter || 'all') as 'all' | 'originals' | 'forks'
  const sort = (params.sort || 'newest') as 'newest' | 'top' | 'most_forked' | 'best'
  const search = params.search || ''
  const currentPage = Number(params.page) || 1
  const limit = 12

  const supabase = await createClient()

  // Get prompts
  let prompts: any[] = []
  let total = 0

  if (search) {
    // Use full-text search
    const { data: searchData, error: searchError } = await supabase
      .from('prompts')
      .select(`
        *,
        problems!prompts_problem_id_fkey (title, slug),
        prompt_stats (
          upvotes, downvotes, score, copy_count, view_count, fork_count,
          works_count, fails_count, reviews_count
        )
      `)
      .textSearch('fts', search, { type: 'websearch' })
      .eq('is_listed', true)
      .eq('is_hidden', false)
      .eq('is_deleted', false)
      .range((currentPage - 1) * limit, currentPage * limit - 1)

    // Also get count for search
    const { count: searchCount } = await supabase
      .from('prompts')
      .select('id', { count: 'exact', head: true })
      .textSearch('fts', search, { type: 'websearch' })
      .eq('is_listed', true)
      .eq('is_hidden', false)
      .eq('is_deleted', false)

    prompts = searchData || []
    total = searchCount || 0
  } else {
    // Normal listing
    let query = supabase
      .from(sort === 'best' ? 'prompt_rankings' : 'prompts')
      .select(`
        *,
        problems!prompts_problem_id_fkey (title, slug),
        prompt_stats (
          upvotes, downvotes, score, copy_count, view_count, fork_count,
          works_count, fails_count, reviews_count
        )
      `, { count: 'exact' })
      .eq('is_listed', true)
      .eq('is_hidden', false)
      .eq('is_deleted', false)

    if (filter === 'originals') {
      query = query.is('parent_prompt_id', null)
    } else if (filter === 'forks') {
      query = query.not('parent_prompt_id', 'is', null)
    }

    if (sort === 'best') {
      query = query.order('rank_score', { ascending: false })
    } else if (sort === 'most_forked') {
      query = query.order('fork_count', { ascending: false, referencedTable: 'prompt_stats' })
    } else if (sort === 'top') {
      query = query.order('upvotes', { ascending: false, referencedTable: 'prompt_stats' })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    const { data, count: normalCount } = await query
      .range((currentPage - 1) * limit, currentPage * limit - 1)

    prompts = data || []
    total = normalCount || 0
  }

  const totalPages = Math.ceil(total / limit)

  // Format prompts to match card expectations if needed
  prompts = prompts.map(p => ({
    ...p,
    prompt_stats: Array.isArray(p.prompt_stats) ? p.prompt_stats : [p.prompt_stats].filter(Boolean)
  }))



  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">All Prompts</h1>
        <p className="text-gray-600">
          Browse all prompts across problems. See originals, forks, and their evolution.
        </p>
      </div>

      {/* Filters - Client Component */}
      <PromptsFilterClient filter={filter} sort={sort} search={search} />

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
              href={`/prompts?filter=${filter}&sort=${sort}${search ? `&search=${search}` : ''}&page=${Math.max(1, currentPage - 1)}`}
              className={`px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors ${currentPage === 1 ? 'opacity-50 pointer-events-none' : ''
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
                    href={`/prompts?filter=${filter}&sort=${sort}${search ? `&search=${search}` : ''}&page=${page}`}
                    className={`px-4 py-2 rounded-lg transition-colors ${currentPage === page
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
              href={`/prompts?filter=${filter}&sort=${sort}${search ? `&search=${search}` : ''}&page=${Math.min(totalPages, currentPage + 1)}`}
              className={`px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors ${currentPage === totalPages ? 'opacity-50 pointer-events-none' : ''
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
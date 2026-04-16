import { listProblems } from '@/lib/actions/problems.actions'
import Link from 'next/link'
import Pagination from '@/components/ui/Pagination'
import React from 'react'
import { problemUrl, toDisplayString } from '@/lib/utils/prompt-url'
import { JsonLd } from '@/components/seo/JsonLd'
import type { Metadata } from 'next'

const BASE_URL = 'https://promptvexity.com'

export const metadata: Metadata = {
  title: 'Browse AI Problems - Community Prompt Solutions | Promptvexity',
  description: 'Explore real-world problems and find community-tested AI prompt solutions. Compare approaches, vote on the best prompts, and fork to improve.',
  alternates: { canonical: '/problems' },
}

export const revalidate = 120

interface ProblemsPageProps {
  searchParams: Promise<{
    search?: string
    industry?: string
    difficulty?: string
    sort?: 'newest' | 'top'
    page?: string
  }>
}

const difficultyColor: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700 border-green-200',
  intermediate: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  advanced: 'bg-orange-100 text-orange-700 border-orange-200',
  expert: 'bg-red-100 text-red-700 border-red-200',
}

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffDays > 0) return `${diffDays}d ago`
  if (diffHours > 0) return `${diffHours}h ago`
  return 'Just now'
}

function truncate(str: string | { text: string } | null | undefined, len: number) {
  const s = toDisplayString(str)
  if (!s) return ''
  return s.length > len ? s.slice(0, len) + '…' : s
}

export default async function ProblemsPage({ searchParams }: ProblemsPageProps) {
  const params = await searchParams
  const currentPage = Number(params.page) || 1
  const limit = 8

  const { data: problems, total, pages } = await listProblems({
    search: params.search || '',
    industry: params.industry || '',
    sort: params.sort || 'newest',
    page: currentPage,
    limit
  })

  const safeTotal = total || 0
  const start = safeTotal === 0 ? 0 : (currentPage - 1) * limit + 1
  const end = Math.min(start + limit - 1, safeTotal)

  const collectionData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'AI Problems & Prompt Solutions',
    description: 'Browse real-world problems with community-voted AI prompt solutions.',
    url: `${BASE_URL}/problems`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: safeTotal,
      itemListElement: (problems || []).slice(0, 10).map((p: any, i: number) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${BASE_URL}${problemUrl(p)}`,
        name: p.title,
      })),
    },
  }

  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Problems', item: `${BASE_URL}/problems` },
    ],
  }

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 flex flex-col pt-8">
      <JsonLd data={[collectionData, breadcrumbData]} />
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 w-full flex flex-col md:flex-row gap-8">

        {/* ── LEFT SIDEBAR ─────────────────────────────────────────────── */}
        <aside className="w-full md:w-60 flex-shrink-0 space-y-4">
          <form method="get" className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Filters</h2>

            {/* Search */}
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1.5 block">Search</label>
              <input
                type="text"
                name="search"
                defaultValue={params.search}
                placeholder="Search problems..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400 transition"
              />
            </div>

            {/* Difficulty */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Difficulty</h3>
              <div className="space-y-1.5">
                {['beginner', 'intermediate', 'advanced'].map((v) => (
                  <label key={v} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      name="difficulty"
                      value={v}
                      defaultChecked={(params as any).difficulty === v}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-sm text-slate-600 group-hover:text-slate-900 capitalize">{v}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Industry */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Industry</h3>
              <div className="flex flex-wrap gap-1.5">
                {['Fintech', 'Healthcare', 'EdTech', 'SaaS', 'Dev', 'Marketing', 'Data', 'Legal', 'Sales', 'HR'].map((label) => {
                  const value = label.toLowerCase()
                  const isActive = params.industry === value
                  const next = new URLSearchParams()
                  if (params.search) next.set('search', params.search)
                  if (params.sort) next.set('sort', params.sort)
                  if (!isActive) next.set('industry', value)
                  return (
                    <a
                      key={value}
                      href={`?${next.toString()}`}
                      className={`px-2 py-0.5 rounded text-xs font-medium border transition-colors ${isActive
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {label}
                    </a>
                  )
                })}
              </div>
            </div>

            {/* Sort */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Sort By</h3>
              <select
                name="sort"
                defaultValue={params.sort}
                className="w-full rounded-lg border-slate-200 bg-slate-50 text-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 p-2"
              >
                <option value="newest">Newest</option>
                <option value="top">Most Active</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              Apply Filters
            </button>
          </form>
        </aside>

        {/* ── MAIN CONTENT ─────────────────────────────────────────────── */}
        <div className="flex-grow flex flex-col min-w-0">

          {/* Header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Browse Problems</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Discover prompting challenges and the community&apos;s best solutions.
              </p>
            </div>
            <Link
              href="/create/problem"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm whitespace-nowrap self-start sm:self-auto"
            >
              + Create Problem
            </Link>
          </div>

          {/* Problem Cards */}
          {problems.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-200 rounded-2xl py-16 text-center">
              <p className="text-slate-400 mb-4">No problems found matching your criteria.</p>
              <Link href="/create/problem" className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold">
                Create the First Problem
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {problems.map((problem) => {
                const stats = problem.problem_stats?.[0] || problem.problem_stats || {}
                const totalPrompts = stats.total_prompts || 0
                const totalForks = stats.total_forks || 0
                const totalWorks = stats.total_works || 0
                const totalFails = stats.total_fails || 0
                const totalAttempts = totalWorks + totalFails
                const successRate = totalAttempts > 0 ? Math.round((totalWorks / totalAttempts) * 100) : null
                const difficulty = problem.difficulty as string | null
                const primaryTag = problem.industry || 'General'
                const activeAgo = timeAgo(problem.updated_at || problem.created_at)
                const topPrompt = problem.top_prompt
                const topPromptScore = topPrompt?.prompt_stats?.[0]?.quality_score ?? topPrompt?.prompt_stats?.quality_score ?? null
                const topPromptWorks = topPrompt?.prompt_stats?.[0]?.works_count ?? topPrompt?.prompt_stats?.works_count ?? 0
                const topPromptFails = topPrompt?.prompt_stats?.[0]?.fails_count ?? topPrompt?.prompt_stats?.fails_count ?? 0
                const topPromptTotal = topPromptWorks + topPromptFails
                const topPromptRate = topPromptTotal > 0 ? Math.round((topPromptWorks / topPromptTotal) * 100) : null

                return (
                  <Link
                    key={problem.id}
                    href={problemUrl({ id: problem.id, slug: problem.slug || '' })}
                    className="group block bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-blue-300 hover:shadow-md transition-all duration-150"
                  >
                    {/* Card top */}
                    <div className="px-5 pt-5 pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-grow min-w-0">
                          {/* Tags row */}
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded text-xs font-semibold border bg-blue-50 text-blue-700 border-blue-200 capitalize">
                              {primaryTag}
                            </span>
                            {difficulty && (
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold border uppercase tracking-wide ${difficultyColor[difficulty] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                {difficulty}
                              </span>
                            )}
                            {totalPrompts === 0 && (
                              <span className="px-2 py-0.5 rounded text-xs font-semibold border bg-amber-50 text-amber-700 border-amber-200">
                                No solutions yet
                              </span>
                            )}
                          </div>

                          {/* Title */}
                          <h2 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug mb-1">
                            {toDisplayString(problem.title)}
                          </h2>

                          {/* Description */}
                          <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                            {toDisplayString(problem.description)}
                          </p>
                        </div>

                        {/* Solve CTA */}
                        <div className="flex-shrink-0 pt-1">
                          <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 group-hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap">
                            Solve
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                            </svg>
                          </span>
                        </div>
                      </div>

                      {/* Stats row */}
                      <div className="flex items-center gap-4 mt-3 text-xs text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3-3-3z" />
                          </svg>
                          <span className="font-medium text-slate-600">{totalPrompts}</span> solution{totalPrompts !== 1 ? 's' : ''}
                        </span>
                        {totalForks > 0 && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                            <span className="font-medium text-slate-600">{totalForks}</span> forks
                          </span>
                        )}
                        {successRate !== null && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium text-green-600">{successRate}%</span> success rate
                          </span>
                        )}
                        <span className="flex items-center gap-1 ml-auto">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {activeAgo}
                        </span>
                      </div>
                    </div>

                    {/* ── Top Prompt Preview ─────────────────────────────── */}
                    {topPrompt && (
                      <div className="border-t border-slate-100 bg-slate-50 px-5 py-3">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                              Top Prompt
                            </span>
                          </div>

                          <div className="flex-grow min-w-0">
                            <p className="text-xs font-mono text-slate-600 line-clamp-2 leading-relaxed bg-white border border-slate-200 rounded-md px-2.5 py-1.5">
                              {truncate(topPrompt.system_prompt || topPrompt.title, 180)}
                            </p>
                          </div>

                          <div className="flex-shrink-0 flex flex-col items-end gap-1">
                            {topPromptScore !== null && topPromptScore > 0 && (
                              <span className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded px-2 py-0.5">
                                {topPromptScore} pts
                              </span>
                            )}
                            {topPromptRate !== null && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                topPromptRate >= 80
                                  ? 'text-green-700 bg-green-50 border-green-200'
                                  : topPromptRate >= 50
                                  ? 'text-yellow-700 bg-yellow-50 border-yellow-200'
                                  : 'text-red-700 bg-red-50 border-red-200'
                              }`}>
                                {topPromptRate}% works
                              </span>
                            )}
                          </div>
                        </div>

                        {(problem.expected_output || topPrompt.example_output) && (
                          <div className="mt-2 flex items-start gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex-shrink-0 mt-0.5">Output</span>
                            <p className="text-xs text-slate-500 line-clamp-1 font-mono bg-white border border-slate-200 rounded px-2 py-1 flex-grow">
                              {truncate(topPrompt.example_output || problem.expected_output, 120)}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Empty state teaser ─────────────────────────────── */}
                    {!topPrompt && totalPrompts === 0 && (
                      <div className="border-t border-dashed border-slate-200 bg-slate-50 px-5 py-3 flex items-center gap-2">
                        <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="text-xs text-slate-400">Be the first to submit a solution for this problem.</span>
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {problems.length > 0 && (
            <div className="mt-8 flex flex-col md:flex-row items-center justify-between border-t border-slate-200 pt-4 gap-4">
              <p className="text-sm text-slate-500">
                Showing <span className="font-medium text-slate-900">{start}</span> to{' '}
                <span className="font-medium text-slate-900">{end}</span> of{' '}
                <span className="font-medium text-slate-900">{safeTotal}</span> problems
              </p>
              <Pagination currentPage={currentPage} totalPages={pages} />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

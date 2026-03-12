import { getProblemBySlug } from '@/lib/actions/problems.actions'
import { listPromptsByProblem, type PromptSort } from '@/lib/actions/prompts.actions'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Suspense } from 'react'
import { promptUrl, problemUrl, extractDbSlug } from '@/lib/utils/prompt-url'
import { ProblemPromptsList } from '@/components/problems/ProblemPromptsList'

export const revalidate = 300

interface ProblemDetailPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ sort?: PromptSort }>
}


export default async function ProblemDetailPage({ params, searchParams }: ProblemDetailPageProps) {
  const { slug: slugParam } = await params
  const { sort = 'best' } = await searchParams

  const { dbSlug, shortId, isFullUuid } = extractDbSlug(slugParam)
  const problem = await getProblemBySlug(dbSlug, shortId, isFullUuid)

  if (!problem) notFound()

  // Canonical redirect
  const expectedSlugParam = `${problem.slug}-${problem.short_id}`
  if (slugParam !== expectedSlugParam) {
    redirect(problemUrl(problem))
  }

  const prompts = await listPromptsByProblem(problem.id, sort)

  // ─── Compute page-level metrics ─────────────────────────────────────────────
  const totalPrompts = prompts.length

  const bestScore = prompts.reduce((max: number, p: any) => {
    const s = p.prompt_stats?.[0]?.quality_score || 0
    return s > max ? s : max
  }, 0)

  const totalWorks = prompts.reduce((sum: number, p: any) => sum + (p.prompt_stats?.[0]?.works_count || 0), 0)
  const totalFails = prompts.reduce((sum: number, p: any) => sum + (p.prompt_stats?.[0]?.fails_count || 0), 0)
  const worksRate = (totalWorks + totalFails) > 0
    ? Math.round((totalWorks / (totalWorks + totalFails)) * 100)
    : null

  const totalCopies = prompts.reduce((sum: number, p: any) => sum + (p.prompt_stats?.[0]?.copy_count || 0), 0)

  const sortOptions: { value: PromptSort; label: string }[] = [
    { value: 'best', label: 'Best' },
    { value: 'top', label: 'Top Rated' },
    { value: 'most_improved', label: 'Most Improved' },
    { value: 'newest', label: 'Newest' },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* ── Breadcrumb ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Link href="/problems" className="hover:text-slate-600 transition-colors">Problems</Link>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-slate-600 font-medium truncate">{problem.title}</span>
        </div>

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-blue-50 via-white to-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-grow min-w-0">

              {/* Tag row */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {problem.industry && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-blue-100 text-blue-700 border-blue-200 capitalize">
                    {problem.industry}
                  </span>
                )}
                {problem.tags?.slice(0, 2).map((tag: string, i: number) => (
                  <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-slate-100 text-slate-600 border-slate-200">
                    {tag}
                  </span>
                ))}
                {problem.difficulty && (
                  <span className="bg-slate-100 text-slate-600 border-slate-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize">
                    {problem.difficulty}
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-bold text-slate-900 mb-3 leading-tight">
                {problem.title}
              </h1>
              <p className="text-slate-600 leading-relaxed max-w-2xl mb-4">
                {problem.description}
              </p>

              {/* Submission count */}
              <div className="flex items-center gap-1.5 text-sm text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3-3-3z" />
                </svg>
                <span className="font-semibold text-slate-700">{totalPrompts}</span> Prompt Submission{totalPrompts !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Add Prompt */}
            <div className="flex-shrink-0">
              <Link
                href={`/create/prompt?problem=${problem.id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Submission
              </Link>
            </div>
          </div>
        </div>

        {/* ── Performance Metrics ───────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4">
          {/* Best Score */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Best Score</span>
              <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <div className="text-4xl font-bold text-slate-900 mt-1">{totalPrompts > 0 ? bestScore : '—'}</div>
            <p className="text-xs text-slate-400 mt-2">Across all submissions</p>
          </div>

          {/* Works Rate */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Works Rate</span>
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-4xl font-bold text-slate-900 mt-1">
              {worksRate !== null ? `${worksRate}%` : '—'}
            </div>
            {worksRate !== null && (
              <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${worksRate}%` }} />
              </div>
            )}
            <p className="text-xs text-slate-400 mt-2">{totalWorks} works · {totalFails} fails</p>
          </div>

          {/* Total Copies */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Copies</span>
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-4xl font-bold text-slate-900 mt-1">{totalCopies}</div>
            <p className="text-xs text-slate-400 mt-2">Times copied by users</p>
          </div>
        </div>

        {/* ── Problem Instructions (if available) ───────────────────────── */}
        {(problem.real_world_context || problem.goal || problem.success_criteria?.length > 0) && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Problem Instructions
            </h2>
            {(problem.real_world_context || problem.goal) && (
              <p className="text-sm text-slate-700 leading-relaxed mb-4">
                {problem.real_world_context || problem.goal}
              </p>
            )}
            {problem.success_criteria?.length > 0 && (
              <ul className="space-y-1.5">
                {problem.success_criteria.map((c: any, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="text-blue-400 mt-0.5 font-bold">•</span>
                    {c.criterion}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ── Prompt Submissions ────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3-3-3z" />
              </svg>
              Prompt Submissions
              <span className="text-base font-normal text-slate-400">({totalPrompts})</span>
            </h2>

            {/* Sort pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-slate-400 mr-1">Sort by:</span>
              {sortOptions.map(({ value, label }) => (
                <Link
                  key={value}
                  href={`/problems/${problem.slug}?sort=${value}`}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${sort === value
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {prompts.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-200 rounded-2xl py-16 text-center">
              <svg className="w-10 h-10 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3-3-3z" />
              </svg>
              <p className="text-slate-400 text-sm mb-4">No prompts yet. Be the first!</p>
              <Link
                href={`/create/prompt?problem=${problem.id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-semibold"
              >
                Add the First Prompt
              </Link>
            </div>
          ) : (
            <Suspense fallback={<div className="text-slate-400 text-sm py-10 text-center">Loading...</div>}>
              <ProblemPromptsList prompts={prompts} problemSlug={`${problem.slug}-${problem.short_id}`} />
            </Suspense>
          )}
        </div>

      </div>
    </div>
  )
}
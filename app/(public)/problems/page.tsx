import { listProblems } from '@/lib/actions/problems.actions'
import Link from 'next/link'
import QualitySignals from '@/components/problems/QualitySignals'
import Pagination from '@/components/ui/Pagination'
import React from 'react'
import { problemUrl } from '@/lib/utils/prompt-url'

// Enable ISR with 2-minute revalidation
export const revalidate = 120

interface ProblemsPageProps {
  searchParams: Promise<{
    search?: string
    industry?: string
    sort?: 'newest' | 'top'
    page?: string
  }>
}

export default async function ProblemsPage({ searchParams }: ProblemsPageProps) {
  const params = await searchParams
  const currentPage = Number(params.page) || 1
  const limit = 5 // Adjusted to match the new UI pageSize

  const { data: problems, total, pages } = await listProblems({
    search: params.search || '',
    industry: params.industry || '',
    sort: params.sort || 'newest',
    page: currentPage,
    limit
  })

  // Calculate stats for pagination text
  const safeTotal = total || 0;
  const start = safeTotal === 0 ? 0 : (currentPage - 1) * limit + 1
  const end = Math.min(start + limit - 1, safeTotal)

  return (
    <div className="bg-background min-h-screen text-foreground flex flex-col pt-8">
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 w-full flex flex-col md:flex-row gap-8">

        {/* LEFT SIDEBAR - FILTERS */}
        <aside className="w-full md:w-64 flex-shrink-0 space-y-6">
          <form method="get" className="bg-card rounded border border-border p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Filters
            </h2>

            {/* Search filter map from top-header of new design */}
            <div className="mb-5">
              <h3 className="text-sm font-medium mb-2 text-foreground">
                Search
              </h3>
              <div className="relative">
                <input
                  type="text"
                  name="search"
                  defaultValue={params.search}
                  placeholder="Search prompts..."
                  className="w-full pl-3 pr-3 py-2 bg-muted border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground transition-colors"
                />
              </div>
            </div>

            {/* Difficulty - checkboxes */}
            <div className="mb-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Difficulty
              </h3>
              <div className="space-y-2">
                {[
                  { value: 'beginner', label: 'Beginner' },
                  { value: 'intermediate', label: 'Intermediate' },
                  { value: 'advanced', label: 'Advanced' },
                ].map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      name="difficulty"
                      value={value}
                      defaultChecked={(params as any).difficulty === value}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                    />
                    <span className="text-sm text-foreground group-hover:text-foreground">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Industry - tag pills */}
            <div className="mb-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Industry
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'fintech', label: 'Fintech' },
                  { value: 'healthcare', label: 'Healthcare' },
                  { value: 'edtech', label: 'EdTech' },
                  { value: 'saas', label: 'SaaS' },
                  { value: 'dev', label: 'Dev' },
                  { value: 'marketing', label: 'Marketing' },
                  { value: 'data', label: 'Data' },
                  { value: 'legal', label: 'Legal' },
                  { value: 'sales', label: 'Sales' },
                  { value: 'hr', label: 'HR' },
                ].map(({ value, label }) => {
                  const isActive = params.industry === value
                  const nextParams = new URLSearchParams()
                  if (params.search) nextParams.set('search', params.search)
                  if (params.sort) nextParams.set('sort', params.sort)
                  if (!isActive) nextParams.set('industry', value)
                  return (
                    <a
                      key={value}
                      href={`?${nextParams.toString()}`}
                      className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${isActive
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted text-foreground border-border hover:bg-muted/80'
                        }`}
                    >
                      {label}
                    </a>
                  )
                })}
              </div>
            </div>

            {/* Sort filter */}
            <div className="mb-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Sort By
              </h3>
              <select
                name="sort"
                defaultValue={params.sort}
                className="w-full rounded border-border bg-muted text-sm text-foreground focus:ring-primary focus:border-primary p-2"
              >
                <option value="newest">Newest</option>
                <option value="top">Most Solved / Top</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded text-sm font-medium transition-colors shadow-sm"
            >
              Apply Filters
            </button>
          </form>
        </aside>

        {/* MAIN CONTENT AREA */}
        <div className="flex-grow flex flex-col">

          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Browse Problems
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Discover coding problems and their prompt solutions from the community.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/create/problem"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
              >
                Create New
              </Link>
            </div>
          </div>

          <div className="bg-card border border-border rounded shadow-sm overflow-hidden flex-grow">

            {/* Table Header Row */}
            <div className="flex items-center px-5 py-3 border-b border-border bg-muted text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <div className="flex-grow">Problem</div>
              <div className="w-24 text-right">Action</div>
            </div>

            {/* Table Body */}
            {problems.length === 0 ? (
              <div className="text-center py-12 bg-card">
                <p className="text-muted-foreground mb-4">No problems found matching your criteria.</p>
                <Link
                  href="/create/problem"
                  className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                  Create the First Problem
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {problems.map((problem) => {
                  const tagList = problem.tags || []
                  const primaryTag = problem.industry || 'General'
                  const totalPrompts = problem.problem_stats?.total_prompts || 0
                  const totalForks = problem.problem_stats?.total_forks || 0
                  const totalWorks = problem.problem_stats?.total_works || 0
                  const totalFails = problem.problem_stats?.total_fails || 0
                  const totalAttempts = totalWorks + totalFails
                  const successRate = totalAttempts > 0 ? `${Math.round((totalWorks / totalAttempts) * 100)}%` : '--'
                  // Difficulty badge
                  const difficulty = problem.difficulty as string | null
                  const difficultyLabel = difficulty ? difficulty.charAt(0).toUpperCase() + difficulty.slice(1) : null
                  const difficultyColor: Record<string, string> = {
                    beginner: 'bg-green-100 text-green-700 border-green-200',
                    intermediate: 'bg-yellow-100 text-yellow-700 border-yellow-200',
                    advanced: 'bg-orange-100 text-orange-700 border-orange-200',
                    expert: 'bg-red-100 text-red-700 border-red-200',
                  }
                  const difficultyClass = difficulty ? (difficultyColor[difficulty] || 'bg-slate-100 text-slate-600 border-slate-200') : ''
                  // Active ago
                  const activeDate = new Date(problem.updated_at || problem.created_at)
                  const nowMs = Date.now()
                  const diffMs = nowMs - activeDate.getTime()
                  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
                  const diffDays = Math.floor(diffHours / 24)
                  const activeAgo = diffDays > 0 ? `${diffDays}d ago` : diffHours > 0 ? `${diffHours}h ago` : 'Just now'
                  // Smart icon selection based on title keywords (to match mockup exactly) or industry fallback
                  let iconType = 'integration_instructions'
                  const titleLower = problem.title?.toLowerCase() || ''

                  if (titleLower.includes('sql') || titleLower.includes('query')) {
                    iconType = 'integration_instructions'
                  } else if (titleLower.includes('e2e') || titleLower.includes('test') || titleLower.includes('bug')) {
                    iconType = 'bug_report'
                  } else if (titleLower.includes('security') || titleLower.includes('auth')) {
                    iconType = 'security'
                  } else if (titleLower.includes('explain') || titleLower.includes('docs') || titleLower.includes('document')) {
                    iconType = 'description'
                  } else if (titleLower.includes('deploy') || titleLower.includes('checklist')) {
                    iconType = 'fact_check'
                  } else {
                    switch (primaryTag.toLowerCase()) {
                      case 'dev': iconType = 'code'; break;
                      case 'marketing': iconType = 'campaign'; break; // No SVG provided, will fall to default
                      case 'content': iconType = 'edit_note'; break; // No SVG provided, will fall to default
                      case 'data': iconType = 'analytics'; break; // No SVG provided, will fall to default
                      case 'finance': iconType = 'account_balance_wallet'; break; // No SVG provided, will fall to default
                      case 'healthcare': iconType = 'medical_services'; break; // No SVG provided, will fall to default
                      case 'education': iconType = 'school'; break; // No SVG provided, will fall to default
                      case 'legal': iconType = 'gavel'; break; // No SVG provided, will fall to default
                      case 'sales': iconType = 'trending_up'; break; // No SVG provided, will fall to default
                      case 'support': iconType = 'support_agent'; break; // No SVG provided, will fall to default
                      case 'hr': iconType = 'groups'; break; // No SVG provided, will fall to default
                      case 'video': iconType = 'video_library'; break; // No SVG provided, will fall to default
                      default: iconType = 'integration_instructions';
                    }
                  }

                  const renderIcon = () => {
                    const baseClasses = "w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0"
                    switch (iconType) {
                      case 'bug_report':
                        return (
                          <svg className={baseClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 8h-3m-3-4v4m3 4h3m-3 4h3M4 8h3m3-4v4m-3 4H4m3 4H4m10-4v4a2 2 0 01-2 2h-4a2 2 0 01-2-2v-4m10 0V8a2 2 0 00-2-2h-4a2 2 0 00-2 2v4m10 0c0 1.1-.9 2-2 2h-4c-1.1 0-2-.9-2-2" />
                          </svg>
                        )
                      case 'security':
                        return (
                          <svg className={baseClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        )
                      case 'description':
                        return (
                          <svg className={baseClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )
                      case 'fact_check':
                        return (
                          <svg className={baseClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                        )
                      case 'code':
                        return (
                          <svg className={baseClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                          </svg>
                        )
                      case 'integration_instructions':
                      default:
                        // Book / Template icon matching the SQL query look
                        return (
                          <svg className={baseClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        )
                    }
                  }

                  return (
                    <div key={problem.id} className="group flex items-center gap-4 px-5 py-4 hover:bg-muted transition-colors">
                      {/* Left: icon + content */}
                      <div className="flex items-start gap-3 flex-grow min-w-0">
                        {renderIcon()}

                        <div className="min-w-0">
                          {/* Title + difficulty */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={problemUrl({ id: problem.id, slug: problem.slug || '' })}
                              className="text-base font-semibold text-foreground group-hover:text-primary transition-colors"
                            >
                              {problem.title}
                            </Link>
                            {difficultyLabel && (
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold border uppercase tracking-wide ${difficultyClass}`}>
                                {difficultyLabel}
                              </span>
                            )}
                          </div>

                          {/* Description */}
                          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                            {problem.description}
                          </p>

                          {/* Bottom meta row: tag • prompts • forks • active */}
                          <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-muted-foreground">
                            <span className="inline-flex items-center px-2 py-0.5 rounded font-medium border bg-blue-100 text-blue-800 border-blue-200 capitalize">
                              {primaryTag}
                            </span>

                            <span className="flex items-center gap-1">
                              {/* chat/prompts icon */}
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3-3-3z" /></svg>
                              {totalPrompts} Prompts
                            </span>

                            <span className="flex items-center gap-1">
                              {/* fork icon */}
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
                              {totalForks} Forks
                            </span>

                            <span className="flex items-center gap-1">
                              {/* clock icon */}
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              Active {activeAgo}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: SOLVE button */}
                      <div className="flex-shrink-0">
                        <Link
                          href={problemUrl({ id: problem.id, slug: problem.slug || '' })}
                          className="inline-flex items-center px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded transition-colors whitespace-nowrap tracking-wide"
                        >
                          SOLVE
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {problems.length > 0 && (
            <div className="mt-6 flex flex-col md:flex-row items-center justify-between border-t border-border pt-4 gap-4 md:gap-0">
              <p className="text-sm text-muted-foreground">
                Showing{' '}
                <span className="font-medium text-foreground">
                  {start}
                </span>{' '}
                to{' '}
                <span className="font-medium text-foreground">
                  {end}
                </span>{' '}
                of{' '}
                <span className="font-medium text-foreground">
                  {safeTotal}
                </span>{' '}
                results
              </p>

              <Pagination currentPage={currentPage} totalPages={pages} />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

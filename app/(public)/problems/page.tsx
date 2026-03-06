import { listProblems } from '@/lib/actions/problems.actions'
import Link from 'next/link'
import QualitySignals from '@/components/problems/QualitySignals'
import Pagination from '@/components/ui/Pagination'
import React from 'react'

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
    <div className="bg-slate-50 min-h-screen text-slate-900 flex flex-col pt-8">
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 w-full flex flex-col md:flex-row gap-8">

        {/* LEFT SIDEBAR - FILTERS */}
        <aside className="w-full md:w-64 flex-shrink-0 space-y-6">
          <form method="get" className="bg-white rounded border border-slate-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">
              Filters
            </h2>

            {/* Search filter map from top-header of new design */}
            <div className="mb-5">
              <h3 className="text-sm font-medium mb-2 text-slate-900">
                Search
              </h3>
              <div className="relative">
                <input
                  type="text"
                  name="search"
                  defaultValue={params.search}
                  placeholder="Search prompts..."
                  className="w-full pl-3 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 placeholder:text-slate-500 transition-colors"
                />
              </div>
            </div>

            {/* Preserving their industry filter */}
            <div className="mb-5">
              <h3 className="text-sm font-medium mb-2 text-slate-900">
                Industry
              </h3>
              <select
                name="industry"
                defaultValue={params.industry}
                className="w-full rounded border-slate-200 bg-slate-50 text-sm text-slate-900 focus:ring-blue-600 focus:border-blue-600 p-2"
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
            </div>

            {/* Sort filter */}
            <div className="mb-5">
              <h3 className="text-sm font-medium mb-2 text-slate-900">
                Sort By
              </h3>
              <select
                name="sort"
                defaultValue={params.sort}
                className="w-full rounded border-slate-200 bg-slate-50 text-sm text-slate-900 focus:ring-blue-600 focus:border-blue-600 p-2"
              >
                <option value="newest">Newest</option>
                <option value="top">Most Solved / Top</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors shadow-sm"
            >
              Apply Filters
            </button>
          </form>
        </aside>

        {/* MAIN CONTENT AREA */}
        <div className="flex-grow flex flex-col">

          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Browse Problems
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Discover coding problems and their prompt solutions from the community.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/create/problem"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
              >
                Create New
              </Link>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden flex-grow">

            {/* Table Header Row */}
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <div className="col-span-12 md:col-span-6 lg:col-span-7">Problem</div>
              <div className="hidden md:block md:col-span-3 lg:col-span-2 text-right">Metrics</div>
              <div className="hidden md:block md:col-span-3 lg:col-span-3 text-right">Activity</div>
            </div>

            {/* Table Body */}
            {problems.length === 0 ? (
              <div className="text-center py-12 bg-white">
                <p className="text-slate-500 mb-4">No problems found matching your criteria.</p>
                <Link
                  href="/create/problem"
                  className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Create the First Problem
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {problems.map((problem) => {
                  const tagList = problem.tags || []
                  const primaryTag = problem.industry || 'General'
                  const totalPrompts = problem.problem_stats?.total_prompts || 0
                  const totalWorks = problem.problem_stats?.total_works || 0
                  const totalFails = problem.problem_stats?.total_fails || 0
                  const totalAttempts = totalWorks + totalFails
                  const successRate = totalAttempts > 0 ? `${Math.round((totalWorks / totalAttempts) * 100)}%` : '--'
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
                    const baseClasses = "w-5 h-5 text-slate-500 mt-0.5 flex-shrink-0"
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
                    <div key={problem.id} className="group grid grid-cols-12 gap-4 p-4 hover:bg-slate-50 transition-colors items-center">
                      <div className="col-span-12 md:col-span-6 lg:col-span-7">
                        <div className="flex items-start gap-3">
                          {renderIcon()}

                          <div>
                            <Link
                              href={`/problems/${problem.slug}`}
                              className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors"
                            >
                              {problem.title}
                            </Link>

                            <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                              {problem.description}
                            </p>

                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border bg-blue-100 text-blue-800 border-blue-200 capitalize">
                                {primaryTag}
                              </span>
                              {problem.has_pinned_prompt && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border bg-yellow-100 text-yellow-800 border-yellow-200">
                                  Solved
                                </span>
                              )}
                              {tagList.slice(0, 2).map((tag: string, i: number) => (
                                <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border bg-gray-100 text-gray-800 border-gray-200">
                                  {tag}
                                </span>
                              ))}
                              {tagList.length > 2 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border bg-gray-100 text-gray-800 border-gray-200">
                                  +{tagList.length - 2} more
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-12 md:col-span-3 lg:col-span-2 flex md:flex-col md:items-end md:justify-center gap-4 md:gap-1 text-sm text-slate-500 mt-2 md:mt-0">
                        <div>
                          <span className="font-medium text-slate-900">
                            {totalPrompts}
                          </span>{' '}
                          Prompts
                        </div>
                        <div>
                          <span className="font-medium text-slate-900">
                            {successRate}
                          </span>{' '}
                          Success Rate
                        </div>
                      </div>

                      <div className="col-span-12 md:col-span-3 lg:col-span-3 flex md:flex-col md:items-end md:justify-center gap-4 md:gap-1 text-sm text-slate-500 mt-1 md:mt-0">
                        <div>
                          by <span className="text-slate-900">{problem.author?.display_name || problem.author?.username || 'Anonymous'}</span>
                        </div>
                        <div className="text-xs">
                          {new Date(problem.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {problems.length > 0 && (
            <div className="mt-6 flex flex-col md:flex-row items-center justify-between border-t border-slate-200 pt-4 gap-4 md:gap-0">
              <p className="text-sm text-slate-500">
                Showing{' '}
                <span className="font-medium text-slate-900">
                  {start}
                </span>{' '}
                to{' '}
                <span className="font-medium text-slate-900">
                  {end}
                </span>{' '}
                of{' '}
                <span className="font-medium text-slate-900">
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

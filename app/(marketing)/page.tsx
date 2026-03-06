import Link from 'next/link'
import { Metadata } from 'next'
import TopRatedPrompts from '@/components/home/TopRatedPrompts'
import { createClient } from '@/lib/supabase/server'

// Enable ISR with 1-minute revalidation
export const revalidate = 60

export const metadata: Metadata = {
  title: 'Promptvexity - Production-Ready Prompts for Real SaaS Problems',
  description: 'Built by indie founders, for indie founders. Discover, fork, and improve battle-tested AI prompts for financial data, support tickets, SQL generation, and more. Join 100+ builders evolving prompts through community collaboration.',
  keywords: [
    'AI prompts',
    'prompt engineering',
    'SaaS prompts',
    'production prompts',
    'prompt library',
    'AI for SaaS',
    'indie founders',
    'prompt evolution',
    'SQL generation prompts',
    'support ticket AI',
    'financial data AI',
    'prompt forking',
    'community prompts'
  ],
  openGraph: {
    title: 'Promptvexity - Production-Ready Prompts for Real SaaS Problems',
    description: 'Built by indie founders, for indie founders. Discover battle-tested AI prompts that solve real SaaS problems.',
    type: 'website',
    url: 'https://promptvexity.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Promptvexity - Production-Ready Prompts for Real SaaS Problems',
    description: 'Built by indie founders, for indie founders. Discover battle-tested AI prompts that solve real SaaS problems.',
  },
}

export default async function HomePage() {
  const supabase = await createClient()

  // Get social proof metrics
  const { count: userCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  const { count: promptCount } = await supabase
    .from('prompts')
    .select('*', { count: 'exact', head: true })
    .eq('visibility', 'public')

  const { count: forkCount } = await supabase
    .from('prompts')
    .select('*', { count: 'exact', head: true })
    .not('parent_prompt_id', 'is', null)

  return (
    <div className="bg-slate-50">
      {/* Hero Section */}
      <div className="hero">
        <div className="container mx-auto px-4 py-20 md:py-28 relative z-10">
          <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] items-center">
            {/* Left: Content */}
            <div className="text-center lg:text-left pv-animate-in pv-animate-delay-1">
              {/* Announcement Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 mb-6">
                <span className="text-lg">🔥</span>
                <span className="text-sm font-semibold text-slate-700">50+ Production Problems Added</span>
                <span className="text-xs text-slate-500">• Updated daily</span>
              </div>

              <h1 className="heroHeadline mb-6 text-slate-900">
                Production-ready prompts for real-world AI problems.
              </h1>

              <p className="text-xl text-slate-600 mb-8 leading-relaxed font-light">
                For teams and builders who rely on AI &mdash; and need it to work reliably.
              </p>

              {/* Concrete Example Block */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 rounded-xl p-6 mb-8 text-left shadow-sm">
                <p className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Real problems you&apos;ll solve:
                </p>
                <ul className="space-y-3 text-sm text-slate-700">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold mt-0.5">1</span>
                    <span><strong>Reduce hallucinations</strong> in financial summaries</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold mt-0.5">2</span>
                    <span><strong>Fix broken</strong> SQL generation</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold mt-0.5">3</span>
                    <span><strong>Improve</strong> support bot accuracy</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold mt-0.5">4</span>
                    <span><strong>Make content</strong> outputs consistent</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                <Link
                  href="/problems"
                  className="btnPrimary text-white font-semibold inline-flex items-center justify-center gap-2 text-base"
                >
                  Browse 50+ Problems
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link
                  href="/signup"
                  className="btnSecondary text-slate-700 font-semibold inline-flex items-center justify-center text-base"
                >
                  Start Free
                </Link>
              </div>

              {/* Social Proof */}
              <div className="flex flex-col sm:flex-row items-center gap-6 text-sm text-slate-600 justify-center lg:justify-start">
                <div className="flex -space-x-3">
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-blue-400 to-blue-600 shadow-md"></div>
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-purple-400 to-purple-600 shadow-md"></div>
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-green-400 to-green-600 shadow-md"></div>
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-amber-400 to-amber-600 shadow-md"></div>
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shadow-md">
                    +{Math.max(0, (userCount || 0) - 4)}
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{userCount || 0}+ indie founders</p>
                  <p className="text-xs text-slate-500">building better prompts daily</p>
                </div>
              </div>
            </div>

            {/* Right: Visual */}
            <div className="relative lg:translate-x-6 lg:-translate-y-2 pv-animate-in pv-animate-delay-2">
              {/* Prompt Evolution Visualization */}
              <div className="relative">
                <div className="card p-6 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Original Prompt</div>
                        <div className="text-sm font-semibold text-slate-900">v1.0</div>
                      </div>
                    </div>
                    <div className="px-2 py-1 rounded-md bg-slate-100 text-xs font-medium text-slate-600">
                      Basic
                    </div>
                  </div>
                  <p className="text-sm text-slate-700 mb-3">Generate SQL for user queries</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>12 views</span>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center my-2">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200">
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    <span className="text-xs font-semibold text-amber-700">3 forks</span>
                  </div>
                </div>

                <div className="card p-6 border-2 border-green-200 bg-gradient-to-br from-green-50 to-white shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs text-green-600 font-medium">Improved</div>
                        <div className="text-sm font-semibold text-slate-900">v4.2</div>
                      </div>
                    </div>
                    <div className="px-2 py-1 rounded-md bg-green-100 text-xs font-bold text-green-700">
                      98% Score
                    </div>
                  </div>
                  <p className="text-sm text-slate-700 mb-3 font-medium">Generate SQL with error handling + validation</p>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1 text-green-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-medium">Edge cases</span>
                    </div>
                    <div className="flex items-center gap-1 text-green-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span className="font-medium">Validation</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live indicator */}
              <div className="mt-6 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-green-200 rounded-lg shadow-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-slate-700"><strong className="font-semibold text-slate-900">{forkCount || 0}</strong> prompts improved</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Bar */}
      <div className="bg-white border-y border-slate-200 py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-8 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Free to use</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Commercial license</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Production-tested</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Updated daily</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gradient-to-br from-slate-50 to-white py-16 border-b border-slate-200">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">The numbers speak for themselves</h2>
            <p className="text-slate-600">Join a growing community of builders shipping AI features faster</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-blue-400 mb-2">
                {promptCount || 0}+
              </div>
              <div className="text-sm font-semibold text-slate-900 mb-1">Production Prompts</div>
              <div className="text-xs text-slate-500">Battle-tested in real SaaS</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-green-600 to-green-400 mb-2">
                {forkCount || 0}+
              </div>
              <div className="text-sm font-semibold text-slate-900 mb-1">Improvements Made</div>
              <div className="text-xs text-slate-500">Community iterations</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-purple-600 to-purple-400 mb-2">
                50+
              </div>
              <div className="text-sm font-semibold text-slate-900 mb-1">SaaS Problems</div>
              <div className="text-xs text-slate-500">Across 5 categories</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-600 to-amber-400 mb-2">
                {userCount || 0}+
              </div>
              <div className="text-sm font-semibold text-slate-900 mb-1">Active Builders</div>
              <div className="text-xs text-slate-500">Indie founders & teams</div>
            </div>
          </div>

          {/* Comparison */}
          <div className="mt-12 max-w-2xl mx-auto">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
              <p className="text-sm text-slate-700 mb-2">
                <span className="font-bold text-blue-600">Save 10+ hours</span> per prompt vs starting from scratch
              </p>
              <p className="text-xs text-slate-500">Based on community feedback from 100+ builders</p>
            </div>
          </div>
        </div>
      </div>

      <div className="section-divider"></div>

      {/* Featured Problems Showcase */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 mb-4">
              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              </svg>
              <span className="text-sm font-semibold text-amber-700">Most Forked This Week</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Problems Builders Are Solving Right Now</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Real production problems with battle-tested solutions. Fork, adapt, and ship faster.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Problem Card 1 */}
            <div className="card group hover:scale-[1.02] transition-transform">
              <div className="p-6 flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="px-2 py-1 rounded-md bg-blue-50 text-xs font-semibold text-blue-700">Financial</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    <span className="text-sm font-bold">4.9</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                  Prevent Hallucinated Financial Totals
                </h3>
                <p className="text-sm text-slate-600 mb-4 flex-grow">
                  When summarizing Stripe exports, ensure calculated totals match actual transaction data. Includes validation steps.
                </p>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Top Solution</span>
                    <span className="font-semibold text-slate-900">v3.1 - Chain of Thought</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                      <span className="font-medium text-slate-900">24 forks</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>98% accuracy</span>
                    </div>
                  </div>
                </div>

                <Link
                  href="/problems/prevent-hallucinated-financial-totals"
                  className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-sm font-semibold text-slate-900 transition-colors"
                >
                  View Solutions
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Problem Card 2 */}
            <div className="card group hover:scale-[1.02] transition-transform">
              <div className="p-6 flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <span className="px-2 py-1 rounded-md bg-purple-50 text-xs font-semibold text-purple-700">Support</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    <span className="text-sm font-bold">4.8</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-purple-600 transition-colors">
                  Extract SLA Breach Indicators
                </h3>
                <p className="text-sm text-slate-600 mb-4 flex-grow">
                  Identify support tickets at risk of SLA breach from messy thread history. Prioritize urgent responses automatically.
                </p>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Top Solution</span>
                    <span className="font-semibold text-slate-900">v2.4 - Few-Shot</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                      <span className="font-medium text-slate-900">18 forks</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>94% accuracy</span>
                    </div>
                  </div>
                </div>

                <Link
                  href="/problems/extract-sla-breach-indicators"
                  className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-sm font-semibold text-slate-900 transition-colors"
                >
                  View Solutions
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Problem Card 3 */}
            <div className="card group hover:scale-[1.02] transition-transform">
              <div className="p-6 flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                      </svg>
                    </div>
                    <span className="px-2 py-1 rounded-md bg-green-50 text-xs font-semibold text-green-700">API/Dev</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    <span className="text-sm font-bold">4.9</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-green-600 transition-colors">
                  Generate Safe Stripe Webhook SQL
                </h3>
                <p className="text-sm text-slate-600 mb-4 flex-grow">
                  Convert webhook payloads to SQL queries with built-in injection prevention and type validation for PostgreSQL.
                </p>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Top Solution</span>
                    <span className="font-semibold text-slate-900">v4.0 - Validated</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                      <span className="font-medium text-slate-900">31 forks</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>99% safe</span>
                    </div>
                  </div>
                </div>

                <Link
                  href="/problems/generate-safe-stripe-webhook-sql"
                  className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-sm font-semibold text-slate-900 transition-colors"
                >
                  View Solutions
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          <div className="text-center mt-10">
            <Link
              href="/problems"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-b from-[#2563EB] to-[#1D4ED8] text-white font-semibold shadow-lg hover:shadow-xl transition-shadow"
            >
              Browse All 50+ Problems
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      <div className="section-divider"></div>

      {/* How It Works - Enhanced */}
      <div className="py-20 bg-gradient-to-br from-slate-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="label mb-2">The Evolution Process</div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">How Prompts Evolve on Promptvexity</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              From problem to production in 4 steps. No guesswork, just systematic improvement.
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            {/* Process Steps */}
            <div className="grid md:grid-cols-4 gap-8 relative">
              {/* Connecting Line */}
              <div className="hidden md:block absolute top-12 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-200 via-amber-200 to-green-200 z-0"></div>

              {/* Step 1 */}
              <div className="relative z-10">
                <div className="processNode problem active mx-auto mb-6">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">1. Pick a Real Problem</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Browse 50+ production SaaS problems. Each has context, examples, and test cases.
                  </p>
                  <Link href="/problems" className="text-sm text-blue-600 font-semibold hover:text-blue-700 inline-flex items-center gap-1">
                    Try it now
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative z-10">
                <div className="processNode compare mx-auto mb-6">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">2. Compare Solutions</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    See multiple approaches side-by-side. Check scores, fork counts, and real results.
                  </p>
                  <Link href="/compare" className="text-sm text-amber-600 font-semibold hover:text-amber-700 inline-flex items-center gap-1">
                    See example
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative z-10">
                <div className="processNode fork mx-auto mb-6">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">3. Fork & Adapt</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    One-click fork. Tweak for your use case. Document what you changed and why.
                  </p>
                  <button className="text-sm text-green-600 font-semibold hover:text-green-700 inline-flex items-center gap-1">
                    Learn forking
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative z-10">
                <div className="processNode mx-auto mb-6" style={{ background: 'radial-gradient(circle at top left, #f0f9ff, #e0f2fe)' }}>
                  <svg className="w-6 h-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">4. Ship to Production</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Copy the prompt. Test in your app. Share improvements back to help others.
                  </p>
                  <button className="text-sm text-sky-600 font-semibold hover:text-sky-700 inline-flex items-center gap-1">
                    Integration guide
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Time Savings Callout */}
            <div className="mt-16 max-w-3xl mx-auto">
              <div className="card p-8 text-center bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-blue-200 mb-4">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-semibold text-slate-900">Average Time Saved</span>
                </div>
                <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
                  10+ hours
                </p>
                <p className="text-slate-600">
                  per prompt vs starting from scratch. That's <strong className="text-slate-900">$500-2000 in dev time</strong> for most teams.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="section-divider"></div>

      {/* Top Rated Prompts Section */}
      <div className="floatingSection depthLayer1">
        <div className="container mx-auto px-4 pt-16 md:pt-20 py-16">
          <div className="text-center mb-12">
            <div className="label mb-2">Community Validated</div>
            <h2 className="text-3xl font-bold mb-4 text-slate-900">Top-Rated Prompts (By Real Problems)</h2>
            <p className="text-slate-600">Ranked by community testing, forks, and votes — not hype.</p>
          </div>
          <TopRatedPrompts />
        </div>
      </div>

      <div className="section-divider"></div>

      {/* Comparison Table */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="label mb-2">Why Choose Promptvexity</div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Stop Reinventing the Wheel</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              See how Promptvexity compares to building prompts from scratch or using generic playgrounds
            </p>
          </div>

          <div className="max-w-5xl mx-auto overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-900">Feature</th>
                  <th className="text-center py-4 px-6">
                    <div className="inline-flex flex-col items-center">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-2">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <span className="text-sm font-bold text-slate-900">Promptvexity</span>
                    </div>
                  </th>
                  <th className="text-center py-4 px-6 text-sm font-semibold text-slate-600">From Scratch</th>
                  <th className="text-center py-4 px-6 text-sm font-semibold text-slate-600">ChatGPT Playground</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6 text-sm font-medium text-slate-900">Production-tested prompts</td>
                  <td className="py-4 px-6 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 border border-green-200">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-semibold text-green-700">100+</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-sm font-semibold text-red-700">None</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-sm font-semibold text-red-700">None</span>
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6 text-sm font-medium text-slate-900">Fork & improve existing solutions</td>
                  <td className="py-4 px-6 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 border border-green-200">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-semibold text-green-700">Yes</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-sm font-semibold text-red-700">No</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-sm font-semibold text-red-700">No</span>
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6 text-sm font-medium text-slate-900">Community validation & voting</td>
                  <td className="py-4 px-6 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 border border-green-200">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-semibold text-green-700">Yes</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-sm font-semibold text-red-700">No</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-sm font-semibold text-red-700">No</span>
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6 text-sm font-medium text-slate-900">Real SaaS problem categories</td>
                  <td className="py-4 px-6 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 border border-green-200">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-semibold text-green-700">50+</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200">
                      <span className="text-sm font-semibold text-amber-700">DIY</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200">
                      <span className="text-sm font-semibold text-amber-700">Generic</span>
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6 text-sm font-medium text-slate-900">Time to production</td>
                  <td className="py-4 px-6 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 border border-green-200">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="text-sm font-semibold text-green-700">Minutes</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-semibold text-red-700">Hours/Days</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200">
                      <span className="text-sm font-semibold text-amber-700">Hours</span>
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors bg-blue-50/50">
                  <td className="py-4 px-6 text-sm font-bold text-slate-900">Cost</td>
                  <td className="py-4 px-6 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg">
                      <span className="text-lg font-black text-white">FREE</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="text-sm font-semibold text-slate-600">$500-2000 in dev time</span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="text-sm font-semibold text-slate-600">Free + dev time</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="text-center mt-10">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-gradient-to-b from-[#2563EB] to-[#1D4ED8] text-white font-bold shadow-lg hover:shadow-xl transition-shadow"
            >
              Start Using Promptvexity Free
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      <div className="section-divider"></div>

      {/* FAQ Section */}
      <div className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="label mb-2">Got Questions?</div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Everything you need to know about using Promptvexity
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {/* FAQ Item 1 */}
            <details className="card p-6 cursor-pointer group">
              <summary className="flex items-center justify-between font-semibold text-slate-900 list-none">
                <span className="text-lg">How is this different from other prompt libraries?</span>
                <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="mt-4 text-slate-600 leading-relaxed">
                <p className="mb-3">
                  Most prompt libraries are just collections of examples. Promptvexity is built around <strong className="text-slate-900">real SaaS problems</strong> with:
                </p>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span><strong>Fork & improve</strong> - Build on what works instead of starting from scratch</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span><strong>Community validation</strong> - See what actually works in production</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span><strong>Evolution tracking</strong> - Watch how prompts improve over time</span>
                  </li>
                </ul>
              </div>
            </details>

            {/* FAQ Item 2 */}
            <details className="card p-6 cursor-pointer group">
              <summary className="flex items-center justify-between font-semibold text-slate-900 list-none">
                <span className="text-lg">Can I use these prompts commercially?</span>
                <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="mt-4 text-slate-600 leading-relaxed">
                <p className="mb-3">
                  <strong className="text-green-600">Yes, absolutely!</strong> All prompts on Promptvexity are free to use commercially. You can:
                </p>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Use them in your SaaS product</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Modify them for your needs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Ship them to production</span>
                  </li>
                </ul>
                <p className="mt-3 text-sm">
                  No attribution required, though we appreciate it when you share improvements back to help the community!
                </p>
              </div>
            </details>

            {/* FAQ Item 3 */}
            <details className="card p-6 cursor-pointer group">
              <summary className="flex items-center justify-between font-semibold text-slate-900 list-none">
                <span className="text-lg">How do forks work?</span>
                <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="mt-4 text-slate-600 leading-relaxed">
                <p className="mb-3">
                  Forking is like Git for prompts. When you fork a prompt:
                </p>
                <ol className="space-y-3 ml-4">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1</span>
                    <span>You get a copy you can edit without affecting the original</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">2</span>
                    <span>The fork history is preserved so others can see the evolution</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">3</span>
                    <span>You can document what you changed and why</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">4</span>
                    <span>The community can vote on which version works best</span>
                  </li>
                </ol>
              </div>
            </details>

            {/* FAQ Item 4 */}
            <details className="card p-6 cursor-pointer group">
              <summary className="flex items-center justify-between font-semibold text-slate-900 list-none">
                <span className="text-lg">Is it really free?</span>
                <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="mt-4 text-slate-600 leading-relaxed">
                <p className="mb-3">
                  <strong className="text-slate-900">Yes!</strong> Promptvexity is free to use with no credit card required. You get:
                </p>
                <ul className="space-y-2 ml-4 mb-4">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Access to all 50+ problem sets</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Unlimited forking and voting</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Commercial use license</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Community support</span>
                  </li>
                </ul>
                <p className="text-sm">
                  We'll introduce Pro features later (team workspaces, private prompts, analytics) but the core platform will always be free.
                </p>
              </div>
            </details>

            {/* FAQ Item 5 */}
            <details className="card p-6 cursor-pointer group">
              <summary className="flex items-center justify-between font-semibold text-slate-900 list-none">
                <span className="text-lg">What if a prompt doesn't work for me?</span>
                <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="mt-4 text-slate-600 leading-relaxed">
                <p className="mb-3">
                  That's the beauty of the fork system! If a prompt doesn't work for your specific use case:
                </p>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">1.</span>
                    <span><strong>Fork it</strong> and adapt it to your needs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">2.</span>
                    <span><strong>Document your changes</strong> so others can learn</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">3.</span>
                    <span><strong>Share it back</strong> to help the community</span>
                  </li>
                </ul>
                <p className="mt-3">
                  You can also check other forks of the same problem to see different approaches. That's how the community improves prompts over time!
                </p>
              </div>
            </details>

            {/* FAQ Item 6 */}
            <details className="card p-6 cursor-pointer group">
              <summary className="flex items-center justify-between font-semibold text-slate-900 list-none">
                <span className="text-lg">What models do these prompts work with?</span>
                <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="mt-4 text-slate-600 leading-relaxed">
                <p className="mb-3">
                  Most prompts are tested with popular models like:
                </p>
                <ul className="space-y-2 ml-4 mb-4">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                    <span><strong>GPT-4</strong> and <strong>GPT-4o</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-600"></span>
                    <span><strong>Claude 3.5 Sonnet</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    <span><strong>Llama 3</strong></span>
                  </li>
                </ul>
                <p>
                  Each prompt page shows which models it's been tested with and their performance scores. You can filter by model to find prompts optimized for your setup.
                </p>
              </div>
            </details>
          </div>

          <div className="text-center mt-12">
            <p className="text-slate-600 mb-4">Still have questions?</p>
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700"
            >
              Check out our documentation
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 border-t border-slate-200 py-24 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-200 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 mb-6 shadow-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-sm"></div>
            <span className="text-sm text-blue-800 font-semibold">Join {userCount || 0}+ builders already using Promptvexity</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-black mb-6 text-slate-900">
            Stop guessing. <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Start evolving.</span>
          </h2>

          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
            Join thousands of indie founders building better AI features with production-ready prompts
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/problems"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-b from-[#2563EB] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1E40AF] text-white font-bold rounded-lg shadow-lg shadow-blue-600/25 transition-transform hover:scale-105"
            >
              Browse 50+ Problems
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 font-bold rounded-lg shadow-md transition-all"
            >
              Sign Up Free
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-slate-600 text-sm font-medium">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Free forever</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Start forking in minutes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

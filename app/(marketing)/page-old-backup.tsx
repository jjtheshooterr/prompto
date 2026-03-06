import Link from 'next/link'
import { Metadata } from 'next'
import TopRatedPrompts from '@/components/home/TopRatedPrompts'
import { createClient } from '@/lib/supabase/server'

// Enable ISR with 1-minute revalidation for homepage
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
      {/* Hero Section with Asymmetric Layout */}
      <div className="hero">
        <div className="container mx-auto px-4 py-20 md:py-24 relative z-10">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] items-center">
            {/* Left: Content */}
            <div className="text-center lg:text-left pv-animate-in pv-animate-delay-1">
              <div className="text-[11px] tracking-[0.22em] uppercase text-slate-500/80 mb-4">Prompt Evolution Platform</div>
              <h1 className="heroHeadline mb-6 text-slate-900">
                Production-ready prompts for real SaaS problems
              </h1>
              <p className="text-xl text-slate-600 mb-4 leading-relaxed font-light">
                Built by indie founders, for indie founders
              </p>
              
              {/* Concrete Example Block */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 mb-8 text-left">
                <p className="text-sm font-medium text-slate-700 mb-3">Example problems you&apos;ll find here:</p>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Reduce hallucinations in financial summaries</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Extract structured data from messy support tickets</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Generate Stripe webhook SQL safely</span>
                  </li>
                </ul>
              </div>
              
              <div className="flex gap-4 justify-center lg:justify-start mb-8">
                <Link
                  href="/problems"
                  className="btnPrimary text-white font-medium inline-flex items-center gap-2"
                >
                  Browse Problems
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link
                  href="/signup"
                  className="btnSecondary text-slate-700 font-medium"
                >
                  Sign Up Free
                </Link>
              </div>
              
              {/* Social Proof */}
              <div className="flex items-center gap-6 text-sm text-slate-500 justify-center lg:justify-start">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br from-blue-400 to-blue-600"></div>
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br from-purple-400 to-purple-600"></div>
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br from-green-400 to-green-600"></div>
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br from-amber-400 to-amber-600"></div>
                </div>
                <p className="font-medium">
                  <span className="text-slate-900 font-semibold">{userCount || 0}+</span> indie founders building better prompts
                </p>
              </div>
            </div>

            {/* Right: Process Evolution Visual */}
            <div className="relative lg:translate-x-6 lg:-translate-y-2 pv-animate-in pv-animate-delay-2">
              {/* Hero Moment: Prompt Evolution Visualization */}
              <div className="comparisonVisual mb-8">
                <div className="promptCard pv-animate-in pv-animate-delay-2">
                  <div className="text-xs text-slate-500 mb-2">Original Prompt</div>
                  <div className="text-sm font-medium text-slate-700">Generate SQL for user queries</div>
                  <div className="text-xs text-slate-400 mt-2">Basic approach</div>
                </div>

                <div className="diffLine"></div>

                <div className="promptCard highlighted pv-improved-card pv-animate-in pv-animate-delay-3">
                  <div className="text-xs text-blue-600 mb-2 pv-pulse-once">Improved via 3 forks</div>
                  <div className="text-sm font-medium text-slate-700">Generate SQL with error handling</div>
                  <div className="text-xs text-green-600 mt-2">+Edge cases +Validation</div>
                </div>

                <div className="forkArrow">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>

              {/* Process Evolution Path */}
              <div className="processPath relative h-16 mb-4">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 60">
                  <path
                    className="pv-line-draw"
                    style={{ "--pv-dash": "320" } as React.CSSProperties}
                    d="M30 30 Q100 30 150 30 Q200 30 270 30"
                    stroke="rgba(37,99,235,0.4)"
                    strokeWidth="2"
                    fill="none"
                  />
                  <path
                    className="pv-line-draw"
                    style={{ "--pv-dash": "260", animationDelay: "80ms" } as React.CSSProperties}
                    d="M150 30 L180 20"
                    stroke="rgba(245,158,11,0.6)"
                    strokeWidth="2"
                    fill="none"
                  />
                  <path
                    className="pv-line-draw"
                    style={{ "--pv-dash": "340", animationDelay: "140ms" } as React.CSSProperties}
                    d="M180 20 Q220 20 260 25"
                    stroke="rgba(34,197,94,0.6)"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>

                <div className="flex justify-between items-center relative z-10">
                  <div className="processNode problem active">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="processNode compare">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="processNode fork">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="flex justify-between text-xs text-slate-500">
                <span>Pick Problem</span>
                <span>Compare</span>
                <span>Fork & Improve</span>
              </div>

              {/* Live indicator */}
              <div className="mt-6 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-700 font-medium">{forkCount || 0} prompts improved</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-y border-slate-200 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 mb-1">{promptCount || 0}+</div>
              <div className="text-sm text-slate-600">Production Prompts</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 mb-1">{forkCount || 0}+</div>
              <div className="text-sm text-slate-600">Prompt Improvements</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 mb-1">50+</div>
              <div className="text-sm text-slate-600">SaaS Problems</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 mb-1">{userCount || 0}+</div>
              <div className="text-sm text-slate-600">Active Builders</div>
            </div>
          </div>
        </div>
      </div>

      <div className="section-divider"></div>

      {/* Top Rated Prompts Section - Floating */}
      <div className="floatingSection depthLayer1">
        <div className="container mx-auto px-4 pt-16 md:pt-20 py-16">
          <div className="text-center mb-12">
            <div className="text-[11px] tracking-[0.22em] uppercase text-slate-500/80 mb-2">Community Validated</div>
            <h2 className="text-3xl font-semibold mb-4 text-slate-900">Top-Rated Prompts (By Real Problems)</h2>
            <p className="text-slate-600">Ranked by community testing, forks, and votes — not hype.</p>
          </div>
          <TopRatedPrompts />
        </div>
      </div>

      <div className="section-divider"></div>

      {/* Why Different Section - Framed */}
      <div className="bg-white py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="sectionFrame">
            <div className="text-center mb-12">
              <div className="text-[11px] tracking-[0.22em] uppercase text-slate-500/80 mb-2">Transparency Over Hype</div>
              <h2 className="text-3xl font-semibold mb-4 text-slate-900 forkLine">Why Promptvexity Is Different</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-slate-900">Problem-First</h3>
                <p className="text-slate-600">
                  Prompts are organized by problems — not categories. You don&apos;t browse prompts.
                  You solve real tasks.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-slate-900">Compare & Fork</h3>
                <p className="text-slate-600">
                  See multiple approaches side-by-side. Fork prompts to improve them instead of
                  starting from scratch.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-slate-900">Community-Tested</h3>
                <p className="text-slate-600">
                  Failures are visible. Improvements are documented over time. Trust comes from transparency,
                  not popularity.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="section-divider"></div>

      {/* New User Guide Section */}
      <div className="container mx-auto px-4 py-16 md:py-20 depthLayer3">
        <div className="bg-blue-50 rounded-lg p-8">
          <div className="text-center mb-8">
            <div className="text-[11px] tracking-[0.22em] uppercase text-slate-500/80 mb-2">Start Here</div>
            <h2 className="text-3xl font-semibold mb-4 text-slate-900">New here? Start with proven problems</h2>
            <p className="text-slate-600">These problems already have tested prompts and active improvements.</p>
            <p className="text-sm text-slate-500 mt-2">Pinned prompts reflect current best solutions — not permanent answers.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            <Link href="/problems/generate-sql-queries" className="card p-6 hover:shadow-md transition-shadow flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-900">Generate SQL Queries</h3>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">Recommended</span>
              </div>
              <p className="text-sm text-slate-600 mb-3 flex-1">Convert natural language to working SQL with proper syntax</p>
              <div className="flex items-center justify-between mt-auto">
                <span className="text-blue-600 text-sm font-medium">View Prompts →</span>
                <span className="text-xs text-slate-500">7 prompts</span>
              </div>
            </Link>
            <Link href="/problems/code-review" className="card p-6 hover:shadow-md transition-shadow flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-900">Code Review Assistant</h3>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">Best for: Teams</span>
              </div>
              <p className="text-sm text-slate-600 mb-3 flex-1">Catch bugs and improve code quality systematically</p>
              <div className="flex items-center justify-between mt-auto">
                <span className="text-blue-600 text-sm font-medium">View Prompts →</span>
                <span className="text-xs text-slate-500">4 prompts</span>
              </div>
            </Link>
            <Link href="/problems/email-personalization" className="card p-6 hover:shadow-md transition-shadow flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-900">Email Personalization</h3>
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-medium">Most Forked</span>
              </div>
              <p className="text-sm text-slate-600 mb-3 flex-1">Sales outreach that adapts to recipient context</p>
              <div className="flex items-center justify-between mt-auto">
                <span className="text-blue-600 text-sm font-medium">View Prompts →</span>
                <span className="text-xs text-slate-500">6 prompts</span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="section-divider"></div>

      {/* How It Works Section - Process Evolution */}
      <div className="bg-white py-16 md:py-20 depthLayer2">
        <div className="container mx-auto px-4">
          <div className="sectionFrame">
            <div className="text-center mb-16">
              <div className="text-[11px] tracking-[0.22em] uppercase text-slate-500/80 mb-2">The Evolution Process</div>
              <h2 className="text-3xl font-semibold mb-4 text-slate-900 forkLine">How Prompts Evolve on Promptvexity</h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Watch how prompts branch, improve, and adapt through community collaboration
              </p>
            </div>

            {/* Process Evolution Visualization */}
            <div className="max-w-5xl mx-auto">
              <div className="relative">
                {/* Main Evolution Path */}
                <svg className="w-full h-32 mb-8" viewBox="0 0 800 120" fill="none">
                  {/* Background path */}
                  <path
                    d="M50 60 Q200 60 350 60 Q500 60 650 60 Q700 60 750 60"
                    stroke="rgba(148,163,184,0.3)"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="5,5"
                  />

                  {/* Active evolution path */}
                  <path
                    className="pv-line-draw"
                    style={{ "--pv-dash": "400" } as React.CSSProperties}
                    d="M50 60 Q200 60 350 60"
                    stroke="url(#evolutionGradient)"
                    strokeWidth="3"
                    fill="none"
                  />

                  {/* Fork branches */}
                  <path
                    className="pv-line-draw"
                    style={{ "--pv-dash": "60", animationDelay: "200ms" } as React.CSSProperties}
                    d="M350 60 L400 40"
                    stroke="rgba(245,158,11,0.6)"
                    strokeWidth="2"
                    fill="none"
                  />
                  <path
                    className="pv-line-draw"
                    style={{ "--pv-dash": "60", animationDelay: "240ms" } as React.CSSProperties}
                    d="M350 60 L400 80"
                    stroke="rgba(245,158,11,0.6)"
                    strokeWidth="2"
                    fill="none"
                  />
                  <path
                    className="pv-line-draw"
                    style={{ "--pv-dash": "220", animationDelay: "300ms" } as React.CSSProperties}
                    d="M400 40 Q500 40 600 50"
                    stroke="rgba(34,197,94,0.6)"
                    strokeWidth="2"
                    fill="none"
                  />

                  {/* Gradient definition */}
                  <defs>
                    <linearGradient id="evolutionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="rgba(37,99,235,0.8)" />
                      <stop offset="50%" stopColor="rgba(245,158,11,0.8)" />
                      <stop offset="100%" stopColor="rgba(34,197,94,0.8)" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Process Nodes with Enhanced Design */}
                <div className="grid grid-cols-4 gap-8 relative -mt-20">
                  <div className="text-center">
                    <div className="processNode problem active mx-auto mb-4">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold mb-2 text-slate-900">Real Problem</h3>
                    <p className="text-sm text-slate-600">Start with a task that needs solving</p>
                  </div>

                  <div className="text-center">
                    <div className="processNode compare mx-auto mb-4">
                      <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold mb-2 text-slate-900">Compare Solutions</h3>
                    <p className="text-sm text-slate-600">See different approaches side-by-side</p>
                  </div>

                  <div className="text-center">
                    <div className="processNode fork mx-auto mb-4">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold mb-2 text-slate-900">Fork & Improve</h3>
                    <p className="text-sm text-slate-600">Build on what works, document changes</p>
                  </div>

                  <div className="text-center">
                    <div className="processNode mx-auto mb-4" style={{ background: 'radial-gradient(circle at top left, #f0f9ff, #e0f2fe)' }}>
                      <svg className="w-6 h-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold mb-2 text-slate-900">Evolution</h3>
                    <p className="text-sm text-slate-600">Community validates the best solutions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="section-divider"></div>

      {/* Who This Is For */}
      <div className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="text-[11px] tracking-[0.22em] uppercase text-slate-500/80 mb-2">Built For Builders</div>
            <h2 className="text-3xl font-semibold mb-4 text-slate-900">Who Uses Promptvexity</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              From solo founders to product teams, anyone building with AI can benefit from systematic prompt improvement
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Indie Founders */}
            <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Indie SaaS Founders</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                Stop reinventing the wheel. Find proven prompts for common SaaS problems like support ticket classification, SQL generation, and email personalization.
              </p>
              <div className="text-sm text-slate-500">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Save hours of prompt iteration</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Learn from real production use cases</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Fork and adapt to your needs</span>
                </div>
              </div>
            </div>

            {/* AI Engineers */}
            <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">AI Engineers</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                Test prompt variations systematically. Compare outputs side-by-side and track which changes actually improve results in production.
              </p>
              <div className="text-sm text-slate-500">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Version control for prompts</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>A/B test different approaches</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Document what works and why</span>
                </div>
              </div>
            </div>

            {/* Product Teams */}
            <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Product Teams</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                Collaborate on prompt libraries. Share what works across your team and maintain consistency as your AI features evolve.
              </p>
              <div className="text-sm text-slate-500">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Team workspaces</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Shared prompt libraries</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Track improvements over time</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="section-divider"></div>

      {/* Philosophy Section */}
      <div className="container mx-auto px-4 pt-14 md:pt-16 py-16">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-lg text-slate-600 leading-relaxed">
            Prompt engineering isn&apos;t magic. Prompts change. Models change. Context matters.
          </p>
          <p className="text-lg text-slate-600 leading-relaxed mt-4">
            Promptvexity embraces this reality by making prompt evolution visible.
          </p>
        </div>
      </div>

      <div className="section-divider"></div>

      {/* Use Cases / Problem Categories */}
      <div className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="text-[11px] tracking-[0.22em] uppercase text-slate-500/80 mb-2">Real SaaS Problems</div>
            <h2 className="text-3xl font-semibold mb-4 text-slate-900">50+ Production-Ready Problem Sets</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Every problem includes tested prompts, fork history, and community improvements
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Financial */}
            <div className="group bg-slate-50 rounded-lg p-6 border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Financial Data</h3>
                  <p className="text-xs text-slate-500">10 problems</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-3">
                Stripe export summaries, expense categorization, fraud detection, revenue forecasting
              </p>
              <Link href="/problems?category=financial" className="text-sm text-blue-600 font-medium hover:text-blue-700 inline-flex items-center gap-1">
                Explore problems
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Support */}
            <div className="group bg-slate-50 rounded-lg p-6 border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Support Tickets</h3>
                  <p className="text-xs text-slate-500">10 problems</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-3">
                Churn risk classification, SLA breach detection, sentiment analysis, auto-responses
              </p>
              <Link href="/problems?category=support" className="text-sm text-purple-600 font-medium hover:text-purple-700 inline-flex items-center gap-1">
                Explore problems
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* API/Dev */}
            <div className="group bg-slate-50 rounded-lg p-6 border border-slate-200 hover:border-green-300 hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">API & Development</h3>
                  <p className="text-xs text-slate-500">10 problems</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-3">
                SQL generation, webhook validation, idempotent migrations, error handling
              </p>
              <Link href="/problems?category=api" className="text-sm text-green-600 font-medium hover:text-green-700 inline-flex items-center gap-1">
                Explore problems
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Content */}
            <div className="group bg-slate-50 rounded-lg p-6 border border-slate-200 hover:border-amber-300 hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Content Operations</h3>
                  <p className="text-xs text-slate-500">10 problems</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-3">
                SEO meta generation, changelog creation, refund emails, help articles
              </p>
              <Link href="/problems?category=content" className="text-sm text-amber-600 font-medium hover:text-amber-700 inline-flex items-center gap-1">
                Explore problems
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Development */}
            <div className="group bg-slate-50 rounded-lg p-6 border border-slate-200 hover:border-red-300 hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Dev Workflows</h3>
                  <p className="text-xs text-slate-500">10 problems</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-3">
                PR descriptions, test generation, commit messages, code review
              </p>
              <Link href="/problems?category=development" className="text-sm text-red-600 font-medium hover:text-red-700 inline-flex items-center gap-1">
                Explore problems
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* View All */}
            <div className="group bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 border-2 border-dashed border-blue-200 hover:border-blue-400 transition-all flex flex-col items-center justify-center text-center">
              <svg className="w-12 h-12 text-blue-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <h3 className="font-bold text-slate-900 mb-2">Browse All Problems</h3>
              <p className="text-sm text-slate-600 mb-4">
                Discover all 50+ production-ready problem sets
              </p>
              <Link href="/problems" className="text-sm text-blue-600 font-bold hover:text-blue-700 inline-flex items-center gap-1">
                View all →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-24 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-blue-300 font-medium">Join {userCount || 0}+ builders already using Promptvexity</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Stop guessing. <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Start evolving.</span>
          </h2>
          
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            Join thousands of indie founders building better AI features with production-ready prompts
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/problems"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg shadow-blue-600/25 transition-all hover:scale-105"
            >
              Browse Problems
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-lg shadow-lg transition-all"
            >
              Sign Up Free
            </Link>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-slate-400 text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Free to explore</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
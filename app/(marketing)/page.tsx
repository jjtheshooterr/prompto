import Link from 'next/link'
import TopRatedPrompts from '@/components/home/TopRatedPrompts'

// Enable ISR with 1-minute revalidation for homepage
export const revalidate = 60

export default function HomePage() {
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
                Solve real problems with prompts that are tested, compared, and improved.
              </h1>
              <p className="text-xl text-slate-600 mb-4 leading-relaxed font-light">
                Promptvexity organizes prompts by real-world problems — so you can see what actually works,
                why it works, and where it fails.
              </p>
              <p className="text-sm text-slate-500 mb-8">
                Ranked by community testing, forks, and documented improvements.
              </p>
              <div className="flex gap-4 justify-center lg:justify-start mb-12">
                <Link
                  href="/problems"
                  className="btnPrimary text-white font-medium"
                >
                  Browse Problems
                </Link>
                <Link
                  href="/signup"
                  className="btnSecondary text-slate-700 font-medium"
                >
                  Sign Up Free
                </Link>
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
                  <span className="text-xs text-green-700 font-medium">12 prompts improved today</span>
                </div>
              </div>
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

      {/* Final CTA */}
      <div className="bg-slate-100 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-semibold mb-6 text-slate-900">Ready to stop guessing and start comparing?</h2>
          <div className="flex gap-4 justify-center">
            <Link
              href="/problems"
              className="btnPrimary text-white font-medium"
            >
              Browse Problems
            </Link>
            <Link
              href="/create/problem"
              className="btnSecondary text-slate-700 font-medium"
            >
              Create Your First Problem
            </Link>
          </div>
          <p className="text-sm text-slate-500 mt-4">Free to explore. No credit card required.</p>
        </div>
      </div>
    </div>
  )
}
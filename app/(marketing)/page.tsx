import Link from 'next/link'
import { Metadata } from 'next'
import TopRatedPrompts from '@/components/home/TopRatedPrompts'
import { createClient } from '@/lib/supabase/server'
import {
  Layers,
  Zap,
  Target,
  Terminal,
  BarChart3,
  RefreshCw,
  CheckCircle2,
  GitBranch,
  Search,
  UploadCloud,
  TrendingUp,
  History,
  ShieldCheck,
  FlaskConical,
  Cpu,
  ChevronRight,
  TrendingUp as TrendingUpIcon
} from 'lucide-react'

// Enable ISR with 1-minute revalidation
export const revalidate = 60

export const metadata: Metadata = {
  title: 'Promptvexity - Production-Ready Prompts for Real SaaS Problems',
  description: 'Turn Prompt Engineering Into a Testable Discipline. Stop guessing. Start measuring. Move beyond vibes and intuition with a framework built for structured problem solving.',
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
    description: 'Turn Prompt Engineering Into a Testable Discipline. Stop guessing. Start measuring.',
    type: 'website',
    url: 'https://promptvexity.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Promptvexity - Production-Ready Prompts for Real SaaS Problems',
    description: 'Turn Prompt Engineering Into a Testable Discipline. Stop guessing. Start measuring.',
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
    <div className="bg-background">
      {/* Hero Section */}
      <section className="py-20 lg:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 pv-animate-in pv-animate-delay-1">
              <h1 className="text-5xl lg:text-6xl font-bold text-foreground leading-[1.1]">
                Turn Prompt Engineering Into a <span className="text-primary">Testable Discipline</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg leading-relaxed font-light">
                Stop guessing. Start measuring. Move beyond vibes and intuition with a framework built for structured problem solving and iterative prompt refinement.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/problems"
                  className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all inline-flex items-center justify-center"
                >
                  Start Solving Problems
                </Link>
                <Link
                  href="/philosophy"
                  className="bg-card border border-border text-foreground px-8 py-3 rounded-lg font-semibold hover:bg-muted transition-all inline-flex items-center justify-center"
                >
                  View Methodology
                </Link>
              </div>
            </div>

            {/* Hero Graphic: Prompt Preview Card */}
            <div className="relative pv-animate-in pv-animate-delay-2">
              <div className="bg-card rounded-xl border border-border shadow-2xl p-6 relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-bold text-lg text-foreground">Security Reviewer</h3>
                    <p className="text-sm text-muted-foreground">v2.4.0 • Updated 2h ago</p>
                  </div>
                  <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full text-sm font-bold border border-emerald-500/20">
                    Score: 94%
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-md border border-border">
                    <p className="text-xs font-mono text-muted-foreground mb-2">{`// System Prompt`}</p>
                    <p className="text-sm text-foreground leading-relaxed italic">
                      &quot;Act as a senior security engineer. Analyze the following code snippet for OWASP Top 10 vulnerabilities...&quot;
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 border border-border rounded-lg">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Works</p>
                      <p className="font-semibold text-foreground">12/12</p>
                    </div>
                    <div className="text-center p-3 border border-border rounded-lg">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Model</p>
                      <p className="font-semibold text-foreground">GPT-4</p>
                    </div>
                    <div className="text-center p-3 border border-border rounded-lg">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Latency</p>
                      <p className="font-semibold text-foreground">1.2s</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-64 h-64 bg-primary/20 rounded-full blur-3xl opacity-50 -z-10"></div>
              <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-muted rounded-full blur-2xl opacity-40 -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-24 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">Prompt Engineering Has No Feedback Loop</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-16 text-lg">
            Traditional prompting is a dark room. You tweak a word and hope it works better. We provide the light: a continuous cycle of measurement and refinement.
          </p>
          <div className="grid md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-border -z-0"></div>
            <div className="relative z-10 bg-card p-6">
              <div className="w-12 h-12 bg-foreground text-background rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-card shadow-sm">
                <Target className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-foreground">Problem</h4>
              <p className="text-sm text-muted-foreground mt-2">Define the desired outcome precisely.</p>
            </div>
            <div className="relative z-10 bg-card p-6">
              <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-card shadow-sm">
                <Terminal className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-foreground">Prompt</h4>
              <p className="text-sm text-muted-foreground mt-2">Construct the engineering input.</p>
            </div>
            <div className="relative z-10 bg-card p-6">
              <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-card shadow-sm">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-foreground">Score</h4>
              <p className="text-sm text-muted-foreground mt-2">Evaluate against objective metrics.</p>
            </div>
            <div className="relative z-10 bg-card p-6">
              <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-card shadow-sm">
                <RefreshCw className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-foreground">Improve</h4>
              <p className="text-sm text-muted-foreground mt-2">Iterate based on performance data.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Model Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 rounded-3xl p-8 lg:p-16 text-white overflow-hidden relative shadow-2xl">
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6">
                <Layers className="w-4 h-4" />
                Architecture
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 tracking-tight">Problems Turn Prompts Into Solutions</h2>
              <p className="text-slate-300 text-lg mb-10 leading-relaxed font-light">
                In Promptvexity, a Prompt is never standalone. It is always a solution to a specific Problem. This hierarchy ensures that every token you write has a measurable purpose.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-8">
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 hover:border-blue-500/50 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-xl font-semibold text-slate-100 mb-2">Defining Goals</h4>
                  <p className="text-slate-400 leading-relaxed">Problems define the strict constraints, objective success criteria, and hidden test cases for evaluation.</p>
                </div>
                
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 hover:border-blue-500/50 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4">
                    <GitBranch className="w-6 h-6" />
                  </div>
                  <h4 className="text-xl font-semibold text-slate-100 mb-2">Versioning Solutions</h4>
                  <p className="text-slate-400 leading-relaxed">Branch prompts like source code. Compare v1 vs v2 head-to-head across the exact same problem sets.</p>
                </div>
              </div>
            </div>
            {/* Abstract UI Decoration */}
            <div className="absolute right-0 top-0 bottom-0 w-1/3 hidden lg:block opacity-40 pointer-events-none pr-8 pt-8 overflow-visible">
              <div className="w-[120%] h-full rounded-2xl border border-white/10 bg-slate-800/80 backdrop-blur-md p-6 flex flex-col gap-4 shadow-2xl transform translate-x-8 translate-y-8 rotate-6">
                <div className="flex gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400/80"></div>
                </div>
                <div className="h-4 bg-white/20 rounded w-1/3"></div>
                <div className="h-4 bg-white/10 rounded w-2/3"></div>
                <div className="h-4 bg-white/5 rounded w-1/2"></div>
                <div className="flex-1 mt-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                   <div className="w-16 h-16 rounded-full border border-blue-400/20 flex items-center justify-center">
                     <div className="w-8 h-8 rounded-full bg-blue-400/20 animate-pulse"></div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-24 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground">The 3-Step Workflow</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted border border-border text-primary mb-6 group-hover:scale-110 transition-transform">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">1. Browse Problems</h3>
              <p className="text-muted-foreground">Explore existing problem statements or create your own with clear evaluation metrics.</p>
            </div>
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted border border-border text-primary mb-6 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">2. Submit Prompt</h3>
              <p className="text-muted-foreground">Draft your prompt solution. Attach your system instructions, few-shot examples, and model parameters.</p>
            </div>
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted border border-border text-primary mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">3. Analyze & Improve</h3>
              <p className="text-muted-foreground">Run the evaluation engine to see exactly where your prompt succeeds and where it fails.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="py-24 bg-background border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-8">Built for Modern AI Operations</h2>
              <div className="grid sm:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <History className="w-6 h-6 text-primary" />
                  <h4 className="font-bold text-foreground">Versioning</h4>
                  <p className="text-sm text-muted-foreground">Git-like history for every prompt iteration.</p>
                </div>
                <div className="space-y-3">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                  <h4 className="font-bold text-foreground">Evaluation</h4>
                  <p className="text-sm text-muted-foreground">Automated scoring against ground-truth datasets.</p>
                </div>
                <div className="space-y-3">
                  <FlaskConical className="w-6 h-6 text-primary" />
                  <h4 className="font-bold text-foreground">Problem-Based</h4>
                  <p className="text-sm text-muted-foreground">Prompts are scoped to specific business problems.</p>
                </div>
                <div className="space-y-3">
                  <Cpu className="w-6 h-6 text-primary" />
                  <h4 className="font-bold text-foreground">Model-Agnostic</h4>
                  <p className="text-sm text-muted-foreground">Test across GPT-4, Claude 3, Llama 3, and more.</p>
                </div>
              </div>
            </div>
            <div className="bg-card p-8 rounded-2xl border border-border shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <span className="text-xs text-muted-foreground font-mono ml-auto">diff_viewer.sh</span>
                </div>
                <div className="text-sm font-mono space-y-1">
                  <p className="text-muted-foreground">--- v1.0.2</p>
                  <p className="text-muted-foreground">+++ v1.1.0</p>
                  <div className="text-red-600 dark:text-red-400 bg-red-500/10 p-1 px-2 rounded">- Please summarize this text concisely.</div>
                  <div className="text-green-600 dark:text-green-400 bg-green-500/10 p-1 px-2 rounded">+ Extract top 3 themes as JSON keys with 10-word values.</div>
                  <p className="text-muted-foreground pt-4">{`// Evaluation Results:`}</p>
                  <p className="text-foreground font-bold">Accuracy: 72% -{'>'} 91%</p>
                  <p className="text-foreground font-bold">Latency: 0.8s -{'>'} 1.1s</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Examples & Stats Section */}
      <section className="py-24 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">The numbers speak for themselves</h2>
            <p className="text-muted-foreground">Join a growing community of builders shipping AI features faster</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto mb-24">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-blue-400 mb-2">
                {promptCount || 0}+
              </div>
              <div className="text-sm font-semibold text-foreground mb-1">Production Prompts</div>
              <div className="text-xs text-muted-foreground">Battle-tested in real SaaS</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-green-600 to-green-400 mb-2">
                {forkCount || 0}+
              </div>
              <div className="text-sm font-semibold text-foreground mb-1">Improvements Made</div>
              <div className="text-xs text-muted-foreground">Community iterations</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-purple-600 to-purple-400 mb-2">
                50+
              </div>
              <div className="text-sm font-semibold text-foreground mb-1">SaaS Problems</div>
              <div className="text-xs text-muted-foreground">Across 5 categories</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-600 to-amber-400 mb-2">
                {userCount || 0}+
              </div>
              <div className="text-sm font-semibold text-foreground mb-1">Active Builders</div>
              <div className="text-xs text-muted-foreground">Indie founders & teams</div>
            </div>
          </div>

          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Top-Rated Prompts</h2>
              <p className="text-muted-foreground mt-2">Ranked by community testing, forks, and votes.</p>
            </div>
            <Link className="text-primary font-semibold flex items-center gap-1 hover:underline" href="/problems">
              Browse Gallery <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <TopRatedPrompts />
        </div>
      </section>

      {/* CTA Section — intentionally always dark */}
      <section className="py-24 bg-slate-900 text-white overflow-hidden relative border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl font-bold mb-6">Start solving problems with better prompts</h2>
          <p className="text-lg text-slate-400 mb-10 leading-relaxed">
            Join 100+ builders who value structure, testing, and objective performance. Move beyond &quot;it seems to work&quot; to &quot;we know it works.&quot;
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/signup"
              className="bg-primary text-primary-foreground px-10 py-4 rounded-xl font-bold text-lg hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 inline-flex items-center justify-center"
            >
              Create Free Account
            </Link>
            <Link
              href="/problems"
              className="bg-white/10 hover:bg-white/20 border border-white/10 text-white px-10 py-4 rounded-xl font-bold text-lg transition-all backdrop-blur-sm inline-flex items-center justify-center"
            >
              Browse Problems
            </Link>
          </div>
          <p className="mt-8 text-sm text-slate-500">Build better AI features today. No credit card required.</p>
        </div>
        {/* Background glow for CTA */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      </section>
    </div>
  )
}

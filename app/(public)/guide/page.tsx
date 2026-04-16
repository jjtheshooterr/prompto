'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TierBadge } from '@/components/badges/TierBadge';

const tiers = [
  {
    name: 'Novice' as const,
    threshold: '0+',
    description: 'Just getting started. Submit your first prompt and begin climbing.',
    textColor: 'text-slate-600',
    bg: 'bg-slate-50',
    hoverBg: 'hover:bg-slate-100/80',
    border: 'border-slate-200',
    hoverBorder: 'hover:border-slate-300',
    badge: 'bg-slate-100 text-slate-500',
  },
  {
    name: 'Contributor' as const,
    threshold: '500+',
    description: 'Consistent participation. You understand the fundamentals of structured prompting.',
    textColor: 'text-red-600',
    bg: 'bg-red-50/50',
    hoverBg: 'hover:bg-red-50',
    border: 'border-red-100',
    hoverBorder: 'hover:border-red-200',
    badge: 'bg-red-50 text-red-500',
  },
  {
    name: 'Expert' as const,
    threshold: '2,000+',
    description: 'Your prompts demonstrate technical depth, clear structure, and reliable outputs.',
    textColor: 'text-purple-600',
    bg: 'bg-purple-50/40',
    hoverBg: 'hover:bg-purple-50/80',
    border: 'border-purple-100',
    hoverBorder: 'hover:border-purple-200',
    badge: 'bg-purple-50 text-purple-600',
  },
  {
    name: 'Master' as const,
    threshold: '5,000+',
    description: 'Elite-tier prompt engineering. Your work is studied by other users on the platform.',
    textColor: 'text-sky-600',
    bg: 'bg-sky-50/40',
    hoverBg: 'hover:bg-sky-50/80',
    border: 'border-sky-100',
    hoverBorder: 'hover:border-sky-200',
    badge: 'bg-sky-50 text-sky-600',
  },
  {
    name: 'Grandmaster' as const,
    threshold: 'Top 1%',
    description: 'The highest distinction. Reserved for the top percentile of prompt engineers globally.',
    textColor: 'text-amber-600',
    bg: 'bg-amber-50/50',
    hoverBg: 'hover:bg-amber-50/80',
    border: 'border-amber-200',
    hoverBorder: 'hover:border-amber-300',
    badge: 'bg-amber-50 text-amber-600',
  },
];

function getScoreColor(value: number): string {
  // 0 = red (hue 0), 50 = yellow (hue 48), 100 = green (hue 130)
  const hue = value <= 50
    ? (value / 50) * 48          // red to yellow
    : 48 + ((value - 50) / 50) * 82;  // yellow to green
  const sat = value <= 50 ? 75 : 65;
  const light = 42;
  return `hsl(${hue}, ${sat}%, ${light}%)`;
}

function AnimatedScore({ target, label, suffix, color, delay, dynamicColor }: { target: number; label: string; suffix?: string; color?: string; delay: number; dynamicColor?: boolean }) {
  const [count, setCount] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!visible) return;
    let current = 0;
    const step = target / 60;
    const interval = setInterval(() => {
      current += step;
      if (current >= target) {
        setCount(target);
        clearInterval(interval);
      } else {
        setCount(Math.floor(current));
      }
    }, 25);
    return () => clearInterval(interval);
  }, [visible, target]);

  return (
    <div className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div
        className={`text-5xl md:text-6xl font-extrabold tabular-nums ${!dynamicColor ? color : ''}`}
        style={dynamicColor ? { color: getScoreColor(count) } : undefined}
      >
        {count}{suffix}
      </div>
      <div className="text-sm text-muted-foreground font-medium mt-2 tracking-wide uppercase">{label}</div>
    </div>
  );
}

export default function GuidePage() {
  const [hoveredTier, setHoveredTier] = useState<string | null>(null);

  return (
    <div className="bg-background min-h-screen">

      {/* ====== HERO ====== */}
      <section className="relative overflow-hidden bg-muted border-b border-border">
        <div className="max-w-5xl mx-auto px-6 pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-card border border-border text-muted-foreground text-sm font-medium mb-8 shadow-sm">
              <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              Platform Guide
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-foreground tracking-tight leading-[1.15]">
              How Promptvexity Works
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
              A competitive platform for prompt engineers. Solve real problems, get scored, earn ranks, and climb the global leaderboard.
            </p>
          </div>
        </div>
      </section>


      <section className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">1</div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">The Core Loop</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-border rounded-2xl overflow-hidden border border-border">
            {[
              {
                step: '01',
                title: 'Pick a Problem',
                desc: 'Browse the problem library. Each challenge targets a specific real-world use case: code generation, data extraction, creative writing, structured analysis.',
                icon: (
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                ),
              },
              {
                step: '02',
                title: 'Write Your Prompt',
                desc: 'Craft something that solves it as effectively as possible. Think about structure, specificity, edge cases, and output formatting.',
                icon: (
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                ),
              },
              {
                step: '03',
                title: 'Get Ranked',
                desc: 'Your submission is scored across multiple dimensions. Points accumulate, your rank advances, and you climb the global leaderboard.',
                icon: (
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                ),
              },
            ].map((item) => (
              <div key={item.step} className="bg-card p-8 md:p-10 group">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors">
                    {item.icon}
                  </div>
                  <span className="text-xs font-bold text-muted-foreground/50 tracking-widest uppercase">Step {item.step}</span>
                </div>
                <h3 className="font-bold text-foreground text-lg mb-3">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ====== SCORING SYSTEM ====== */}
      <section className="border-b border-border bg-muted">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">2</div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">The Scoring System</h2>
          </div>
          <p className="text-muted-foreground mb-12 max-w-2xl">
            Every prompt receives a <strong className="text-foreground">Quality Score</strong> out of 100, composed of three independent layers designed to capture different angles of prompt quality.
          </p>

          {/* Counter row */}
          <div className="grid grid-cols-3 gap-6 text-center mb-14 py-8 bg-card rounded-2xl border border-border shadow-sm">
            <AnimatedScore target={70} label="Structure" color="text-blue-600" delay={200} />
            <AnimatedScore target={30} label="AI Evaluation" color="text-purple-600" delay={600} />
            <AnimatedScore target={100} label="Total Score" delay={1000} suffix="/100" dynamicColor />
          </div>

          {/* Three pillars */}
          <div className="grid md:grid-cols-3 gap-5">
            {/* Structure */}
            <div className="bg-card rounded-2xl border border-border p-7 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-500/30 transition-all duration-200">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 text-sm">70</div>
                <div>
                  <div className="font-bold text-foreground">Structure</div>
                  <div className="text-xs text-muted-foreground">Max 70 points</div>
                </div>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mb-5">
                Calculated instantly on submit. A deterministic check of your prompt&apos;s architecture.
              </p>
              <ul className="text-sm text-muted-foreground space-y-2.5">
                <li className="flex gap-2.5 items-start"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0"></span>Defines a role or persona</li>
                <li className="flex gap-2.5 items-start"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0"></span>Explicit output constraints</li>
                <li className="flex gap-2.5 items-start"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0"></span>Includes examples or edge cases</li>
                <li className="flex gap-2.5 items-start"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0"></span>Task decomposed into steps</li>
                <li className="flex gap-2.5 items-start"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0"></span>Output format explicitly defined</li>
              </ul>
            </div>

            {/* AI */}
            <div className="bg-card rounded-2xl border border-border p-7 shadow-sm hover:shadow-md hover:border-purple-200 dark:hover:border-purple-500/30 transition-all duration-200">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center font-bold text-purple-600 dark:text-purple-400 text-sm">30</div>
                <div>
                  <div className="font-bold text-foreground">AI Evaluation</div>
                  <div className="text-xs text-muted-foreground">Max 30 points</div>
                </div>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mb-5">
                After submission, a specialized model reads your prompt holistically and grades it in the background.
              </p>
              <ul className="text-sm text-muted-foreground space-y-2.5">
                <li className="flex gap-2.5 items-start"><span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0"></span>Clarity of intent and instruction</li>
                <li className="flex gap-2.5 items-start"><span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0"></span>Contextual grounding</li>
                <li className="flex gap-2.5 items-start"><span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0"></span>Specification precision</li>
                <li className="flex gap-2.5 items-start"><span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0"></span>Edge case awareness</li>
              </ul>
            </div>

            {/* Community */}
            <div className="bg-card rounded-2xl border border-border p-7 shadow-sm hover:shadow-md hover:border-amber-200 dark:hover:border-amber-500/30 transition-all duration-200">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-bold text-amber-600 dark:text-amber-400 text-sm">+</div>
                <div>
                  <div className="font-bold text-foreground">Community Signal</div>
                  <div className="text-xs text-muted-foreground">Dynamic modifier</div>
                </div>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mb-5">
                Uses a Wilson Score confidence interval to filter real consensus from noise. Same math used by Reddit and HN.
              </p>
              <ul className="text-sm text-muted-foreground space-y-2.5">
                <li className="flex gap-2.5 items-start"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"></span>Upvote/downvote ratio</li>
                <li className="flex gap-2.5 items-start"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"></span>&quot;Works&quot; vs &quot;Fails&quot; confirmations</li>
                <li className="flex gap-2.5 items-start"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"></span>Statistical confidence weighting</li>
                <li className="flex gap-2.5 items-start"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"></span>Resistant to vote manipulation</li>
              </ul>
            </div>
          </div>
        </div>
      </section>


      {/* ====== RANKING TIERS ====== */}
      <section className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-9 h-9 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold text-sm">3</div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Ranking Tiers</h2>
          </div>
          <p className="text-muted-foreground mb-10 max-w-2xl">
            Your accumulated points determine your global tier. Each tier earns a distinct badge displayed on your profile and beside every prompt you publish.
          </p>

          <div className="space-y-4">

            {/* Novice - Clean, minimal */}
            <div
              onMouseEnter={() => setHoveredTier('Novice')}
              onMouseLeave={() => setHoveredTier(null)}
              className="bg-card border border-border rounded-2xl p-5 md:p-7 flex items-center gap-6 md:gap-10 transition-all duration-300 hover:border-muted-foreground/30"
            >
              <div className="shrink-0 transition-transform duration-300" style={{ transform: hoveredTier === 'Novice' ? 'scale(1.1)' : 'scale(1)' }}>
                <TierBadge tier="Novice" size="xl" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h3 className="text-lg font-bold text-slate-600">Novice</h3>
                  <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full">0+ pts</span>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">Just getting started. Submit your first prompt and begin climbing.</p>
              </div>
            </div>

            {/* Contributor */}
            <div
              onMouseEnter={() => setHoveredTier('Contributor')}
              onMouseLeave={() => setHoveredTier(null)}
              className="bg-card border border-red-200/60 dark:border-red-500/20 rounded-2xl p-5 md:p-7 flex items-center gap-6 md:gap-10 transition-all duration-300 hover:border-red-300 dark:hover:border-red-500/40 hover:shadow-sm relative overflow-hidden"
            >
              <div className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-red-300 dark:bg-red-500/60"></div>
              <div className="shrink-0 transition-transform duration-300 ml-2" style={{ transform: hoveredTier === 'Contributor' ? 'scale(1.1)' : 'scale(1)' }}>
                <TierBadge tier="Contributor" size="xl" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h3 className="text-lg font-bold text-red-600 dark:text-red-400">Contributor</h3>
                  <span className="text-xs font-semibold bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 px-2.5 py-0.5 rounded-full">500+ pts</span>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">Consistent participation. You understand the fundamentals of structured prompting.</p>
              </div>
            </div>

            {/* Expert */}
            <div
              onMouseEnter={() => setHoveredTier('Expert')}
              onMouseLeave={() => setHoveredTier(null)}
              className="bg-card border border-purple-200/60 dark:border-purple-500/20 rounded-2xl p-5 md:p-7 flex items-center gap-6 md:gap-10 transition-all duration-300 hover:border-purple-300 dark:hover:border-purple-500/40 hover:shadow-md relative overflow-hidden"
            >
              <div className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-gradient-to-b from-purple-400 to-violet-500"></div>
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-purple-500/5 dark:bg-purple-500/10 blur-[60px] pointer-events-none"></div>
              <div className="relative shrink-0 transition-transform duration-300 ml-2" style={{ transform: hoveredTier === 'Expert' ? 'scale(1.12)' : 'scale(1)' }}>
                <TierBadge tier="Expert" size="xl" />
              </div>
              <div className="relative flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h3 className="text-lg font-bold text-purple-600 dark:text-purple-400">Expert</h3>
                  <span className="text-xs font-semibold bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2.5 py-0.5 rounded-full">2,000+ pts</span>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">Your prompts demonstrate technical depth, clear structure, and reliable outputs.</p>
              </div>
            </div>

            {/* Master */}
            <div
              onMouseEnter={() => setHoveredTier('Master')}
              onMouseLeave={() => setHoveredTier(null)}
              className="bg-card border border-sky-200/60 dark:border-sky-500/20 rounded-2xl p-5 md:p-7 flex items-center gap-6 md:gap-10 transition-all duration-500 hover:border-sky-300 dark:hover:border-sky-500/40 hover:shadow-lg relative overflow-hidden"
            >
              <div className="absolute left-0 top-2 bottom-2 w-1.5 rounded-full bg-gradient-to-b from-sky-400 to-blue-600"></div>
              <div className="absolute top-0 right-0 w-56 h-56 rounded-full bg-sky-500/5 dark:bg-sky-500/10 blur-[60px] pointer-events-none"></div>
              <div className="absolute bottom-0 left-20 w-32 h-32 rounded-full bg-blue-500/5 dark:bg-blue-500/10 blur-[40px] pointer-events-none"></div>
              <div className="relative shrink-0 transition-transform duration-500 ml-2" style={{ transform: hoveredTier === 'Master' ? 'scale(1.15)' : 'scale(1)' }}>
                <TierBadge tier="Master" size="xl" />
              </div>
              <div className="relative flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h3 className="text-lg font-bold text-sky-600 dark:text-sky-400">Master</h3>
                  <span className="text-xs font-semibold bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 px-2.5 py-0.5 rounded-full border border-sky-200 dark:border-sky-500/20">5,000+ pts</span>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">Elite-tier prompt engineering. Your work is studied by other users on the platform.</p>
              </div>
            </div>

            {/* Grandmaster - Full premium: animated shimmer, gradient border, golden glow */}
            <style>{`
              @keyframes shimmer-sweep {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(200%); }
              }
            `}</style>
            <div
              onMouseEnter={() => setHoveredTier('Grandmaster')}
              onMouseLeave={() => setHoveredTier(null)}
              className="relative rounded-2xl p-[2px] transition-all duration-500 hover:shadow-xl group"
              style={{
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #d97706, #fbbf24)',
                boxShadow: hoveredTier === 'Grandmaster' ? '0 8px 40px -8px rgba(245, 158, 11, 0.35)' : '0 2px 12px -4px rgba(245, 158, 11, 0.15)',
              }}
            >
              {/* Shimmer overlay */}
              <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                <div
                  className="absolute inset-0 w-1/3"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                    animation: 'shimmer-sweep 3s ease-in-out infinite',
                  }}
                ></div>
              </div>

              <div
                className="relative rounded-[14px] p-6 md:p-8 flex items-center gap-6 md:gap-10 overflow-hidden bg-amber-50 dark:bg-amber-950/60"
              >
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-amber-200/30 dark:bg-amber-400/10 blur-[60px] pointer-events-none"></div>
                <div className="absolute bottom-0 left-20 w-40 h-40 rounded-full bg-orange-200/20 dark:bg-orange-400/10 blur-[50px] pointer-events-none"></div>

                <div className="relative shrink-0 transition-transform duration-500" style={{ transform: hoveredTier === 'Grandmaster' ? 'scale(1.18)' : 'scale(1)' }}>
                  <TierBadge tier="Grandmaster" size="xl" />
                </div>
                <div className="relative flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-1">
                    <h3 className="text-xl font-extrabold text-amber-700 dark:text-amber-400">Grandmaster</h3>
                    <span className="text-xs font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full border border-amber-300 dark:border-amber-500/30 shadow-sm">
                      Top 1%
                    </span>
                  </div>
                  <p className="text-amber-800/70 dark:text-amber-300/70 text-sm leading-relaxed font-medium">The highest distinction. Reserved for the top percentile of prompt engineers globally.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>


      <section className="border-b border-border bg-muted">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-9 h-9 rounded-lg bg-foreground flex items-center justify-center text-background font-bold text-sm">4</div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">What Makes a Great Prompt</h2>
          </div>
          <p className="text-muted-foreground mb-10 max-w-2xl">
            The difference between a 40 and a 95 often comes down to a few structural choices.
          </p>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
              <h3 className="font-bold text-emerald-600 dark:text-emerald-400 mb-5 flex items-center gap-2 text-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Do
              </h3>
              <ul className="text-sm text-muted-foreground space-y-3.5">
                <li className="flex gap-3 items-start"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>Define a clear persona or role (&quot;You are a senior data analyst...&quot;)</li>
                <li className="flex gap-3 items-start"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>State the exact output format (JSON, markdown table, numbered steps)</li>
                <li className="flex gap-3 items-start"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>Include edge cases or boundary conditions</li>
                <li className="flex gap-3 items-start"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>Break complex tasks into numbered sub-tasks</li>
                <li className="flex gap-3 items-start"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>Use delimiters to separate instructions from data</li>
                <li className="flex gap-3 items-start"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>Provide at least one concrete example of expected output</li>
              </ul>
            </div>

            <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
              <h3 className="font-bold text-red-500 dark:text-red-400 mb-5 flex items-center gap-2 text-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                Avoid
              </h3>
              <ul className="text-sm text-muted-foreground space-y-3.5">
                <li className="flex gap-3 items-start"><span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0"></span>Vague instructions like &quot;write something good about X&quot;</li>
                <li className="flex gap-3 items-start"><span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0"></span>Missing context about the audience or use case</li>
                <li className="flex gap-3 items-start"><span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0"></span>Leaving the output format entirely up to the model</li>
                <li className="flex gap-3 items-start"><span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0"></span>Overly long prompts that bury the actual task</li>
                <li className="flex gap-3 items-start"><span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0"></span>Ignoring negative constraints (&quot;do not include...&quot;)</li>
                <li className="flex gap-3 items-start"><span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0"></span>Assuming the model knows your domain-specific jargon</li>
              </ul>
            </div>
          </div>
        </div>
      </section>


      {/* ====== CTA ====== */}
      <section>
        <div className="max-w-3xl mx-auto px-6 py-24 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-4">Ready to start?</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-10">
            Browse top-rated submissions to study what works, then pick a problem and write your own.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/leaderboard" className="group px-7 py-3.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-sm hover:bg-primary/90 transition-all flex items-center gap-2">
              View Leaderboard
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
            <Link href="/problems" className="px-7 py-3.5 bg-card text-foreground font-semibold rounded-xl border border-border hover:border-muted-foreground/30 hover:bg-muted transition-all shadow-sm">
              Browse Problems
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

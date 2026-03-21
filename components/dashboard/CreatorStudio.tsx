'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/app/providers'
import Link from 'next/link'
import {
  Eye,
  Copy,
  GitBranch,
  ThumbsUp,
  TrendingUp,
  BarChart3,
  Award,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Loader2,
  DollarSign,
  Percent,
} from 'lucide-react'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import {
  getCreatorStats,
  getCreatorTimeSeries,
  getCreatorTopPrompts,
  getCreatorTrends,
  getTokenSavingsEstimate,
  type CreatorStats,
  type CreatorTrends,
  type DailyDataPoint,
  type TopPrompt,
  type TokenSavings,
} from '@/lib/actions/analytics.actions'

// ─── Animated Counter ───────────────────────────────────────
function AnimatedCounter({ value, duration = 1200, prefix = '', suffix = '' }: {
  value: number; duration?: number; prefix?: string; suffix?: string
}) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (value === 0) { setDisplay(0); return }
    const startTime = Date.now()
    const tick = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(value * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [value, duration])

  return <>{prefix}{display.toLocaleString()}{suffix}</>
}

// ─── Custom Tooltip ─────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const date = new Date(label + 'T00:00:00')
  const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="font-semibold text-slate-700 mb-2">{formatted}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 mb-0.5">
          <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-slate-600 capitalize">{entry.name}:</span>
          <span className="font-bold text-slate-900">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Period Selector ────────────────────────────────────────
function PeriodSelector({ period, onChange }: { period: number; onChange: (p: number) => void }) {
  const options = [
    { label: '7D', value: 7 },
    { label: '30D', value: 30 },
    { label: '90D', value: 90 },
  ]
  return (
    <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0.5">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            period === opt.value
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ─── Engagement Bar ─────────────────────────────────────────
function EngagementBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
      <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700"
        style={{ width: `${pct}%` }} />
    </div>
  )
}

// ─── Quality Score Ring ─────────────────────────────────────
function QualityRing({ score }: { score: number }) {
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const pct = Math.min(score, 100) / 100
  const offset = circumference * (1 - pct)
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444'

  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="4" />
        <circle cx="32" cy="32" r={radius} fill="none" stroke={color} strokeWidth="4"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-1000" />
      </svg>
      <span className="absolute text-sm font-bold text-slate-900">{Math.round(score)}</span>
    </div>
  )
}

// ─── Stat Card ──────────────────────────────────────────────
function StatCard({
  icon: Icon, label, value, color, trend, trendDelta, subLabel,
}: {
  icon: any; label: string; value: number; color: string;
  trend?: 'up' | 'down' | 'flat'; trendDelta?: number; subLabel?: string;
}) {
  const colorMap: Record<string, { bg: string; icon: string; ring: string }> = {
    blue:   { bg: 'bg-blue-50',    icon: 'text-blue-600',    ring: 'ring-blue-100' },
    green:  { bg: 'bg-emerald-50', icon: 'text-emerald-600', ring: 'ring-emerald-100' },
    orange: { bg: 'bg-orange-50',  icon: 'text-orange-600',  ring: 'ring-orange-100' },
    purple: { bg: 'bg-purple-50',  icon: 'text-purple-600',  ring: 'ring-purple-100' },
  }
  const c = colorMap[color] || colorMap.blue

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col items-center justify-center text-center relative overflow-hidden group hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-full ${c.bg} ${c.icon} flex items-center justify-center mb-2 ring-4 ${c.ring}`}>
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-2xl font-bold text-slate-900 tabular-nums">
        <AnimatedCounter value={value} />
      </h3>
      <p className="text-xs text-slate-500 font-medium tracking-wide mt-0.5">{label}</p>
      {subLabel && <p className="text-[10px] text-slate-400 mt-0.5">{subLabel}</p>}
      {trend && (
        <div className={`absolute top-3 right-3 text-[10px] font-bold flex items-center gap-0.5 ${
          trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-rose-500' : 'text-slate-400'
        }`}>
          {trend === 'up' && <><ArrowUpRight className="w-3 h-3" />{trendDelta ? `${trendDelta}%` : ''}</>}
          {trend === 'down' && <><ArrowDownRight className="w-3 h-3" />{trendDelta ? `${Math.abs(trendDelta)}%` : ''}</>}
          {trend === 'flat' && <Minus className="w-3 h-3" />}
        </div>
      )}
    </div>
  )
}

// ─── Legend Toggle ──────────────────────────────────────────
function ChartLegend({ visible, onToggle }: {
  visible: Record<string, boolean>; onToggle: (key: string) => void
}) {
  const items = [
    { key: 'views', color: '#3b82f6', label: 'Views' },
    { key: 'copies', color: '#10b981', label: 'Copies' },
    { key: 'forks', color: '#f97316', label: 'Forks' },
  ]
  return (
    <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-100">
      {items.map(item => (
        <button key={item.key} onClick={() => onToggle(item.key)}
          className={`flex items-center gap-1.5 text-xs transition-opacity ${
            visible[item.key] ? 'opacity-100' : 'opacity-30'
          }`}>
          <div className="w-3 h-1 rounded-full" style={{ background: item.color }} />
          <span className="text-slate-500">{item.label}</span>
        </button>
      ))}
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────
export default function CreatorStudio() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<CreatorStats | null>(null)
  const [trends, setTrends] = useState<CreatorTrends | null>(null)
  const [timeSeries, setTimeSeries] = useState<DailyDataPoint[]>([])
  const [topPrompts, setTopPrompts] = useState<TopPrompt[]>([])
  const [tokenSavings, setTokenSavings] = useState<TokenSavings | null>(null)
  const [period, setPeriod] = useState(30)
  const [visibleLines, setVisibleLines] = useState({ views: true, copies: true, forks: true })

  const toggleLine = (key: string) => {
    setVisibleLines(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))
  }

  const loadData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [statsData, trendsData, seriesData, topData, savingsData] = await Promise.all([
        getCreatorStats(user.id),
        getCreatorTrends(user.id),
        getCreatorTimeSeries(user.id, period),
        getCreatorTopPrompts(user.id, 10),
        getTokenSavingsEstimate(user.id),
      ])
      setStats(statsData)
      setTrends(trendsData)
      setTimeSeries(seriesData)
      setTopPrompts(topData)
      setTokenSavings(savingsData)
    } catch (err) {
      console.error('Failed to load analytics:', err)
    } finally {
      setLoading(false)
    }
  }, [user, period])

  useEffect(() => { loadData() }, [loadData])

  const maxEngagement = topPrompts.length > 0 ? topPrompts[0].totalEngagement : 1
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  const tickInterval = period <= 7 ? 0 : period <= 30 ? 4 : 13

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
        <span className="ml-3 text-slate-500 text-sm font-medium">Loading analytics...</span>
      </div>
    )
  }

  if (!stats || stats.promptCount === 0) {
    return (
      <div className="text-center py-20">
        <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-900 mb-2">No Analytics Yet</h3>
        <p className="text-sm text-slate-500 mb-6">Submit your first prompt to start tracking performance.</p>
        <Link href="/create/prompt" className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors">
          <Zap className="w-4 h-4" /> Create a Prompt
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Eye} label="Total Views" value={stats.totalViews} color="blue"
          trend={trends?.views} trendDelta={trends?.viewsDelta} />
        <StatCard icon={Copy} label="Total Copies" value={stats.totalCopies} color="green"
          trend={trends?.copies} trendDelta={trends?.copiesDelta}
          subLabel={stats.copyRate > 0 ? `${stats.copyRate}% copy rate` : undefined} />
        <StatCard icon={GitBranch} label="Total Forks" value={stats.totalForks} color="orange"
          trend={trends?.forks} trendDelta={trends?.forksDelta}
          subLabel={stats.forkRate > 0 ? `${stats.forkRate}% fork rate` : undefined} />
        <StatCard icon={ThumbsUp} label="Net Upvotes" value={stats.totalUpvotes - stats.totalDownvotes} color="purple"
          trend={trends?.votes} trendDelta={trends?.votesDelta} />
      </div>

      {/* ── Impact Summary ── */}
      <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 rounded-2xl border border-indigo-100 p-6">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          {/* Quality Ring */}
          {stats.avgQualityScore > 0 && (
            <div className="flex flex-col items-center gap-1">
              <QualityRing score={stats.avgQualityScore} />
              <span className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Quality</span>
            </div>
          )}

          {/* Impact Text */}
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 justify-center sm:justify-start">
              <Award className="w-5 h-5 text-indigo-600" /> Creator Impact
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Across <span className="font-semibold text-indigo-600">{stats.promptCount}</span> prompts,
              your work has been viewed{' '}
              <span className="font-semibold text-blue-600">{stats.totalViews.toLocaleString()}</span> times
              and copied <span className="font-semibold text-emerald-600">{stats.totalCopies.toLocaleString()}</span> times.
            </p>
          </div>

          {/* Token Savings */}
          {tokenSavings && tokenSavings.totalSavings > 0 && (
            <div className="bg-white/80 rounded-xl border border-indigo-100 px-5 py-3 text-center shadow-sm group relative">
              <div className="text-xl font-bold text-emerald-600 flex items-center gap-1 justify-center">
                <DollarSign className="w-4 h-4" />{tokenSavings.totalSavings.toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Token Savings</div>
              <div className="text-[9px] text-slate-400 mt-0.5">
                {(tokenSavings.totalTokensSaved / 1000).toFixed(1)}k tokens saved
              </div>
              {/* Breakdown tooltip */}
              {tokenSavings.breakdown.length > 0 && (
                <div className="absolute bottom-full right-0 mb-2 bg-white border border-slate-200 rounded-lg shadow-xl p-3 text-left opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 min-w-[180px]">
                  <p className="text-[10px] font-bold text-slate-700 mb-1.5">By Model</p>
                  {tokenSavings.breakdown.map(b => (
                    <div key={b.model} className="flex justify-between text-[10px] text-slate-600 mb-0.5">
                      <span className="font-mono">{b.model}</span>
                      <span className="font-bold">${b.savings.toFixed(3)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Time-Series Chart ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-slate-700" />
            <h3 className="text-lg font-bold text-slate-900">Engagement Over Time</h3>
          </div>
          <PeriodSelector period={period} onChange={setPeriod} />
        </div>

        {timeSeries.some(d => d.views + d.copies + d.forks > 0) ? (
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeries} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <defs>
                  <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="copiesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="forksGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false} axisLine={false} interval={tickInterval} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                {visibleLines.views && (
                  <Area type="monotone" dataKey="views" name="Views" stroke="#3b82f6" strokeWidth={2}
                    fill="url(#viewsGrad)" dot={false} activeDot={{ r: 4, strokeWidth: 2 }} />
                )}
                {visibleLines.copies && (
                  <Area type="monotone" dataKey="copies" name="Copies" stroke="#10b981" strokeWidth={2}
                    fill="url(#copiesGrad)" dot={false} activeDot={{ r: 4, strokeWidth: 2 }} />
                )}
                {visibleLines.forks && (
                  <Area type="monotone" dataKey="forks" name="Forks" stroke="#f97316" strokeWidth={2}
                    fill="url(#forksGrad)" dot={false} activeDot={{ r: 4, strokeWidth: 2 }} />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400">
            <BarChart3 className="w-10 h-10 mb-3 text-slate-300" />
            <p className="text-sm font-medium">No engagement data yet for this period</p>
            <p className="text-xs mt-1">Data will appear as users interact with your prompts</p>
          </div>
        )}

        <ChartLegend visible={visibleLines} onToggle={toggleLine} />
      </div>

      {/* ── Top Prompts ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-slate-700" />
          <h3 className="text-lg font-bold text-slate-900">Top Prompts by Engagement</h3>
        </div>

        {topPrompts.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {topPrompts.map((prompt, index) => (
              <div key={prompt.promptId} className="px-6 py-4 hover:bg-slate-50/50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                    index === 0 ? 'bg-amber-100 text-amber-700' :
                    index === 1 ? 'bg-slate-200 text-slate-600' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <Link href={`/prompts/${prompt.slug || prompt.promptId}`}
                      className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate block text-sm">
                      {prompt.title}
                    </Link>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {prompt.viewCount}</span>
                      <span className="flex items-center gap-1"><Copy className="w-3 h-3" /> {prompt.copyCount}</span>
                      <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" /> {prompt.forkCount}</span>
                      <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {prompt.upvotes}</span>
                      {prompt.model && (
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase">
                          {prompt.model}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="w-24 hidden sm:block">
                    <EngagementBar value={prompt.totalEngagement} max={maxEngagement} />
                    <div className="text-[10px] text-slate-400 text-right mt-1 tabular-nums">
                      {prompt.totalEngagement.toLocaleString()} pts
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <BarChart3 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">No prompts to rank yet</p>
          </div>
        )}
      </div>
    </div>
  )
}


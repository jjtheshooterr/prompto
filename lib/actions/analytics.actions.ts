'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Creator Analytics Server Actions
 * 
 * Powers the Creator Studio dashboard with:
 * - Aggregate stats with engagement rates
 * - Time-series data for charting
 * - Top prompt rankings
 * - Period-over-period trend indicators
 * - Model-aware token cost savings estimates
 */

// ─── Model Pricing Map (March 2026, per million INPUT tokens) ────
const MODEL_PRICING: Record<string, number> = {
  'gpt-4':              30.00,
  'gpt-4-turbo':        10.00,
  'gpt-4o':              2.50,
  'gpt-4o-mini':         0.15,
  'gpt-5.2':             1.75,
  'gpt-3.5-turbo':       0.50,
  'claude-3-opus':      15.00,
  'claude-3-sonnet':     3.00,
  'claude-3-haiku':      0.25,
  'claude-opus-4.5':     5.00,
  'claude-sonnet-4.5':   3.00,
  'claude-haiku-4.5':    1.00,
  'gemini-2.5-flash':    0.30,
  'gemini-2.5-pro':      1.25,
  'gemini-2.0-flash':    0.10,
}
const DEFAULT_PRICE_PER_M = 5.00 // conservative fallback

// ─── Types ──────────────────────────────────────────────────

export interface CreatorStats {
  totalViews: number
  totalCopies: number
  totalForks: number
  totalUpvotes: number
  totalDownvotes: number
  avgQualityScore: number
  promptCount: number
  copyRate: number    // copies / views as percentage
  forkRate: number    // forks / views as percentage
}

export interface CreatorTrends {
  views:   'up' | 'down' | 'flat'
  copies:  'up' | 'down' | 'flat'
  forks:   'up' | 'down' | 'flat'
  votes:   'up' | 'down' | 'flat'
  viewsDelta: number   // percentage change
  copiesDelta: number
  forksDelta: number
  votesDelta: number
}

export interface DailyDataPoint {
  date: string       // 'YYYY-MM-DD'
  views: number
  copies: number
  forks: number
}

export interface TopPrompt {
  promptId: string
  title: string
  slug: string | null
  model: string | null
  viewCount: number
  copyCount: number
  forkCount: number
  upvotes: number
  downvotes: number
  qualityScore: number
  totalEngagement: number
  createdAt: string
}

export interface TokenSavings {
  totalSavings: number      // dollar amount
  totalTokensSaved: number  // raw token count
  breakdown: Array<{
    model: string
    promptCount: number
    tokensSaved: number
    savings: number
  }>
}

// ─── Auth helper ────────────────────────────────────────────

async function verifyUser(userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== userId) {
    throw new Error('Unauthorized: Cannot access another user\'s analytics')
  }
  return supabase
}

// ─── Get Aggregate Stats ────────────────────────────────────

export async function getCreatorStats(userId: string): Promise<CreatorStats> {
  const supabase = await verifyUser(userId)

  const { data: rpcData, error: rpcError } = await supabase
    .rpc('get_creator_stats', { creator_id: userId })

  if (!rpcError && rpcData && rpcData.length > 0) {
    const row = rpcData[0]
    const views = Number(row.total_views) || 0
    const copies = Number(row.total_copies) || 0
    const forks = Number(row.total_forks) || 0
    return {
      totalViews: views,
      totalCopies: copies,
      totalForks: forks,
      totalUpvotes: Number(row.total_upvotes) || 0,
      totalDownvotes: Number(row.total_downvotes) || 0,
      avgQualityScore: Number(row.avg_quality_score) || 0,
      promptCount: Number(row.prompt_count) || 0,
      copyRate: views > 0 ? Math.round((copies / views) * 1000) / 10 : 0,
      forkRate: views > 0 ? Math.round((forks / views) * 1000) / 10 : 0,
    }
  }

  // Fallback
  const { data: prompts } = await supabase
    .from('prompts').select('id').eq('created_by', userId).eq('is_deleted', false)

  if (!prompts || prompts.length === 0) {
    return {
      totalViews: 0, totalCopies: 0, totalForks: 0,
      totalUpvotes: 0, totalDownvotes: 0, avgQualityScore: 0,
      promptCount: 0, copyRate: 0, forkRate: 0,
    }
  }

  const promptIds = prompts.map(p => p.id)
  const { data: stats } = await supabase
    .from('prompt_stats')
    .select('view_count, copy_count, fork_count, upvotes, downvotes, quality_score')
    .in('prompt_id', promptIds)

  const result: CreatorStats = {
    totalViews: 0, totalCopies: 0, totalForks: 0,
    totalUpvotes: 0, totalDownvotes: 0, avgQualityScore: 0,
    promptCount: prompts.length, copyRate: 0, forkRate: 0,
  }

  if (stats && stats.length > 0) {
    let qualitySum = 0, qualityCount = 0
    for (const s of stats) {
      result.totalViews += s.view_count || 0
      result.totalCopies += s.copy_count || 0
      result.totalForks += s.fork_count || 0
      result.totalUpvotes += s.upvotes || 0
      result.totalDownvotes += s.downvotes || 0
      if (s.quality_score && s.quality_score > 0) {
        qualitySum += s.quality_score
        qualityCount++
      }
    }
    result.avgQualityScore = qualityCount > 0 ? Math.round(qualitySum / qualityCount) : 0
    result.copyRate = result.totalViews > 0 ? Math.round((result.totalCopies / result.totalViews) * 1000) / 10 : 0
    result.forkRate = result.totalViews > 0 ? Math.round((result.totalForks / result.totalViews) * 1000) / 10 : 0
  }

  return result
}

// ─── Get Trends (7d vs prior 7d) ────────────────────────────

export async function getCreatorTrends(userId: string): Promise<CreatorTrends> {
  const supabase = await verifyUser(userId)

  // Get daily stats for the last 14 days so we can compare two 7-day windows
  const { data: rpcData } = await supabase
    .rpc('get_creator_daily_stats', { creator_id: userId, days_back: 14 })

  const neutral: CreatorTrends = {
    views: 'flat', copies: 'flat', forks: 'flat', votes: 'flat',
    viewsDelta: 0, copiesDelta: 0, forksDelta: 0, votesDelta: 0,
  }

  if (!rpcData || rpcData.length === 0) return neutral

  const today = new Date()
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const fourteenDaysAgo = new Date(today)
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

  let currentViews = 0, priorViews = 0
  let currentCopies = 0, priorCopies = 0
  let currentForks = 0, priorForks = 0
  let currentVotes = 0, priorVotes = 0

  for (const row of rpcData) {
    const d = new Date(row.stat_date + 'T00:00:00')
    const views = Number(row.views) || 0
    const copies = Number(row.copies) || 0
    const forks = Number(row.forks) || 0

    if (d >= sevenDaysAgo) {
      currentViews += views
      currentCopies += copies
      currentForks += forks
    } else if (d >= fourteenDaysAgo) {
      priorViews += views
      priorCopies += copies
      priorForks += forks
    }
  }

  // For votes, query the daily stats directly since the RPC doesn't return them
  const { data: prompts } = await supabase
    .from('prompts').select('id').eq('created_by', userId).eq('is_deleted', false)

  if (prompts && prompts.length > 0) {
    const promptIds = prompts.map(p => p.id)
    const { data: voteDays } = await supabase
      .from('prompt_daily_stats')
      .select('stat_date, upvotes, downvotes')
      .in('prompt_id', promptIds)
      .gte('stat_date', fourteenDaysAgo.toISOString().split('T')[0])

    if (voteDays) {
      for (const row of voteDays) {
        const d = new Date(row.stat_date + 'T00:00:00')
        const net = (row.upvotes || 0) - (row.downvotes || 0)
        if (d >= sevenDaysAgo) currentVotes += net
        else priorVotes += net
      }
    }
  }

  const calcTrend = (current: number, prior: number): { dir: 'up' | 'down' | 'flat', delta: number } => {
    if (current === prior) return { dir: 'flat', delta: 0 }
    if (prior === 0) return { dir: current > 0 ? 'up' : 'flat', delta: current > 0 ? 100 : 0 }
    const delta = Math.round(((current - prior) / prior) * 100)
    return { dir: current > prior ? 'up' : 'down', delta }
  }

  const vT = calcTrend(currentViews, priorViews)
  const cT = calcTrend(currentCopies, priorCopies)
  const fT = calcTrend(currentForks, priorForks)
  const voT = calcTrend(currentVotes, priorVotes)

  return {
    views: vT.dir, viewsDelta: vT.delta,
    copies: cT.dir, copiesDelta: cT.delta,
    forks: fT.dir, forksDelta: fT.delta,
    votes: voT.dir, votesDelta: voT.delta,
  }
}

// ─── Get Time Series ────────────────────────────────────────

export async function getCreatorTimeSeries(
  userId: string,
  days: number = 30
): Promise<DailyDataPoint[]> {
  const supabase = await verifyUser(userId)

  const { data: rpcData, error: rpcError } = await supabase
    .rpc('get_creator_daily_stats', { creator_id: userId, days_back: days })

  if (!rpcError && rpcData && rpcData.length > 0) {
    return rpcData.map((row: any) => ({
      date: row.stat_date,
      views: Number(row.views) || 0,
      copies: Number(row.copies) || 0,
      forks: Number(row.forks) || 0,
    }))
  }

  // Fallback: generate empty series + fill from table
  const points: DailyDataPoint[] = []
  const now = new Date()
  for (let i = days; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    points.push({ date: d.toISOString().split('T')[0], views: 0, copies: 0, forks: 0 })
  }

  const { data: prompts } = await supabase
    .from('prompts').select('id').eq('created_by', userId).eq('is_deleted', false)

  if (prompts && prompts.length > 0) {
    const promptIds = prompts.map(p => p.id)
    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() - days)

    const { data: dailyData } = await supabase
      .from('prompt_daily_stats')
      .select('stat_date, views, copies, forks')
      .in('prompt_id', promptIds)
      .gte('stat_date', startDate.toISOString().split('T')[0])

    if (dailyData) {
      const dateMap = new Map<string, DailyDataPoint>()
      for (const point of points) dateMap.set(point.date, point)
      for (const row of dailyData) {
        const existing = dateMap.get(row.stat_date)
        if (existing) {
          existing.views += row.views || 0
          existing.copies += row.copies || 0
          existing.forks += row.forks || 0
        }
      }
    }
  }

  return points
}

// ─── Get Top Prompts ────────────────────────────────────────

export async function getCreatorTopPrompts(
  userId: string,
  limit: number = 10
): Promise<TopPrompt[]> {
  const supabase = await verifyUser(userId)

  const { data: rpcData, error: rpcError } = await supabase
    .rpc('get_creator_top_prompts', { creator_id: userId, result_limit: limit })

  if (!rpcError && rpcData && rpcData.length > 0) {
    return rpcData.map((row: any) => ({
      promptId: row.prompt_id,
      title: row.title,
      slug: row.slug,
      model: row.model,
      viewCount: row.view_count || 0,
      copyCount: row.copy_count || 0,
      forkCount: row.fork_count || 0,
      upvotes: row.upvotes || 0,
      downvotes: row.downvotes || 0,
      qualityScore: row.quality_score || 0,
      totalEngagement: Number(row.total_engagement) || 0,
      createdAt: row.created_at,
    }))
  }

  // Fallback
  const { data: prompts } = await supabase
    .from('prompts')
    .select(`id, title, slug, model, created_at,
      prompt_stats (view_count, copy_count, fork_count, upvotes, downvotes, quality_score)`)
    .eq('created_by', userId).eq('is_deleted', false).limit(50)

  if (!prompts || prompts.length === 0) return []

  const mapped: TopPrompt[] = prompts.map(p => {
    const s = (p.prompt_stats as any) || {}
    const views = s.view_count || 0, copies = s.copy_count || 0, forks = s.fork_count || 0
    return {
      promptId: p.id, title: p.title, slug: p.slug, model: p.model,
      viewCount: views, copyCount: copies, forkCount: forks,
      upvotes: s.upvotes || 0, downvotes: s.downvotes || 0,
      qualityScore: s.quality_score || 0,
      totalEngagement: views + copies * 3 + forks * 5,
      createdAt: p.created_at,
    }
  })

  mapped.sort((a, b) => b.totalEngagement - a.totalEngagement)
  return mapped.slice(0, limit)
}

// ─── Get Token Savings Estimate ─────────────────────────────

export async function getTokenSavingsEstimate(userId: string): Promise<TokenSavings> {
  const supabase = await verifyUser(userId)

  // Get prompts with their text lengths and model info
  const { data: prompts } = await supabase
    .from('prompts')
    .select(`
      id, model, system_prompt, user_prompt_template,
      prompt_stats (copy_count)
    `)
    .eq('created_by', userId)
    .eq('is_deleted', false)

  if (!prompts || prompts.length === 0) {
    return { totalSavings: 0, totalTokensSaved: 0, breakdown: [] }
  }

  // Aggregate by model
  const modelMap = new Map<string, { promptCount: number; tokensSaved: number; savings: number }>()

  for (const p of prompts) {
    const stats = p.prompt_stats as any
    const copies = stats?.copy_count || 0
    if (copies === 0) continue

    const textLen = (p.system_prompt || '').length + (p.user_prompt_template || '').length
    const tokens = Math.ceil(textLen / 4) // ~4 chars per token
    const model = p.model || 'unknown'
    const pricePerM = MODEL_PRICING[model] ?? DEFAULT_PRICE_PER_M
    const tokensSaved = tokens * copies
    const savings = (tokensSaved / 1_000_000) * pricePerM

    const existing = modelMap.get(model) || { promptCount: 0, tokensSaved: 0, savings: 0 }
    existing.promptCount++
    existing.tokensSaved += tokensSaved
    existing.savings += savings
    modelMap.set(model, existing)
  }

  const breakdown = Array.from(modelMap.entries())
    .map(([model, data]) => ({ model, ...data }))
    .sort((a, b) => b.savings - a.savings)

  return {
    totalSavings: Math.round(breakdown.reduce((sum, b) => sum + b.savings, 0) * 100) / 100,
    totalTokensSaved: breakdown.reduce((sum, b) => sum + b.tokensSaved, 0),
    breakdown,
  }
}


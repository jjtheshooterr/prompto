import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Dedicated search rate limiter — separate from the global middleware limiter
// so we can tune it independently. Fail open if Upstash isn't configured.
let searchLimiter: Ratelimit | null = null
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    searchLimiter = new Ratelimit({
      redis: new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      }),
      limiter: Ratelimit.slidingWindow(30, '60 s'),
      prefix: 'rl:search',
      analytics: false, // Don't double-count — middleware already tracks analytics
    })
  } catch (err) {
    console.error('Failed to init search rate limiter:', err)
  }
}

export async function GET(req: NextRequest) {
  // ── Rate limiting ──────────────────────────────────────────────────────────
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'

  if (searchLimiter) {
    const { success } = await searchLimiter.limit(ip)
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
  }

  const q = (new URL(req.url).searchParams.get('q') ?? '').trim()
  const supabase = await createClient()

  // Check auth — used to personalise the CTA, not to gate results
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const isAnon = !user

  // ── Trending: empty / very short query ────────────────────────────────────
  if (q.length < 2) {
    const { data: trending } = await supabase
      .from('problems')
      .select('id, title, slug, short_id, industry')
      .eq('status', 'published')
      .order('updated_at', { ascending: false })
      .limit(5)

    return NextResponse.json(
      {
        results: (trending ?? []).map((p) => ({
          id: p.id,
          kind: 'problem',
          title: p.title,
          href: `/problems/${p.slug}-${p.short_id}`,
          subtitle: p.industry ?? null,
        })),
        isTrending: true,
        isAnon,
      },
      // Cache trending for 60s at the CDN — it barely changes
      { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } },
    )
  }

  // ── Live search ────────────────────────────────────────────────────────────
  // Two parallel queries: problems + prompts
  const [{ data: problems }, { data: promptsRaw }] = await Promise.all([
    supabase
      .from('problems')
      .select('id, title, slug, short_id, industry')
      .ilike('title', `%${q}%`)
      .eq('status', 'published')
      .limit(4),

    supabase
      .from('prompts')
      .select('id, title, slug, problem_id')
      .ilike('title', `%${q}%`)
      .eq('status', 'published')
      .limit(4),
  ])

  // Batch-fetch problem context for the prompt results (one extra query,
  // avoids N+1 and keeps the join logic simple)
  const problemIds = [
    ...new Set((promptsRaw ?? []).map((p) => p.problem_id).filter(Boolean)),
  ]
  const { data: promptProblems } =
    problemIds.length > 0
      ? await supabase
          .from('problems')
          .select('id, title, slug, short_id')
          .in('id', problemIds)
      : { data: [] }

  const probById = new Map((promptProblems ?? []).map((p) => [p.id, p]))

  // Build result lists — problems first (better for discovery)
  const problemResults = (problems ?? []).slice(0, 3).map((p) => ({
    id: p.id,
    kind: 'problem' as const,
    title: p.title,
    href: `/problems/${p.slug}-${p.short_id}`,
    subtitle: p.industry ?? null,
  }))

  const promptResults = (promptsRaw ?? []).slice(0, 3).map((p) => {
    const prob = probById.get(p.problem_id)
    return {
      id: p.id,
      kind: 'prompt' as const,
      title: p.title,
      href: `/prompts/${p.slug || p.id}`,
      subtitle: prob?.title ?? null,
    }
  })

  // Interleave up to 5 total — favour problems for non-logged-in discovery
  const combined = [...problemResults, ...promptResults].slice(0, 5)

  return NextResponse.json({ results: combined, isTrending: false, isAnon })
}

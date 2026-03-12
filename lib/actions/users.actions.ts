'use server'

import { createClient } from '@/lib/supabase/server'
import { LeaderboardUser } from './leaderboard.actions'

export async function getUserProfileByUsername(username: string) {
  const supabase = await createClient()

  // 1. Fetch user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .ilike('username', username)
    .single()

  if (profileError || !profile) {
    return null
  }

  const userId = profile.id

  // 2. Fetch user's leaderboard stats (points, tier, etc.)
  const { data: stats } = await supabase
    .from('mv_user_leaderboard')
    .select('*')
    .eq('user_id', userId)
    .single()

  // 3. Fetch public problems created by user
  const { data: problems } = await supabase
    .from('problems')
    .select('id, title, slug, created_at, difficulty, industry, goal, problem_stats(*)')
    .eq('created_by', userId)
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })

  // 4. Fetch public prompts created by user
  const { data: prompts } = await supabase
    .from('prompts')
    .select('id, title, slug, created_at, model, status, parent_prompt_id, prompt_stats(*), problems(title, slug)')
    .eq('created_by', userId)
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })

  return {
    profile,
    stats: stats as LeaderboardUser | null,
    problems: problems || [],
    prompts: prompts || []
  }
}

'use server'

import { createClient } from '@/lib/supabase/server'

export type LeaderboardUser = {
  user_id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  problems_solved: number
  total_quality_score: number
  total_upvotes: number
  total_forks: number
  total_points: number
  tier: 'Grandmaster' | 'Master' | 'Expert' | 'Contributor' | 'Novice'
}

export type LeaderboardPrompt = {
  prompt_id: string
  title: string
  slug: string
  visibility: string
  problem_title: string
  problem_slug: string
  author_username: string | null
  author_name: string | null
  author_avatar: string | null
  quality_score: number
  upvotes: number
  forks: number
}

/**
 * Fetches the top users from the mv_user_leaderboard materialized view.
 */
export async function getTopUsers(limit = 100): Promise<LeaderboardUser[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('mv_user_leaderboard')
    .select('*')
    .order('total_points', { ascending: false })
    .order('total_quality_score', { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching top users:", error)
    return []
  }

  return data as LeaderboardUser[]
}

/**
 * Fetches the top prompts from the mv_prompt_leaderboard materialized view.
 */
export async function getTopPrompts(limit = 100): Promise<LeaderboardPrompt[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('mv_prompt_leaderboard')
    .select('*')
    .order('quality_score', { ascending: false })
    .order('upvotes', { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching top prompts:", error)
    return []
  }

  return data as LeaderboardPrompt[]
}

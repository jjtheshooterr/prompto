'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Track prompt views - increments view_count directly in stats
 * Does NOT log to events table (prevents table explosion)
 */
export async function trackPromptView(promptId: string) {
  try {
    const supabase = await createClient()
    await supabase.rpc('increment_prompt_views', { prompt_id: promptId })
  } catch (error) {
    // Fail silently for analytics
    console.error('Failed to track view:', error)
  }
}

/**
 * Track prompt copies - increments copy_count directly in stats
 * Does NOT log to events table (prevents table explosion)
 */
export async function trackPromptCopy(promptId: string) {
  try {
    const supabase = await createClient()
    await supabase.rpc('increment_prompt_copies', { prompt_id: promptId })
  } catch (error) {
    // Fail silently for analytics
    console.error('Failed to track copy:', error)
  }
}

/**
 * Track fork event - logs to events table for lineage tracking
 * Also increments fork_count in stats
 */
export async function trackPromptFork(promptId: string, userId: string) {
  try {
    const supabase = await createClient()
    
    // Log fork event for lineage tracking
    await supabase
      .from('prompt_events')
      .insert({
        prompt_id: promptId,
        user_id: userId,
        event_type: 'fork'
      })
    
    // Increment fork count in stats
    await supabase.rpc('increment_fork_count', { prompt_id: promptId })
  } catch (error) {
    // Fail silently for analytics
    console.error('Failed to track fork:', error)
  }
}

/**
 * Track compare add event - logs to events table
 * Used for tracking when prompts are added to comparisons
 */
export async function trackCompareAdd(promptId: string, userId: string) {
  try {
    const supabase = await createClient()
    
    await supabase
      .from('prompt_events')
      .insert({
        prompt_id: promptId,
        user_id: userId,
        event_type: 'compare_add'
      })
  } catch (error) {
    // Fail silently for analytics
    console.error('Failed to track compare add:', error)
  }
}
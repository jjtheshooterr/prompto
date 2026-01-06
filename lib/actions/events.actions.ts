'use server'

import { createClient } from '@/lib/supabase/server'

export async function trackPromptEvent(
  promptId: string,
  eventType: 'view' | 'copy' | 'fork' | 'vote_up' | 'vote_down'
) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Insert event
    await supabase
      .from('prompt_events')
      .insert({
        prompt_id: promptId,
        user_id: user.id,
        event_type: eventType
      })

    // Update relevant counters in prompt_stats
    if (eventType === 'view') {
      await supabase.rpc('increment_view_count', { prompt_id: promptId })
    } else if (eventType === 'copy') {
      await supabase.rpc('increment_copy_count', { prompt_id: promptId })
    }
  } catch (error) {
    // Fail silently for analytics
    console.error('Failed to track event:', error)
  }
}
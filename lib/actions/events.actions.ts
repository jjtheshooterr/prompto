'use server'

import { createClient } from '@/lib/supabase/server'

export async function trackPromptEvent(
  promptId: string, 
  eventType: 'view' | 'copy' | 'fork' | 'compare_add'
) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase
      .from('prompt_events')
      .insert({
        prompt_id: promptId,
        user_id: user?.id || null, // Allow null for anonymous users
        event_type: eventType
      })

    if (error) {
      console.error('Error tracking event:', error)
      // Don't throw error for analytics - fail silently
    }

    // Update relevant counters in prompt_stats
    if (eventType === 'view') {
      await supabase.rpc('increment_view_count', { prompt_id: promptId })
    } else if (eventType === 'copy') {
      await supabase.rpc('increment_copy_count', { prompt_id: promptId })
    }
  } catch (error) {
    // Fail silently for analytics
    console.error('Error in trackPromptEvent:', error)
  }
}
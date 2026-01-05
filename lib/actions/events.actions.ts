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
      await supabase
        .from('prompt_stats')
        .update({ view_count: supabase.sql`view_count + 1` })
        .eq('prompt_id', promptId)
    } else if (eventType === 'copy') {
      await supabase
        .from('prompt_stats')
        .update({ copy_count: supabase.sql`copy_count + 1` })
        .eq('prompt_id', promptId)
    }
  } catch (error) {
    // Fail silently for analytics
    console.error('Error in trackPromptEvent:', error)
  }
}
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function setVote(promptId: string, value: 1 | -1) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Must be authenticated to vote')
  }

  // Upsert vote
  const { error } = await supabase
    .from('votes')
    .upsert({
      prompt_id: promptId,
      user_id: user.id,
      value
    })

  if (error) {
    throw new Error(`Failed to vote: ${error.message}`)
  }

  // Vote counts are automatically updated in prompt_stats via database triggers

  revalidatePath(`/prompts/${promptId}`)
}

export async function clearVote(promptId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Must be authenticated to vote')
  }

  const { error } = await supabase
    .from('votes')
    .delete()
    .eq('prompt_id', promptId)
    .eq('user_id', user.id)

  if (error) {
    throw new Error(`Failed to clear vote: ${error.message}`)
  }

  revalidatePath(`/prompts/${promptId}`)
}

export async function getUserVote(promptId: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await supabase
      .from('votes')
      .select('value')
      .eq('prompt_id', promptId)
      .eq('user_id', user.id)
      .single()

    return data?.value || null
  } catch {
    return null
  }
}
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function setVote(promptId: string, value: 1 | -1) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Authentication required')
  }

  const { error } = await supabase
    .from('votes')
    .upsert({
      prompt_id: promptId,
      user_id: user.id,
      value
    })

  if (error) {
    console.error('Error setting vote:', error)
    throw new Error('Failed to vote')
  }

  revalidatePath('/prompts/[id]', 'page')
}

export async function clearVote(promptId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Authentication required')
  }

  const { error } = await supabase
    .from('votes')
    .delete()
    .eq('prompt_id', promptId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error clearing vote:', error)
    throw new Error('Failed to clear vote')
  }

  revalidatePath('/prompts/[id]', 'page')
}

export async function getUserVote(promptId: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return null
    }

    const { data, error } = await supabase
      .from('votes')
      .select('value')
      .eq('prompt_id', promptId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      return null
    }

    return data?.value || null
  } catch (error) {
    return null
  }
}
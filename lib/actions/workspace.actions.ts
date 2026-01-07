'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addProblemMember({
  problemId,
  userEmail,
  role = 'member'
}: {
  problemId: string
  userEmail: string
  role?: 'admin' | 'member' | 'viewer'
}) {
  const supabase = await createClient()
  
  // Check if current user is owner or admin of the problem
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Must be authenticated')
  }

  // Check permissions
  const { data: problem } = await supabase
    .from('problems')
    .select('owner_id')
    .eq('id', problemId)
    .single()

  if (!problem) {
    throw new Error('Problem not found')
  }

  const isOwner = problem.owner_id === user.id
  
  if (!isOwner) {
    // Check if user is admin member
    const { data: membership } = await supabase
      .from('problem_members')
      .select('role')
      .eq('problem_id', problemId)
      .eq('user_id', user.id)
      .single()

    if (!membership || membership.role !== 'admin') {
      throw new Error('Only problem owners and admins can add members')
    }
  }

  // Find user by email using our database function
  const { data: targetUserId, error: lookupError } = await supabase
    .rpc('get_user_id_by_email', { user_email: userEmail })

  if (lookupError || !targetUserId) {
    throw new Error('User not found with that email address')
  }

  // Add member
  const { error } = await supabase
    .from('problem_members')
    .insert({
      problem_id: problemId,
      user_id: targetUserId,
      role
    })

  if (error) {
    if (error.code === '23505') { // Unique constraint violation
      throw new Error('User is already a member of this problem')
    }
    throw new Error(`Failed to add member: ${error.message}`)
  }

  revalidatePath('/workspace')
  return { success: true }
}

export async function removeProblemMember({
  problemId,
  userId
}: {
  problemId: string
  userId: string
}) {
  const supabase = await createClient()
  
  // Check permissions (same as add member)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Must be authenticated')
  }

  const { data: problem } = await supabase
    .from('problems')
    .select('owner_id')
    .eq('id', problemId)
    .single()

  if (!problem) {
    throw new Error('Problem not found')
  }

  const isOwner = problem.owner_id === user.id
  const isSelf = userId === user.id

  if (!isOwner && !isSelf) {
    // Check if user is admin member
    const { data: membership } = await supabase
      .from('problem_members')
      .select('role')
      .eq('problem_id', problemId)
      .eq('user_id', user.id)
      .single()

    if (!membership || membership.role !== 'admin') {
      throw new Error('Only problem owners, admins, or the member themselves can remove members')
    }
  }

  const { error } = await supabase
    .from('problem_members')
    .delete()
    .eq('problem_id', problemId)
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Failed to remove member: ${error.message}`)
  }

  revalidatePath('/workspace')
  return { success: true }
}
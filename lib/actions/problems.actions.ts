'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function listProblems({
  search = '',
  industry = '',
  sort = 'newest'
}: {
  search?: string
  industry?: string
  sort?: 'newest' | 'top'
}) {
  const supabase = await createClient()
  
  let query = supabase
    .from('problems')
    .select('*')
    .eq('is_listed', true)
    .eq('is_hidden', false)
    .eq('is_deleted', false)
    .in('visibility', ['public', 'unlisted']) // Include unlisted for browse page

  // Apply search filter
  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,tags.cs.{${search}}`)
  }

  // Apply industry filter
  if (industry) {
    query = query.eq('industry', industry)
  }

  // Apply sorting
  if (sort === 'newest') {
    query = query.order('created_at', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false }) // Default for now
  }

  const { data: problems, error } = await query

  if (error) {
    console.error('Error fetching problems:', error)
    return []
  }

  if (!problems || problems.length === 0) {
    return []
  }

  // Get prompt counts for each problem (only count visible, non-deleted prompts)
  const problemsWithCounts = await Promise.all(
    problems.map(async (problem) => {
      const { count } = await supabase
        .from('prompts')
        .select('id', { count: 'exact' })
        .eq('problem_id', problem.id)
        .eq('is_listed', true)
        .eq('is_hidden', false)
        .eq('is_deleted', false)
        .in('visibility', ['public', 'unlisted'])

      return {
        ...problem,
        prompts: Array(count || 0).fill(null) // Create array with correct length for compatibility
      }
    })
  )

  return problemsWithCounts
}

export async function getPublicProblemBySlug(slug: string) {
  const supabase = await createClient()
  
  // RLS will handle visibility filtering, but we still check for soft deletes
  const { data, error } = await supabase
    .from('problems')
    .select(`
      *,
      inputs,
      constraints,
      success_criteria
    `)
    .eq('slug', slug)
    .eq('is_deleted', false)
    .single()

  if (error) {
    console.error('Error fetching problem:', error)
    return null
  }

  return data
}

export async function createProblem(formData: FormData) {
  try {
    const supabase = await createClient()
    
    // Try to get user with more detailed error handling
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('Server action - createProblem auth check:', {
      hasUser: !!user,
      userEmail: user?.email,
      authError: authError?.message,
      cookies: process.env.NODE_ENV === 'development' ? 'checking cookies...' : 'hidden'
    })
    
    if (authError) {
      console.error('Auth error in createProblem:', authError)
      throw new Error(`Authentication error: ${authError.message}`)
    }
    
    if (!user) {
      console.error('No user found in createProblem')
      throw new Error('Must be authenticated to create problems')
    }

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const tags = (formData.get('tags') as string).split(',').map(tag => tag.trim()).filter(Boolean)
  const industry = formData.get('industry') as string
  const visibility = formData.get('visibility') as string || 'public'

  // Create slug from title
  const slug = title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  // Get or create user's default workspace
  let { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!workspace) {
    // Generate a unique workspace slug
    const workspaceSlug = `user-${user.id.replace(/-/g, '')}`
    
    const { data: newWorkspace } = await supabase
      .from('workspaces')
      .insert({
        name: `${user.email}'s Workspace`,
        slug: workspaceSlug,
        owner_id: user.id
      })
      .select('id')
      .single()
    
    workspace = newWorkspace
  }

  const { data, error } = await supabase
    .from('problems')
    .insert({
      title,
      description,
      tags,
      industry,
      visibility,
      slug,
      is_listed: true,
      created_by: user.id,
      owner_id: user.id, // Set owner_id for new visibility system
      workspace_id: workspace?.id
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create problem: ${error.message}`)
  }

  // If creating a private problem, add the owner as a member
  if (visibility === 'private') {
    await supabase
      .from('problem_members')
      .insert({
        problem_id: data.id,
        user_id: user.id,
        role: 'owner'
      })
  }

  revalidatePath('/problems')
  return data
} catch (error) {
  console.error('Error in createProblem:', error)
  throw error
}
}
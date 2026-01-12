'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function listProblems({
  search = '',
  industry = '',
  sort = 'newest',
  page = 1,
  limit = 12
}: {
  search?: string
  industry?: string
  sort?: 'newest' | 'top'
  page?: number
  limit?: number
}) {
  const supabase = await createClient()

  // Calculate range
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('problems')
    .select('*, problem_stats(*), problem_tags(tags(name))', { count: 'exact' })
    .eq('is_listed', true)
    .eq('is_hidden', false)
    .eq('is_deleted', false)
    .in('visibility', ['public', 'unlisted'])

  // Apply search filter
  if (search) {
    // Note: Tag search temporarily removed during schema migration
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
  }

  // Apply industry filter
  if (industry) {
    query = query.eq('industry', industry)
  }

  // Apply sorting
  if (sort === 'newest') {
    query = query.order('created_at', { ascending: false })
  } else if (sort === 'top') { // Fix sort logic if needed, or leave as default
    // If sorting by stats, we need inner join or foreign table sort, but for now fallback to created_at
    query = query.order('created_at', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  // Apply pagination
  query = query.range(from, to)

  const { data: problems, error, count } = await query

  if (error) {
    console.error('Error fetching problems:', error)
    return { data: [], total: 0, pages: 0 }
  }

  if (!problems || problems.length === 0) {
    return { data: [], total: 0, pages: 0 }
  }

  // Transform tags
  const transformedProblems = (problems || []).map((p: any) => ({
    ...p,
    tags: p.problem_tags?.map((pt: any) => pt.tags?.name).filter(Boolean) || []
  }))

  return {
    data: transformedProblems,
    total: count || 0,
    pages: Math.ceil((count || 0) / limit)
  }
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
      success_criteria,
      problem_tags(tags(name))
    `)
    .eq('slug', slug)
    .eq('is_deleted', false)
    .single()

  if (error) {
    console.error('Error fetching problem:', error)
    return null
  }

  if (data && data.problem_tags) {
    data.tags = data.problem_tags.map((pt: any) => pt.tags?.name).filter(Boolean)
  }

  return data
}

// New function that handles all problem access (public, unlisted, private with membership)
export async function getProblemBySlug(slug: string) {
  const supabase = await createClient()

  // RLS policies will automatically handle:
  // - Public problems: visible to everyone
  // - Unlisted problems: visible to everyone with link
  // - Private problems: visible to owner and members only
  const { data, error } = await supabase
    .from('problems')
    .select(`
      *,
      inputs,
      constraints,
      success_criteria,
      problem_tags(tags(name))
    `)
    .eq('slug', slug)
    .eq('is_deleted', false)
    .single()

  if (error) {
    console.error('Error fetching problem:', error)
    return null
  }

  if (data && data.problem_tags) {
    data.tags = data.problem_tags.map((pt: any) => pt.tags?.name).filter(Boolean)
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
    const tags = (formData.get('tags') as string)
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(Boolean)
      .filter((tag, index, array) => array.indexOf(tag) === index) // Remove duplicates
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
        // tags handled via RPC
        industry,
        visibility,
        slug,
        is_listed: true,
        created_by: user.id,
        owner_id: user.id,
        workspace_id: workspace?.id
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create problem: ${error.message}`)
    }

    // Sync tags using the new RPC
    if (tags && tags.length > 0) {
      const { error: tagError } = await supabase.rpc('manage_problem_tags', {
        p_problem_id: data.id,
        p_tags: tags
      })
      if (tagError) console.error('Failed to save tags:', tagError)
    }

    // If creating a private problem, add the owner as a member
    if (visibility === 'private') {
      const { error: memberError } = await supabase
        .from('problem_members')
        .insert({
          problem_id: data.id,
          user_id: user.id,
          role: 'owner'
        })

      if (memberError) {
        console.error('Error adding owner as member:', memberError)
        // Don't throw error here as the problem was created successfully
        // The owner can still access it through the owner_id check in RLS
      }
    }

    revalidatePath('/problems')
    return data
  } catch (error) {
    console.error('Error in createProblem:', error)
    throw error
  }
}
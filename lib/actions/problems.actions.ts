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
    .select(`
      *,
      problem_stats(*),
      problem_tags(tags(name))
    `, { count: 'exact' })
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

  // Get unique user IDs
  const userIds = [...new Set(problems.map((p: any) => p.created_by).filter(Boolean))]

  // Fetch author data separately
  let authorsMap: Record<string, any> = {}
  if (userIds.length > 0) {
    const { data: authors } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .in('id', userIds)


    if (authors) {
      authorsMap = authors.reduce((acc, author) => {
        acc[author.id] = author
        return acc
      }, {} as Record<string, any>)
    }
  }

  // Transform tags and attach author data
  const transformedProblems = (problems || []).map((p: any) => {
    const problem = {
      ...p,
      tags: p.problem_tags?.map((pt: any) => pt.tags?.name).filter(Boolean) || [],
      author: p.created_by ? authorsMap[p.created_by] : null
    }
    return problem
  })

  return {
    data: transformedProblems,
    total: count || 0,
    pages: Math.ceil((count || 0) / limit)
  }
}

export async function getPublicProblemBySlug(slugOrShortId: string, shortId?: string | null, isFullUuid?: boolean) {
  const supabase = await createClient()

  // RLS will handle visibility filtering, but we still check for soft deletes
  let query = supabase
    .from('problems')
    .select(`
      *,
      real_world_context,
      difficulty,
      example_input,
      expected_output,
      known_failure_modes,
      problem_tags(tags(name))
    `)
    .eq('is_deleted', false)

  let data: any = null
  let error: any = null

  if (isFullUuid) {
    const res = await query.eq('id', slugOrShortId).single()
    data = res.data
    error = res.error
  } else if (shortId) {
    // To gracefully handle missing short_id column on production, fetch by slug and filter by shortId in-memory
    const res = await query.eq('slug', slugOrShortId)
    if (res.error) {
      error = res.error
    } else if (res.data) {
      data = res.data.find((p: any) => p.id.startsWith(shortId)) || (res.data.length > 0 ? res.data[0] : null)
      if (data && !data.short_id) {
        data.short_id = data.id.slice(0, 8)
      }
    }
  } else {
    // legacy or fallback: match by exact slug
    const res = await query.eq('slug', slugOrShortId)
    if (res.error) {
      error = res.error
    } else if (res.data && res.data.length > 0) {
      data = res.data[0]
      if (data && !data.short_id) {
        data.short_id = data.id.slice(0, 8)
      }
    }
  }

  if (error) {
    console.error('Error fetching problem:', error)
    return null
  }

  if (data) {
    // Transform tags
    if (data.problem_tags) {
      data.tags = data.problem_tags.map((pt: any) => pt.tags?.name).filter(Boolean)
    }

    // Fetch author data separately
    if (data.created_by) {
      const { data: author } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .eq('id', data.created_by)
        .single()

      if (author) {
        data.author = author
      }
    }
  }

  return data
}

// New function that handles all problem access (public, private with membership)
export async function getProblemBySlug(slugOrShortId: string, shortId?: string | null, isFullUuid?: boolean) {
  const supabase = await createClient()

  let query = supabase
    .from('problems')
    .select(`
      *,
      real_world_context,
      difficulty,
      example_input,
      expected_output,
      known_failure_modes,
      problem_tags(tags(name))
    `)
    .eq('is_deleted', false)

  let data: any = null
  let error: any = null

  if (isFullUuid) {
    const res = await query.eq('id', slugOrShortId).single()
    data = res.data
    error = res.error
  } else if (shortId) {
    // Graceful fallback for production schema safety
    const res = await query.eq('slug', slugOrShortId)
    if (res.error) {
      error = res.error
    } else if (res.data) {
      data = res.data.find((p: any) => p.id.startsWith(shortId)) || (res.data.length > 0 ? res.data[0] : null)
      if (data && !data.short_id) {
        data.short_id = data.id.slice(0, 8)
      }
    }
  } else {
    // fallback
    const res = await query.eq('slug', slugOrShortId)
    if (res.error) {
      error = res.error
    } else if (res.data && res.data.length > 0) {
      data = res.data[0]
      if (data && !data.short_id) {
        data.short_id = data.id.slice(0, 8)
      }
    }
  }

  if (error) {
    console.error('Error fetching problem:', error)
    return null
  }

  if (data) {
    // Transform tags
    if (data.problem_tags) {
      data.tags = data.problem_tags.map((pt: any) => pt.tags?.name).filter(Boolean)
    }

    // Fetch author data separately
    if (data.created_by) {
      const { data: author } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .eq('id', data.created_by)
        .single()

      if (author) {
        data.author = author
      }
    }
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

    // Spec Fields
    const real_world_context = formData.get('real_world_context') as string
    const difficulty = formData.get('difficulty') as string
    const example_input = formData.get('example_input') as string
    const expected_output = formData.get('expected_output') as string
    const known_failure_modes_raw = formData.get('known_failure_modes') as string
    const known_failure_modes = known_failure_modes_raw
      ? known_failure_modes_raw.split(',').map(m => m.trim()).filter(Boolean)
      : []

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
        workspace_id: workspace?.id,
        real_world_context: real_world_context || null,
        difficulty: difficulty || null,
        example_input: example_input || null,
        expected_output: expected_output || null,
        known_failure_modes
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
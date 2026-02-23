'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type PromptSort = 'newest' | 'top' | 'best' | 'most_improved'

export async function listPromptsByProblem(problemId: string, sort: PromptSort = 'newest') {
  const supabase = await createClient()

  let query = supabase
    .from(sort === 'best' || sort === 'most_improved' ? 'prompt_rankings' : 'prompts')
    .select('*')
    .eq('problem_id', problemId)
    .eq('is_listed', true)
    .eq('is_hidden', false)
    .eq('is_deleted', false)

  if (sort === 'best') {
    query = query.order('rank_score', { ascending: false })
  } else if (sort === 'most_improved') {
    query = query.order('improvement_score', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const { data: prompts, error } = await query

  if (error) {
    console.error('Error fetching prompts:', error)
    return []
  }

  if (!prompts || prompts.length === 0) return []

  const promptIds = prompts.map((p: any) => p.id)
  const { data: statsData } = await supabase
    .from('prompt_stats')
    .select('*')
    .in('prompt_id', promptIds)

  const userIds = [...new Set(prompts.map((p: any) => p.created_by).filter(Boolean))]
  let authorsMap: Record<string, any> = {}
  if (userIds.length > 0) {
    const { data: authors } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .in('id', userIds)
    if (authors) {
      authorsMap = authors.reduce((acc: Record<string, any>, a: any) => {
        acc[a.id] = a
        return acc
      }, {})
    }
  }

  const defaultStats = {
    upvotes: 0, downvotes: 0, score: 0,
    copy_count: 0, view_count: 0, fork_count: 0,
    works_count: 0, fails_count: 0, reviews_count: 0,
  }

  let promptsWithStats = prompts.map((prompt: any) => {
    const stats = statsData?.find((s: any) => s.prompt_id === prompt.id)
    return {
      ...prompt,
      author: prompt.created_by ? authorsMap[prompt.created_by] : null,
      prompt_stats: [stats ? { ...defaultStats, ...stats } : defaultStats],
    }
  })

  if (sort === 'top') {
    promptsWithStats = promptsWithStats.sort((a: any, b: any) => {
      const aUp = a.prompt_stats[0]?.upvotes || 0
      const bUp = b.prompt_stats[0]?.upvotes || 0
      return bUp !== aUp ? bUp - aUp : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }

  return promptsWithStats
}

export async function getPromptById(id: string) {
  const supabase = await createClient()

  // First get the prompt
  const { data: prompt, error: promptError } = await supabase
    .from('prompts')
    .select(`
      *,
      problems!prompts_problem_id_fkey (title, slug),
      prompt_stats (
        upvotes, downvotes, score, copy_count, view_count, fork_count,
        works_count, fails_count, reviews_count
      )
    `)
    .eq('id', id)
    .single()

  if (promptError) {
    console.error('Error fetching prompt:', promptError)
    return null
  }

  return prompt
}

export async function getPromptsByIds(ids: string[]) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('prompts')
    .select(`
      *,
      prompt_stats (
        upvotes, downvotes, score, copy_count, view_count, fork_count,
        works_count, fails_count, reviews_count
      )
    `)
    .in('id', ids)

  if (error) {
    console.error('Error fetching prompts:', error)
    return []
  }

  return data || []
}

export async function createPrompt(formData: FormData) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    console.log('Server action - createPrompt auth check:', {
      hasUser: !!user,
      userEmail: user?.email,
      authError: authError?.message
    })

    if (authError) {
      console.error('Auth error in createPrompt:', authError)
      throw new Error(`Authentication error: ${authError.message}`)
    }

    if (!user) {
      console.error('No user found in createPrompt')
      throw new Error('Must be authenticated to create prompts')
    }

    const problemId = formData.get('problem_id') as string
    const title = formData.get('title') as string
    const systemPrompt = formData.get('system_prompt') as string
    const userPromptTemplate = formData.get('user_prompt_template') as string
    const model = formData.get('model') as string
    const params = formData.get('params') as string
    const exampleInput = formData.get('example_input') as string
    const exampleOutput = formData.get('example_output') as string
    const status = formData.get('status') as string || 'production'

    // Get or create user's workspace
    let { data: workspace } = await supabase
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!workspace) {
      // Create workspace if it doesn't exist
      const workspaceSlug = `user-${user.id.replace(/-/g, '')}`

      const { data: newWorkspace, error: workspaceError } = await supabase
        .from('workspaces')
        .insert({
          name: `${user.email}'s Workspace`,
          slug: workspaceSlug,
          owner_id: user.id
        })
        .select('id')
        .single()

      if (workspaceError) {
        console.error('Failed to create workspace:', workspaceError)
        // If workspace creation fails, set to null
        workspace = { id: null }
      } else {
        // Add user as workspace member
        await supabase
          .from('workspace_members')
          .insert({
            workspace_id: newWorkspace.id,
            user_id: user.id,
            role: 'owner'
          })

        workspace = newWorkspace
      }
    }

    let parsedParams = {}
    try {
      parsedParams = params ? JSON.parse(params) : {}
    } catch (e) {
      throw new Error('Invalid JSON in params field')
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50) + '-' + Math.random().toString(36).substring(2, 8)

    const { data, error } = await supabase
      .from('prompts')
      .insert({
        problem_id: problemId,
        title,
        slug,
        system_prompt: systemPrompt,
        user_prompt_template: userPromptTemplate,
        model,
        params: parsedParams,
        example_input: exampleInput,
        example_output: exampleOutput,
        status,
        visibility: 'public',
        is_listed: true,
        created_by: user.id,
        workspace_id: workspace?.id || null
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create prompt:', error)
      throw new Error(`Failed to create prompt: ${error.message}`)
    }

    // Stats are auto-created by database trigger

    revalidatePath('/problems')
    revalidatePath(`/problems/${problemId}`)
    return data
  } catch (error) {
    console.error('Error in createPrompt:', error)
    throw error
  }
}

export async function forkPrompt(parentPromptId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Must be authenticated to fork prompts')
  }

  // Get the parent prompt
  const { data: parentPrompt } = await supabase
    .from('prompts')
    .select('*')
    .eq('id', parentPromptId)
    .single()

  if (!parentPrompt) {
    throw new Error('Parent prompt not found')
  }

  // Generate slug for forked prompt
  const forkTitle = `${parentPrompt.title} (Fork)`
  const slug = forkTitle
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50) + '-' + Math.random().toString(36).substring(2, 8)

  // Create forked prompt
  const { data: forkedPrompt, error } = await supabase
    .from('prompts')
    .insert({
      ...parentPrompt,
      id: undefined, // Let DB generate new ID
      slug,
      parent_prompt_id: parentPromptId,
      created_by: user.id,
      title: forkTitle,
      created_at: undefined,
      updated_at: undefined
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to fork prompt: ${error.message}`)
  }

  // Stats are auto-created by database trigger

  // Update fork count on parent
  await supabase.rpc('increment_fork_count', { prompt_id: parentPromptId })

  revalidatePath('/problems')
  return forkedPrompt
}

export async function forkPromptWithModal(parentPromptId: string, newTitle: string, notes: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Must be authenticated to fork prompts')
  }

  // Get the parent prompt
  const { data: parentPrompt, error: fetchError } = await supabase
    .from('prompts')
    .select('*')
    .eq('id', parentPromptId)
    .single()

  if (fetchError || !parentPrompt) {
    throw new Error('Parent prompt not found')
  }

  // Check if prompt is hidden/unlisted and user has access
  if (parentPrompt.is_hidden || !parentPrompt.is_listed) {
    // Check if user is workspace member
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', parentPrompt.workspace_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      throw new Error('Cannot fork hidden or unlisted prompts')
    }
  }

  // Get user's workspace
  let { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!workspace) {
    throw new Error('User workspace not found')
  }

  // Prepare notes with attribution
  const attributedNotes = `Forked from ${parentPromptId}. ${notes}`

  // Generate slug from new title
  const slug = newTitle
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50) + '-' + Math.random().toString(36).substring(2, 8)

  // Create forked prompt
  const { data: forkedPrompt, error } = await supabase
    .from('prompts')
    .insert({
      workspace_id: workspace.id,
      problem_id: parentPrompt.problem_id,
      visibility: parentPrompt.visibility,
      title: newTitle,
      slug,
      system_prompt: parentPrompt.system_prompt,
      user_prompt_template: parentPrompt.user_prompt_template,
      model: parentPrompt.model,
      params: parentPrompt.params,
      example_input: parentPrompt.example_input,
      example_output: parentPrompt.example_output,
      known_failures: parentPrompt.known_failures,
      notes: attributedNotes,
      parent_prompt_id: parentPromptId,
      status: 'draft', // Start as draft
      is_listed: true,
      is_hidden: false,
      is_reported: false,
      report_count: 0,
      created_by: user.id
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to fork prompt: ${error.message}`)
  }

  // Stats are auto-created by database trigger

  // Insert fork event
  await supabase
    .from('prompt_events')
    .insert({
      prompt_id: parentPromptId,
      user_id: user.id,
      event_type: 'fork'
    })

  // Update fork count on parent
  await supabase.rpc('increment_fork_count', { prompt_id: parentPromptId })

  revalidatePath('/problems')
  revalidatePath(`/prompts/${parentPromptId}`)
  return forkedPrompt
}

export async function getPromptForks(promptId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('prompts')
    .select(`
      id,
      title,
      created_at,
      created_by,
      notes,
      profiles!created_by (
        username
      )
    `)
    .eq('parent_prompt_id', promptId)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error fetching prompt forks:', error)
    return []
  }

  // Transform the data to match our interface
  return (data || []).map(fork => ({
    ...fork,
    profiles: Array.isArray(fork.profiles) ? fork.profiles[0] : fork.profiles
  }))
}

export async function getParentPrompt(parentPromptId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('prompts')
    .select('id, title')
    .eq('id', parentPromptId)
    .single()

  if (error) {
    console.error('Error fetching parent prompt:', error)
    return null
  }

  return data
}

export async function updatePrompt(promptId: string, formData: FormData) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error('Must be authenticated to update prompts')
    }

    const title = formData.get('title') as string
    const systemPrompt = formData.get('system_prompt') as string
    const userPromptTemplate = formData.get('user_prompt_template') as string
    const model = formData.get('model') as string
    const params = formData.get('params') as string
    const exampleInput = formData.get('example_input') as string
    const exampleOutput = formData.get('example_output') as string
    const notes = formData.get('notes') as string
    const status = formData.get('status') as string

    let parsedParams = {}
    try {
      parsedParams = params ? JSON.parse(params) : {}
    } catch (e) {
      throw new Error('Invalid JSON in params field')
    }

    const { data, error } = await supabase
      .from('prompts')
      .update({
        title,
        system_prompt: systemPrompt,
        user_prompt_template: userPromptTemplate,
        model,
        params: parsedParams,
        example_input: exampleInput,
        example_output: exampleOutput,
        notes,
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', promptId)
      .eq('created_by', user.id) // Only allow updating own prompts
      .select()
      .single()

    if (error) {
      console.error('Failed to update prompt:', error)
      throw new Error(`Failed to update prompt: ${error.message}`)
    }

    revalidatePath(`/prompts/${promptId}`)
    return data
  } catch (error) {
    console.error('Error in updatePrompt:', error)
    throw error
  }
}

export async function searchPrompts(searchQuery: string, limit: number = 20) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('prompts')
    .select(`
      *,
      problems!prompts_problem_id_fkey (title, slug),
      prompt_stats (
        upvotes, downvotes, score, copy_count, view_count, fork_count,
        works_count, fails_count, reviews_count
      )
    `)
    .textSearch('fts', searchQuery, {
      type: 'websearch',
      config: 'english'
    })
    .eq('is_listed', true)
    .eq('is_hidden', false)
    .eq('is_deleted', false)
    .limit(limit)

  if (error) {
    console.error('Error searching prompts:', error)
    return []
  }

  return data || []
}

export async function getPromptChildren(promptId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .rpc('get_prompt_children', { p_prompt_id: promptId })

  if (error) {
    console.error('Error fetching prompt children:', error)
    return []
  }

  return data || []
}

export async function getPromptLineage(promptId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .rpc('get_prompt_lineage', { p_prompt_id: promptId })

  if (error) {
    console.error('Error fetching prompt lineage:', error)
    return []
  }

  return data || []
}

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const CreatePromptSchema = z.object({
  problem_id: z.string().uuid('Invalid problem ID'),
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long').trim(),
  system_prompt: z.string().max(10000, 'System prompt is too long').trim().optional(),
  user_prompt_template: z.string().max(10000, 'User prompt template is too long').trim().optional(),
  model: z.string().min(1, 'Model is required').max(50),
  params: z.string().optional(),
  example_input: z.string().max(5000).trim().optional(),
  example_output: z.string().max(5000).trim().optional(),
  status: z.enum(['draft', 'production', 'archived']).default('production'),
})

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

    if (authError || !user) {
      throw new Error('Must be authenticated to create prompts')
    }

    const formDataObj = {
      problem_id: formData.get('problem_id'),
      title: formData.get('title'),
      system_prompt: formData.get('system_prompt'),
      user_prompt_template: formData.get('user_prompt_template'),
      model: formData.get('model'),
      params: formData.get('params'),
      example_input: formData.get('example_input'),
      example_output: formData.get('example_output'),
      status: formData.get('status') || 'production',
    }

    const parsed = CreatePromptSchema.safeParse(formDataObj)
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]
      throw new Error(firstError?.message ?? 'Invalid prompt data')
    }

    const {
      problem_id: problemId,
      title,
      system_prompt: systemPrompt,
      user_prompt_template: userPromptTemplate,
      model,
      params,
      example_input: exampleInput,
      example_output: exampleOutput,
      status
    } = parsed.data

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
          name: user.email ? `${user.email}'s Workspace` : 'My Workspace',
          slug: workspaceSlug,
          owner_id: user.id
        })
        .select('id')
        .single()

      if (workspaceError || !newWorkspace) {
        throw new Error('Failed to create your workspace. Please try again.')
      }

      // Add user as workspace member — throw if this fails so the user isn't
      // left as workspace owner without membership access
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: newWorkspace.id,
          user_id: user.id,
          role: 'owner'
        })

      if (memberError) {
        throw new Error('Failed to set up workspace membership. Please try again.')
      }

      workspace = newWorkspace
    }

    let parsedParams = {}
    try {
      parsedParams = params ? JSON.parse(params) : {}
    } catch (e) {
      throw new Error('Invalid JSON in params field')
    }

    // Generate slug from title
    const cleanTitle = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .substring(0, 50)

    const slug = (cleanTitle || 'prompt') + '-' + Math.random().toString(36).substring(2, 8)

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
        workspace_id: workspace.id
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create prompt:', error)
      throw new Error('Failed to create prompt due to an unexpected error. Please try again.')
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

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Must be authenticated to fork prompts')
  }

  // Get the parent prompt — only fork publicly visible, non-deleted prompts
  const { data: parentPrompt, error: fetchError } = await supabase
    .from('prompts')
    .select('*')
    .eq('id', parentPromptId)
    .eq('is_deleted', false)
    .single()

  if (fetchError || !parentPrompt) {
    throw new Error('Parent prompt not found or is no longer available')
  }

  // Get (or create) the forker's own workspace — fork always lands in the
  // forker's workspace, never in the parent's.
  let { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!workspace) {
    const { data: newWorkspace, error: wsError } = await supabase
      .from('workspaces')
      .insert({
        name: user.email ? `${user.email}'s Workspace` : 'My Workspace',
        slug: `user-${user.id.replace(/-/g, '')}`,
        owner_id: user.id,
      })
      .select('id')
      .single()

    if (wsError || !newWorkspace) {
      throw new Error('Could not create workspace for fork')
    }

    const { error: memberError } = await supabase.from('workspace_members').insert({
      workspace_id: newWorkspace.id,
      user_id: user.id,
      role: 'owner',
    })
    if (memberError) {
      throw new Error('Failed to set up workspace membership for fork')
    }
    workspace = newWorkspace
  }

  // Generate slug for forked prompt
  const forkTitle = `${parentPrompt.title} (Fork)`
  const cleanForkTitle = forkTitle
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .substring(0, 50)

  const slug = (cleanForkTitle || 'prompt') + '-' + Math.random().toString(36).substring(2, 8)

  // Create forked prompt — use an explicit field list, never spread the parent.
  // Spreading inherits is_reported, report_count, is_hidden, is_deleted,
  // and the parent's workspace_id, all of which must be reset for a new fork.
  const { data: forkedPrompt, error } = await supabase
    .from('prompts')
    .insert({
      workspace_id: workspace.id,
      problem_id: parentPrompt.problem_id,
      title: forkTitle,
      slug,
      system_prompt: parentPrompt.system_prompt,
      user_prompt_template: parentPrompt.user_prompt_template,
      model: parentPrompt.model,
      params: parentPrompt.params,
      example_input: parentPrompt.example_input,
      example_output: parentPrompt.example_output,
      known_failures: parentPrompt.known_failures,
      notes: `Forked from prompt ${parentPromptId}.`,
      parent_prompt_id: parentPromptId,
      visibility: parentPrompt.visibility,
      status: 'draft',    // always start as draft
      is_listed: true,
      is_hidden: false,      // reset from parent
      is_reported: false,      // reset from parent
      report_count: 0,          // reset from parent
      is_deleted: false,      // reset from parent
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to fork prompt:', error)
    throw new Error('Failed to fork prompt due to an unexpected error. Please try again.')
  }

  // Record the fork event on the parent
  await supabase.from('prompt_events').insert({
    prompt_id: parentPromptId,
    user_id: user.id,
    event_type: 'fork',
  })

  // Update fork count on parent (fire-and-forget — stats trigger handles the rest)
  await supabase.rpc('increment_fork_count', { prompt_id: parentPromptId })

  revalidatePath('/problems')
  revalidatePath(`/prompts/${parentPromptId}`)
  return forkedPrompt
}

export async function forkPromptWithModal(parentPromptId: string, newTitle: string, notes: string) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Must be authenticated to fork prompts')
  }

  // Get the parent prompt — only fork non-deleted, non-hidden prompts
  // (unless the user is a workspace member of the parent — handled below)
  const { data: parentPrompt, error: fetchError } = await supabase
    .from('prompts')
    .select('*')
    .eq('id', parentPromptId)
    .eq('is_deleted', false)
    .single()

  if (fetchError || !parentPrompt) {
    throw new Error('Parent prompt not found or is no longer available')
  }

  // Check if prompt is hidden/unlisted and user has workspace access
  if (parentPrompt.is_hidden || !parentPrompt.is_listed) {
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

  // Get (or create) the forker's workspace
  let { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!workspace) {
    const { data: newWorkspace, error: wsError } = await supabase
      .from('workspaces')
      .insert({
        name: user.email ? `${user.email}'s Workspace` : 'My Workspace',
        slug: `user-${user.id.replace(/-/g, '')}`,
        owner_id: user.id,
      })
      .select('id')
      .single()

    if (wsError || !newWorkspace) {
      throw new Error('Could not create workspace to place fork in')
    }

    await supabase.from('workspace_members').insert({
      workspace_id: newWorkspace.id,
      user_id: user.id,
      role: 'owner',
    })
    workspace = newWorkspace
  }

  // Prepare notes with attribution
  const attributedNotes = `Forked from ${parentPromptId}. ${notes}`

  // Generate slug from new title
  const cleanNewTitle = newTitle
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .substring(0, 50)

  const slug = (cleanNewTitle || 'prompt') + '-' + Math.random().toString(36).substring(2, 8)

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
    console.error('Failed to fork prompt with modal:', error)
    throw new Error('Failed to fork prompt due to an unexpected error. Please try again.')
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
      throw new Error('Failed to update prompt due to an unexpected error. Please try again.')
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

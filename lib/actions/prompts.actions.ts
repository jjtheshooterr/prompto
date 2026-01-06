'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function listPromptsByProblem(problemId: string, sort: 'newest' | 'top' = 'top') {
  const supabase = await createClient()
  
  let query = supabase
    .from('prompts')
    .select(`
      *,
      prompt_stats (
        upvotes,
        downvotes,
        score,
        copy_count,
        view_count,
        fork_count
      )
    `)
    .eq('problem_id', problemId)
    .eq('is_listed', true)
    .eq('is_hidden', false)
    .eq('visibility', 'public')

  if (sort === 'newest') {
    query = query.order('created_at', { ascending: false })
  } else {
    // Order by score from prompt_stats, with fallback to created_at
    query = query.order('prompt_stats.score', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching prompts:', error)
    return []
  }

  return data || []
}

export async function getPromptById(id: string) {
  const supabase = await createClient()
  
  // First get the prompt
  const { data: prompt, error: promptError } = await supabase
    .from('prompts')
    .select(`
      *,
      problems (title, slug),
      prompt_stats (
        upvotes,
        downvotes,
        score,
        copy_count,
        view_count,
        fork_count
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
        upvotes,
        downvotes,
        score,
        copy_count,
        view_count,
        fork_count
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

    const { data, error } = await supabase
      .from('prompts')
      .insert({
        problem_id: problemId,
        title,
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

    // Create initial prompt_stats row
    await supabase
      .from('prompt_stats')
      .insert({
        prompt_id: data.id,
        upvotes: 0,
        downvotes: 0,
        score: 0
      })

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

  // Create forked prompt
  const { data: forkedPrompt, error } = await supabase
    .from('prompts')
    .insert({
      ...parentPrompt,
      id: undefined, // Let DB generate new ID
      parent_prompt_id: parentPromptId,
      created_by: user.id,
      title: `${parentPrompt.title} (Fork)`,
      created_at: undefined,
      updated_at: undefined
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to fork prompt: ${error.message}`)
  }

  // Create prompt_stats for forked prompt
  await supabase
    .from('prompt_stats')
    .insert({
      prompt_id: forkedPrompt.id,
      upvotes: 0,
      downvotes: 0,
      score: 0
    })

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

  // Create forked prompt
  const { data: forkedPrompt, error } = await supabase
    .from('prompts')
    .insert({
      workspace_id: workspace.id,
      problem_id: parentPrompt.problem_id,
      visibility: parentPrompt.visibility,
      title: newTitle,
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

  // Create prompt_stats for forked prompt
  await supabase
    .from('prompt_stats')
    .insert({
      prompt_id: forkedPrompt.id,
      upvotes: 0,
      downvotes: 0,
      score: 0,
      copy_count: 0,
      view_count: 0,
      fork_count: 0
    })

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
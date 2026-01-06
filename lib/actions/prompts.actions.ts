'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function listPromptsByProblem(problemId: string, sort: 'newest' | 'top' = 'top') {
  const supabase = await createClient()
  
  let query = supabase
    .from('prompts')
    .select('*')
    .eq('problem_id', problemId)
    .eq('visibility', 'public')
    .eq('is_listed', true)
    .eq('is_hidden', false)

  if (sort === 'newest') {
    query = query.order('created_at', { ascending: false })
  } else {
    // For now, just order by created_at, we'll add proper scoring later
    query = query.order('created_at', { ascending: false })
  }

  const { data: prompts, error } = await query

  if (error) {
    console.error('Error fetching prompts:', error)
    return []
  }

  if (!prompts) return []

  // Get stats for each prompt separately
  const promptsWithStats = await Promise.all(
    prompts.map(async (prompt) => {
      const { data: stats } = await supabase
        .from('prompt_stats')
        .select('*')
        .eq('prompt_id', prompt.id)
        .single()

      return {
        ...prompt,
        prompt_stats: stats ? [stats] : []
      }
    })
  )

  return promptsWithStats
}

export async function getPromptById(id: string) {
  const supabase = await createClient()
  
  // First get the prompt
  const { data: prompt, error: promptError } = await supabase
    .from('prompts')
    .select('*')
    .eq('id', id)
    .single()

  if (promptError || !prompt) {
    console.error('Error fetching prompt:', promptError)
    return null
  }

  // Get the problem info separately
  const { data: problem } = await supabase
    .from('problems')
    .select('title, slug')
    .eq('id', prompt.problem_id)
    .single()

  // Get the stats separately
  const { data: stats } = await supabase
    .from('prompt_stats')
    .select('*')
    .eq('prompt_id', id)
    .single()

  return {
    ...prompt,
    problem: problem || null,
    prompt_stats: stats ? [stats] : []
  }
}

export async function getPromptsByIds(ids: string[]) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('prompts')
    .select(`
      *,
      problem:problems(title, slug),
      prompt_stats(upvotes, downvotes, score, copy_count, view_count, fork_count)
    `)
    .in('id', ids)

  if (error) {
    console.error('Error fetching prompts for comparison:', error)
    return []
  }

  return data || []
}

export async function createPrompt(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Authentication required')
  }

  // Get user's workspace
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!workspace) {
    throw new Error('No workspace found')
  }

  const problemId = formData.get('problemId') as string
  const title = formData.get('title') as string
  const systemPrompt = formData.get('systemPrompt') as string
  const userPromptTemplate = formData.get('userPromptTemplate') as string
  const model = formData.get('model') as string
  const visibility = formData.get('visibility') as string
  const parentPromptId = formData.get('parentPromptId') as string || null

  // Parse JSON fields
  const params = formData.get('params') as string
  const exampleInput = formData.get('exampleInput') as string
  const exampleOutput = formData.get('exampleOutput') as string

  const { data, error } = await supabase
    .from('prompts')
    .insert({
      workspace_id: workspace.id,
      problem_id: problemId,
      title,
      system_prompt: systemPrompt,
      user_prompt_template: userPromptTemplate,
      model,
      params: params ? JSON.parse(params) : {},
      example_input: exampleInput ? JSON.parse(exampleInput) : null,
      example_output: exampleOutput ? JSON.parse(exampleOutput) : null,
      visibility,
      parent_prompt_id: parentPromptId,
      created_by: user.id
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating prompt:', error)
    throw new Error('Failed to create prompt')
  }

  // Initialize prompt stats
  await supabase
    .from('prompt_stats')
    .insert({
      prompt_id: data.id,
      upvotes: 0,
      downvotes: 0,
      score: 0
    })

  revalidatePath('/problems')
  revalidatePath('/dashboard')
  
  return data
}

export async function forkPrompt(parentPromptId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Authentication required')
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

  // Get user's workspace
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!workspace) {
    throw new Error('No workspace found')
  }

  // Create forked prompt
  const { data, error } = await supabase
    .from('prompts')
    .insert({
      workspace_id: workspace.id,
      problem_id: parentPrompt.problem_id,
      title: `${parentPrompt.title} (Fork)`,
      system_prompt: parentPrompt.system_prompt,
      user_prompt_template: parentPrompt.user_prompt_template,
      model: parentPrompt.model,
      params: parentPrompt.params,
      example_input: parentPrompt.example_input,
      example_output: parentPrompt.example_output,
      parent_prompt_id: parentPromptId,
      created_by: user.id
    })
    .select()
    .single()

  if (error) {
    console.error('Error forking prompt:', error)
    throw new Error('Failed to fork prompt')
  }

  // Initialize prompt stats
  await supabase
    .from('prompt_stats')
    .insert({
      prompt_id: data.id,
      upvotes: 0,
      downvotes: 0,
      score: 0
    })

  // Update fork count on parent
  await supabase.rpc('increment_fork_count', { prompt_id: parentPromptId })

  revalidatePath('/problems')
  
  return data
}
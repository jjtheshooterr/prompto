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
    query = query.order('score', { ascending: false, nullsFirst: false })
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
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
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

  // Get problem to get workspace_id
  const { data: problem } = await supabase
    .from('problems')
    .select('workspace_id')
    .eq('id', problemId)
    .single()

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
      workspace_id: problem?.workspace_id
    })
    .select()
    .single()

  if (error) {
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
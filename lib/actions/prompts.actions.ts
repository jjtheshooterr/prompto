'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { sendForkNotification } from '@/lib/email/fork-notification'
import { promptUrl } from '@/lib/utils/prompt-url'
import { sanitizeSlug } from '@/lib/utils/slug'

const CreatePromptSchema = z.object({
  problem_id: z.string().uuid('Invalid problem ID'),
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long').trim(),
  system_prompt: z.string().max(10000, 'System prompt is too long').trim().optional(),
  user_prompt_template: z.string().max(10000, 'User prompt template is too long').trim().optional(),
  model: z.string().min(1, 'Model is required').max(50),
  params: z.string().optional(),
  example_input: z.string().max(5000).trim().optional(),
  example_output: z.string().max(5000).trim().optional(),
  status: z.enum(['draft', 'published', 'archived', 'flagged']).default('published'),
  tradeoffs: z.string().max(5000).trim().optional(),
  usage_context: z.string().max(5000).trim().optional(),
  improvement_summary: z.string().max(1000).trim().optional(),
  fix_summary: z.string().max(1000).trim().optional(),
})

export type PromptSort = 'newest' | 'top' | 'best' | 'most_improved'

export async function listPromptsByProblem(problemId: string, sort: PromptSort = 'newest') {
  const supabase = await createClient()

  const { data: prompts, error } = await supabase
    .from('prompts')
    .select(`
      *,
      prompt_stats (
        upvotes, downvotes, score, quality_score, structure_score, ai_quality_score, copy_count, view_count, fork_count,
        works_count, fails_count, reviews_count
      )
    `)
    .eq('problem_id', problemId)
    .eq('is_listed', true)
    .eq('is_hidden', false)
    .eq('is_deleted', false)

  if (error) {
    console.error('Error fetching prompts:', error)
    return []
  }

  if (!prompts || prompts.length === 0) return []

  // Fetch authors mapping — include shadowban status for filtering
  const authorIds = Array.from(new Set(prompts.map(p => p.created_by).filter(Boolean)));
  const { data: authorsData } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, is_shadowbanned')
    .in('id', authorIds);

  // Build set of shadowbanned user IDs to exclude
  const shadowbannedIds = new Set(
    (authorsData || []).filter((a: any) => a.is_shadowbanned === true).map((a: any) => a.id)
  );

  const authorMap = (authorsData || []).reduce((acc: any, author: any) => {
    acc[author.id] = author;
    return acc;
  }, {});

  const defaultStats = {
    upvotes: 0, downvotes: 0, score: 0, quality_score: 0, structure_score: 0, ai_quality_score: 0,
    copy_count: 0, view_count: 0, fork_count: 0,
    works_count: 0, fails_count: 0, reviews_count: 0,
  }

  // Filter out prompts from shadowbanned/banned users
  const visiblePrompts = prompts.filter((p: any) => !shadowbannedIds.has(p.created_by));

  let promptsWithStats = visiblePrompts.map((prompt: any) => {
    const statsData = prompt.prompt_stats ? (Array.isArray(prompt.prompt_stats) ? prompt.prompt_stats[0] : prompt.prompt_stats) : null;
    const authorData = prompt.created_by ? authorMap[prompt.created_by] : null;

    return {
      ...prompt,
      author: authorData,
      prompt_stats: [statsData ? { ...defaultStats, ...statsData } : defaultStats],
    }
  })

  // Sort completely in JS since we fetched everything and avoiding prompt_rankings view
  promptsWithStats = promptsWithStats.sort((a: any, b: any) => {
    const aStats = a.prompt_stats[0]
    const bStats = b.prompt_stats[0]

    if (sort === 'best') {
      const aRankScore = (aStats.upvotes - aStats.downvotes) + (2 * aStats.works_count) - (2 * aStats.fails_count) + aStats.reviews_count;
      const bRankScore = (bStats.upvotes - bStats.downvotes) + (2 * bStats.works_count) - (2 * bStats.fails_count) + bStats.reviews_count;
      return bRankScore !== aRankScore ? bRankScore - aRankScore : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    } else if (sort === 'most_improved') {
      const aImprovement = aStats.fork_count
      const bImprovement = bStats.fork_count
      return bImprovement !== aImprovement ? bImprovement - aImprovement : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    } else if (sort === 'top') {
      const aUp = aStats.upvotes
      const bUp = bStats.upvotes
      return bUp !== aUp ? bUp - aUp : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    } else {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

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
        upvotes, downvotes, score, quality_score, structure_score, ai_quality_score, copy_count, view_count, fork_count,
        works_count, fails_count, reviews_count
      )
    `)
    .eq('id', id)
    .single()

  if (promptError) {
    console.error('Error fetching prompt:', promptError)
    return null
  }

  if (prompt && prompt.created_by) {
    const { data: authorProfile } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .eq('id', prompt.created_by)
      .single()

    if (authorProfile) {
      prompt.author = authorProfile;
    }
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
        upvotes, downvotes, score, quality_score, structure_score, ai_quality_score, copy_count, view_count, fork_count,
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
      status: formData.get('status') || 'published',
      tradeoffs: formData.get('tradeoffs'),
      usage_context: formData.get('usage_context'),
      improvement_summary: formData.get('improvement_summary') || 'Initial version',
      fix_summary: formData.get('fix_summary'),
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
      status,
      tradeoffs,
      usage_context,
      improvement_summary,
      fix_summary
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

    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const slug = sanitizeSlug(title, 50, randomSuffix) + '-' + randomSuffix

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
        workspace_id: workspace.id,
        tradeoffs,
        usage_context,
        improvement_summary,
        fix_summary
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

  // Generate slug for forked prompt (retry on collision — UNIQUE(problem_id, slug))
  const forkTitle = `${parentPrompt.title} (Fork)`
  let forkedPrompt: any = null
  let forkInsertError: any = null
  for (let attempt = 0; attempt < 3; attempt++) {
    const forkRandomSuffix = Math.random().toString(36).substring(2, 8)
    const slug = sanitizeSlug(forkTitle, 50, forkRandomSuffix) + '-' + forkRandomSuffix

    const { data: inserted, error: err } = await supabase
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
        status: 'draft',
        is_listed: true,
        is_hidden: false,
        is_reported: false,
        report_count: 0,
        is_deleted: false,
        created_by: user.id,
        improvement_summary: 'Development fork initially',
        fix_summary: 'Fork setup initial state',
        tradeoffs: parentPrompt.tradeoffs || null,
        usage_context: parentPrompt.usage_context || null
      })
      .select()
      .single()

    if (!err) { forkedPrompt = inserted; break }
    if (err.code !== '23505') { forkInsertError = err; break }
  }

  if (forkInsertError) {
    console.error('Failed to fork prompt:', forkInsertError)
    throw new Error('Failed to fork prompt due to an unexpected error. Please try again.')
  }
  if (!forkedPrompt) {
    throw new Error('Failed to generate a unique slug for fork. Please try again.')
  }

  // Record the fork event on the parent
  await supabase.from('prompt_events').insert({
    prompt_id: parentPromptId,
    user_id: user.id,
    event_type: 'fork',
  })

  // Update fork count on parent (fire-and-forget — stats trigger handles the rest)
  await supabase.rpc('increment_fork_count', { prompt_id: parentPromptId })

  // Send fork notification email to parent prompt author (async, don't block fork)
  try {
    // Get parent prompt author details
    const { data: authorProfile } = await supabase
      .from('profiles')
      .select('username, email')
      .eq('id', parentPrompt.created_by)
      .single()

    // Get forker details
    const { data: forkerProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()

    if (authorProfile?.email && forkerProfile?.username) {
      const forkedPromptLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://promptvexity.com'}${promptUrl({ id: forkedPrompt.id, slug: forkedPrompt.slug })}`

      await sendForkNotification({
        authorEmail: authorProfile.email,
        authorName: authorProfile.username,
        forkerName: forkerProfile.username,
        promptTitle: parentPrompt.title,
        forkedPromptLink,
      })
    }
  } catch (emailError) {
    // Log error but don't block fork completion
    console.error('Failed to send fork notification email:', emailError)
  }

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

  // Check if prompt is hidden and user has workspace access
  if (parentPrompt.is_hidden || !parentPrompt.is_listed) {
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', parentPrompt.workspace_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      throw new Error('Cannot fork hidden prompts')
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
  const forkModalSuffix = Math.random().toString(36).substring(2, 8)
  const slug = sanitizeSlug(newTitle, 50, forkModalSuffix) + '-' + forkModalSuffix

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
      created_by: user.id,
      improvement_summary: notes || 'Fork via modal',
      fix_summary: notes || 'Fork setup',
      tradeoffs: parentPrompt.tradeoffs || null,
      usage_context: parentPrompt.usage_context || null
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

  // Send fork notification email to parent prompt author (async, don't block fork)
  try {
    // Get parent prompt author details
    const { data: authorProfile } = await supabase
      .from('profiles')
      .select('username, email')
      .eq('id', parentPrompt.created_by)
      .single()

    // Get forker details
    const { data: forkerProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()

    if (authorProfile?.email && forkerProfile?.username) {
      const forkedPromptLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://promptvexity.com'}${promptUrl({ id: forkedPrompt.id, slug: forkedPrompt.slug })}`

      await sendForkNotification({
        authorEmail: authorProfile.email,
        authorName: authorProfile.username,
        forkerName: forkerProfile.username,
        promptTitle: parentPrompt.title,
        forkedPromptLink,
      })
    }
  } catch (emailError) {
    // Log error but don't block fork completion
    console.error('Failed to send fork notification email:', emailError)
  }

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
      notes
    `)
    .eq('parent_prompt_id', promptId)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error fetching prompt forks:', error)
    return []
  }

  if (!data || data.length === 0) return [];

  // Fetch author mapping
  const authorIds = Array.from(new Set(data.map((p: any) => p.created_by).filter(Boolean)));
  const { data: authorsData } = await supabase
    .from('profiles')
    .select('id, username')
    .in('id', authorIds);

  const authorMap = (authorsData || []).reduce((acc: any, author: any) => {
    acc[author.id] = { username: author.username };
    return acc;
  }, {});

  // Transform the data to match our interface
  return data.map((fork: any) => ({
    ...fork,
    profiles: fork.created_by ? authorMap[fork.created_by] : null
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

    // New Solution Fields
    const tradeoffs = formData.get('tradeoffs') as string
    const usage_context = formData.get('usage_context') as string
    const improvement_summary = formData.get('improvement_summary') as string
    const fix_summary = formData.get('fix_summary') as string

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
        tradeoffs,
        usage_context,
        improvement_summary: improvement_summary || undefined, // Don't wipe if empty
        fix_summary: fix_summary || undefined,
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
        upvotes, downvotes, score, quality_score, structure_score, ai_quality_score, copy_count, view_count, fork_count,
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

  if (!data || data.length === 0) return [];

  // Fetch author mapping — include shadowban status for filtering
  const authorIds = Array.from(new Set(data.map((p: any) => p.created_by).filter(Boolean)));
  const { data: authorsData } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, is_shadowbanned')
    .in('id', authorIds);

  // Build set of shadowbanned user IDs to exclude from search results
  const shadowbannedIds = new Set(
    (authorsData || []).filter((a: any) => a.is_shadowbanned === true).map((a: any) => a.id)
  );

  const authorMap = (authorsData || []).reduce((acc: any, author: any) => {
    acc[author.id] = author;
    return acc;
  }, {});

  // Filter out prompts from shadowbanned/banned users
  return data
    .filter((prompt: any) => !shadowbannedIds.has(prompt.created_by))
    .map((prompt: any) => ({
      ...prompt,
      author: prompt.created_by ? authorMap[prompt.created_by] : null
    }));
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

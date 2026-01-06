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
    .select(`
      *,
      prompts!inner(count)
    `)
    .eq('is_listed', true)
    .eq('is_hidden', false)
    .eq('visibility', 'public')

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

  const { data, error } = await query

  if (error) {
    console.error('Error fetching problems:', error)
    return []
  }

  return data || []
}

export async function getPublicProblemBySlug(slug: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('problems')
    .select('*')
    .eq('slug', slug)
    .eq('is_listed', true)
    .eq('is_hidden', false)
    .eq('visibility', 'public')
    .single()

  if (error) {
    console.error('Error fetching problem:', error)
    return null
  }

  return data
}

export async function createProblem(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
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
    .eq('created_by', user.id)
    .single()

  if (!workspace) {
    const { data: newWorkspace } = await supabase
      .from('workspaces')
      .insert({
        name: `${user.email}'s Workspace`,
        created_by: user.id
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
      workspace_id: workspace?.id
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create problem: ${error.message}`)
  }

  revalidatePath('/problems')
  return data
}
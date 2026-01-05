'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function listPublicProblems(filters?: {
  search?: string
  industry?: string
  tags?: string[]
  sort?: 'newest' | 'top'
}) {
  const supabase = await createClient()
  
  let query = supabase
    .from('problems')
    .select(`
      *,
      prompts(count)
    `)
    .eq('visibility', 'public')
    .eq('is_listed', true)
    .eq('is_hidden', false)

  // Apply filters
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
  }
  
  if (filters?.industry) {
    query = query.eq('industry', filters.industry)
  }
  
  if (filters?.tags && filters.tags.length > 0) {
    query = query.overlaps('tags', filters.tags)
  }

  // Apply sorting
  if (filters?.sort === 'newest') {
    query = query.order('created_at', { ascending: false })
  } else {
    // Default to newest for now, later implement "top" based on prompt scores
    query = query.order('created_at', { ascending: false })
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
    .eq('visibility', 'public')
    .eq('is_listed', true)
    .eq('is_hidden', false)
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

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const industry = formData.get('industry') as string
  const tags = formData.get('tags') as string
  const visibility = formData.get('visibility') as string

  // Generate slug from title
  const slug = title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  const { data, error } = await supabase
    .from('problems')
    .insert({
      workspace_id: workspace.id,
      title,
      description,
      industry: industry || null,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      slug,
      visibility,
      created_by: user.id
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating problem:', error)
    throw new Error('Failed to create problem')
  }

  revalidatePath('/problems')
  revalidatePath('/dashboard')
  
  return data
}
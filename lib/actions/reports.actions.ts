'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createReport({
  contentType,
  contentId,
  reason,
  details
}: {
  contentType: 'prompt' | 'problem'
  contentId: string
  reason: string
  details?: string
}) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('Must be authenticated to report content')
  }

  const { data, error } = await supabase
    .from('reports')
    .insert({
      content_type: contentType,
      content_id: contentId,
      reason,
      details: details || null,
      reporter_id: user.id
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create report: ${error.message}`)
  }

  // Note: Report count will be calculated dynamically from reports table

  revalidatePath('/admin/reports')
  return data
}

export async function updateReportStatus({
  reportId,
  status,
  shouldDeleteContent = false
}: {
  reportId: string
  status: 'dismissed' | 'resolved'
  shouldDeleteContent?: boolean
}) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('Must be authenticated to update reports')
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw new Error('Must be admin to update reports')
  }

  // Get report details
  const { data: report } = await supabase
    .from('reports')
    .select('content_type, content_id')
    .eq('id', reportId)
    .single()

  if (!report) {
    throw new Error('Report not found')
  }

  // Update report status
  const { error: reportError } = await supabase
    .from('reports')
    .update({
      status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', reportId)

  if (reportError) {
    throw new Error(`Failed to update report: ${reportError.message}`)
  }

  // Soft delete content if requested
  if (shouldDeleteContent && status === 'resolved') {
    const table = report.content_type === 'prompt' ? 'prompts' : 'problems'
    
    const { error: deleteError } = await supabase
      .from(table)
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: user.id
      })
      .eq('id', report.content_id)

    if (deleteError) {
      throw new Error(`Failed to delete content: ${deleteError.message}`)
    }

    // Revalidate relevant paths
    if (report.content_type === 'prompt') {
      revalidatePath('/prompts')
      revalidatePath(`/prompts/${report.content_id}`)
    } else {
      revalidatePath('/problems')
    }
  }

  revalidatePath('/admin/reports')
  return { success: true }
}

export async function getReports(filter: 'all' | 'pending' | 'reviewed' = 'pending') {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('Must be authenticated to view reports')
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw new Error('Must be admin to view reports')
  }

  let query = supabase
    .from('reports')
    .select(`
      *,
      reporter:profiles!reporter_id(username),
      reviewer:profiles!reviewed_by(username)
    `)
    .order('created_at', { ascending: false })

  if (filter !== 'all') {
    query = query.eq('status', filter)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch reports: ${error.message}`)
  }

  return data || []
}
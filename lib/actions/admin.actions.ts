'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// Helper to get service role client for Auth Admin API access
function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Helper to verify caller is admin
async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) throw new Error('Must be authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw new Error('Must be admin to perform this action')
  }

  return { user, supabase }
}

export async function getUsers() {
  const { supabase } = await verifyAdmin()

  // Fetch profiles with a simple report count estimation
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      username,
      display_name,
      avatar_url,
      role,
      is_shadowbanned,
      shadowban_reason,
      system_trust_score,
      created_at
    `)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch users: ${error.message}`)
  }

  // Also fetch active bans to merge status
  const { data: bans } = await supabase
    .from('user_bans')
    .select('user_id, reason')

  const bannedIds = new Set(bans?.map(b => b.user_id))

  const enrichedUsers = data.map(u => ({
    ...u,
    is_banned: bannedIds.has(u.id)
  }))

  return enrichedUsers || []
}

export async function toggleShadowban(userId: string, isShadowbanned: boolean, reason?: string) {
  const { user: adminUser, supabase } = await verifyAdmin()
  const adminClient = getAdminClient()

  const updatePayload: Record<string, unknown> = { is_shadowbanned: isShadowbanned }
  if (isShadowbanned && reason) {
    updatePayload.shadowban_reason = reason
  } else if (!isShadowbanned) {
    updatePayload.shadowban_reason = null // Clear reason on unshadowban
  }

  const { error } = await adminClient
    .from('profiles')
    .update(updatePayload)
    .eq('id', userId)

  if (error) {
    throw new Error(`Failed to update shadowban: ${error.message}`)
  }

  // Immutable audit log
  await supabase.from('admin_audit_logs').insert({
    admin_id: adminUser.id,
    target_user_id: userId,
    target_content_type: 'profile',
    target_content_id: userId,
    action: isShadowbanned ? 'shadowban' : 'unshadowban',
    details: reason ? { reason } : {}
  })

  revalidatePath('/admin/users')
  return { success: true }
}

export async function updateTrustScore(userId: string, newScore: number) {
  const { user: adminUser, supabase } = await verifyAdmin()
  const adminClient = getAdminClient()

  const { error } = await adminClient
    .from('profiles')
    .update({ system_trust_score: newScore })
    .eq('id', userId)

  if (error) {
    throw new Error(`Failed to update trust score: ${error.message}`)
  }

  // Immutable audit log
  await supabase.from('admin_audit_logs').insert({
    admin_id: adminUser.id,
    target_user_id: userId,
    target_content_type: 'profile',
    target_content_id: userId,
    action: 'trust_score_update',
    details: { new_score: newScore }
  })

  revalidatePath('/admin/users')
  return { success: true }
}

export async function banUser(userId: string, reason: string) {
  const { user: adminUser, supabase } = await verifyAdmin()
  const adminClient = getAdminClient()

  // 1. Snapshot the user's current shadowban state BEFORE banning
  const { data: profile } = await adminClient
    .from('profiles')
    .select('is_shadowbanned, shadowban_reason')
    .eq('id', userId)
    .single()

  const preBanShadowbanned = profile?.is_shadowbanned ?? false
  const preBanShadowbanReason = profile?.shadowban_reason ?? null

  // 2. Hard ban via Supabase Auth API (prevents logins and revokes sessions)
  const { error: authError } = await adminClient.auth.admin.updateUserById(userId, {
    ban_duration: '87600h' // 10 years
  })

  if (authError) {
    throw new Error(`Failed to ban auth user: ${authError.message}`)
  }

  // 3. Force-shadowban the user so all their content vanishes from public feeds
  const { error: shadowErr } = await adminClient
    .from('profiles')
    .update({ is_shadowbanned: true, shadowban_reason: `Account banned: ${reason}` })
    .eq('id', userId)

  if (shadowErr) {
    // Non-fatal: auth ban succeeded, content hiding failed — log but don't rollback
    console.error(`[banUser] Failed to shadowban content for ${userId}:`, shadowErr.message)
  }

  // 4. Log ban in our database, storing the pre-ban snapshot for safe restoration
  const { error: dbError } = await supabase
    .from('user_bans')
    .insert({
      user_id: userId,
      reason,
      banned_by_admin_id: adminUser.id,
      pre_ban_shadowbanned: preBanShadowbanned,
      pre_ban_shadowban_reason: preBanShadowbanReason
    })

  if (dbError) {
    // Attempt full rollback
    await adminClient.auth.admin.updateUserById(userId, { ban_duration: 'none' })
    await adminClient.from('profiles').update({
      is_shadowbanned: preBanShadowbanned,
      shadowban_reason: preBanShadowbanReason
    }).eq('id', userId)
    throw new Error(`Failed to insert ban record: ${dbError.message}`)
  }

  // Immutable audit log
  await supabase.from('admin_audit_logs').insert({
    admin_id: adminUser.id,
    target_user_id: userId,
    target_content_type: 'profile',
    target_content_id: userId,
    action: 'ban',
    details: { reason, content_hidden: true }
  })

  revalidatePath('/admin/users')
  return { success: true }
}

export async function toggleFeatured(contentType: 'prompt' | 'problem', contentId: string, isFeatured: boolean) {
  const { user: adminUser, supabase } = await verifyAdmin()
  const adminClient = getAdminClient()

  const table = contentType === 'prompt' ? 'prompts' : 'problems'

  const { error } = await adminClient
    .from(table)
    .update({ is_featured: isFeatured })
    .eq('id', contentId)

  if (error) {
    throw new Error(`Failed to update featured status: ${error.message}`)
  }

  // Immutable audit log
  await supabase.from('admin_audit_logs').insert({
    admin_id: adminUser.id,
    target_content_type: contentType,
    target_content_id: contentId,
    action: isFeatured ? 'feature_content' : 'unfeature_content'
  })

  // Revalidate the public facing paths that rely on algorithms
  revalidatePath('/')
  if (contentType === 'problem') {
    revalidatePath('/problems')
    revalidatePath('/problems/[slug]', 'page')
  } else {
    // Revalidation is harder for prompt slugs, simply rely on time-based or revalidate whole route
    revalidatePath('/prompts/[problemId]/[promptSlug]', 'page')
  }

  return { success: true }
}
export async function unbanUser(userId: string) {
  const { user: adminUser, supabase } = await verifyAdmin()
  const adminClient = getAdminClient()

  // 1. Fetch the ban record to retrieve the pre-ban shadowban snapshot
  const { data: banRecord } = await adminClient
    .from('user_bans')
    .select('pre_ban_shadowbanned, pre_ban_shadowban_reason')
    .eq('user_id', userId)
    .single()

  // 2. Restore the user's original shadowban state faithfully
  //    If they were shadowbanned BEFORE the ban, keep them shadowbanned.
  //    If they were NOT shadowbanned before the ban, clear it.
  const restoreShadowbanned = banRecord?.pre_ban_shadowbanned ?? false
  const restoreShadowbanReason = banRecord?.pre_ban_shadowban_reason ?? null

  await adminClient
    .from('profiles')
    .update({
      is_shadowbanned: restoreShadowbanned,
      shadowban_reason: restoreShadowbanReason
    })
    .eq('id', userId)

  // 3. Remove ban from Supabase Auth API
  const { error: authError } = await adminClient.auth.admin.updateUserById(userId, {
    ban_duration: 'none'
  })

  if (authError) {
    throw new Error(`Failed to unban auth user: ${authError.message}`)
  }

  // 4. Remove ban record from our database
  const { error: dbError } = await adminClient
    .from('user_bans')
    .delete()
    .eq('user_id', userId)

  if (dbError) {
    throw new Error(`Failed to delete ban record: ${dbError.message}`)
  }

  // Immutable audit log
  await supabase.from('admin_audit_logs').insert({
    admin_id: adminUser.id,
    target_user_id: userId,
    target_content_type: 'profile',
    target_content_id: userId,
    action: 'unban',
    details: { shadowban_restored: restoreShadowbanned }
  })

  revalidatePath('/admin/users')
  return { success: true }
}

export async function getPlatformSettings() {
  const { supabase } = await verifyAdmin()
  const { data, error } = await supabase.from('platform_settings').select('*').eq('id', 1).single()
  if (error) throw new Error(`Failed to load settings: ${error.message}`)
  return data
}

export async function toggleEmergencyLockdown(isEmergencyLockdown: boolean) {
  const { user: adminUser, supabase } = await verifyAdmin()
  const adminClient = getAdminClient()

  const { error } = await adminClient
    .from('platform_settings')
    .update({ is_emergency_lockdown: isEmergencyLockdown })
    .eq('id', 1)

  if (error) throw new Error(`Failed to toggle lockdown: ${error.message}`)

  // Immutable audit log — platform-level event, no target_user_id
  await supabase.from('admin_audit_logs').insert({
    admin_id: adminUser.id,
    target_content_type: 'platform',
    target_content_id: 'global',
    action: isEmergencyLockdown ? 'enable_emergency_lockdown' : 'disable_emergency_lockdown',
    details: { timestamp: new Date().toISOString() }
  })

  revalidatePath('/admin/dashboard')
  return { success: true }
}

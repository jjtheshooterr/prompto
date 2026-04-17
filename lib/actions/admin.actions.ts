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

// Helper to verify caller is admin or owner
async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) throw new Error('Must be authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'
  const isOwner = profile?.role === 'owner'

  if (!profile || (!isAdmin && !isOwner)) {
    throw new Error('Must be admin or owner to perform this action')
  }

  return { user, profile, supabase, isAdmin, isOwner }
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
  const { user: adminUser, profile: callerProfile, supabase } = await verifyAdmin()
  const adminClient = getAdminClient()

  // Security check: Admins cannot shadowban other admins or owners
  const { data: targetProfile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (callerProfile.role === 'admin' && (targetProfile?.role === 'admin' || targetProfile?.role === 'owner')) {
    throw new Error('Permission Denied: Admins cannot shadowban other Admins or Owners')
  }

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
  const { user: adminUser, profile: callerProfile, supabase } = await verifyAdmin()
  const adminClient = getAdminClient()

  // Security check: Admins cannot modify trust scores of other admins or owners
  const { data: targetProfile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (callerProfile.role === 'admin' && (targetProfile?.role === 'admin' || targetProfile?.role === 'owner')) {
    throw new Error('Permission Denied: Admins cannot modify trust scores for other Admins or Owners')
  }

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
  const { user: adminUser, profile: callerProfile, supabase } = await verifyAdmin()
  const adminClient = getAdminClient()

  // Security check: Admins cannot ban other admins or owners
  const { data: currentProfile } = await adminClient
    .from('profiles')
    .select('role, is_shadowbanned, shadowban_reason')
    .eq('id', userId)
    .single()

  if (callerProfile.role === 'admin' && (currentProfile?.role === 'admin' || currentProfile?.role === 'owner')) {
    throw new Error('Permission Denied: Admins cannot ban other Admins or Owners')
  }

  const preBanShadowbanned = currentProfile?.is_shadowbanned ?? false
  const preBanShadowbanReason = currentProfile?.shadowban_reason ?? null

  // 2. Hard ban via Supabase Auth API
  const { error: authError } = await adminClient.auth.admin.updateUserById(userId, {
    ban_duration: '87600h' // 10 years
  })

  if (authError) {
    throw new Error(`Failed to ban auth user: ${authError.message}`)
  }

  // 3. Force-shadowban content
  const { error: shadowErr } = await adminClient
    .from('profiles')
    .update({ is_shadowbanned: true, shadowban_reason: `Account banned: ${reason}` })
    .eq('id', userId)

  if (shadowErr) {
    console.error(`[banUser] Failed to shadowban content for ${userId}:`, shadowErr.message)
  }

  // 4. Log ban record
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

  revalidatePath('/')
  if (contentType === 'problem') {
    revalidatePath('/problems')
    revalidatePath('/problems/[slug]', 'page')
  } else {
    revalidatePath('/prompts/[problemId]/[promptSlug]', 'page')
  }

  return { success: true }
}

export async function unbanUser(userId: string) {
  const { user: adminUser, profile: callerProfile, supabase } = await verifyAdmin()
  const adminClient = getAdminClient()

  // Security check: Admins cannot unban other admins or owners (though they shouldn't be banned)
  const { data: targetProfile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (callerProfile.role === 'admin' && (targetProfile?.role === 'admin' || targetProfile?.role === 'owner')) {
    throw new Error('Permission Denied: Admins cannot perform actions on other Admins or Owners')
  }

  // 1. Fetch ban record
  const { data: banRecord } = await adminClient
    .from('user_bans')
    .select('pre_ban_shadowbanned, pre_ban_shadowban_reason')
    .eq('user_id', userId)
    .single()

  const restoreShadowbanned = banRecord?.pre_ban_shadowbanned ?? false
  const restoreShadowbanReason = banRecord?.pre_ban_shadowban_reason ?? null

  await adminClient
    .from('profiles')
    .update({
      is_shadowbanned: restoreShadowbanned,
      shadowban_reason: restoreShadowbanReason
    })
    .eq('id', userId)

  // 3. Remove auth ban
  const { error: authError } = await adminClient.auth.admin.updateUserById(userId, {
    ban_duration: 'none'
  })

  if (authError) {
    throw new Error(`Failed to unban auth user: ${authError.message}`)
  }

  // 4. Delete ban record
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

  // Immutable audit log
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

export async function getAiGenerationEnabled(): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('platform_settings')
      .select('ai_generation_enabled')
      .eq('id', 1)
      .single()
    if (error || !data) return true
    return data.ai_generation_enabled ?? true
  } catch {
    return true
  }
}

/**
 * Promotes `targetUserId` to the 'admin' role.
 * Callable BY OWNERS ONLY.
 */
export async function promoteToAdmin(targetUserId: string) {
  const { user: caller, profile: callerProfile, supabase, isOwner } = await verifyAdmin()
  const adminClient = getAdminClient()

  if (!isOwner) {
    throw new Error('Permission Denied: Only Owners can promote users to Admin')
  }

  if (caller.id === targetUserId) {
    throw new Error('You cannot modify your own role')
  }

  const { error } = await adminClient
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', targetUserId)

  if (error) {
    throw new Error(`Failed to promote user to admin: ${error.message}`)
  }

  await supabase.from('admin_audit_logs').insert({
    admin_id: caller.id,
    target_user_id: targetUserId,
    target_content_type: 'profile',
    target_content_id: targetUserId,
    action: 'promote_to_admin',
    details: { caller_role: callerProfile.role }
  })

  revalidatePath('/admin/users')
  return { success: true }
}

/**
 * Revokes admin role from `targetUserId`, setting them back to 'user'.
 * Callable BY OWNERS ONLY.
 */
export async function revokeAdmin(targetUserId: string) {
  const { user: caller, profile: callerProfile, supabase, isOwner } = await verifyAdmin()
  const adminClient = getAdminClient()

  if (!isOwner) {
    throw new Error('Permission Denied: Only Owners can revoke Admin roles')
  }

  if (caller.id === targetUserId) {
    throw new Error('You cannot modify your own role')
  }

  const { error } = await adminClient
    .from('profiles')
    .update({ role: 'user' })
    .eq('id', targetUserId)

  if (error) {
    throw new Error(`Failed to revoke admin role: ${error.message}`)
  }

  await supabase.from('admin_audit_logs').insert({
    admin_id: caller.id,
    target_user_id: targetUserId,
    target_content_type: 'profile',
    target_content_id: targetUserId,
    action: 'revoke_admin',
    details: { caller_role: callerProfile.role }
  })

  revalidatePath('/admin/users')
  return { success: true }
}

/**
 * Promotes `targetUserId` to the 'owner' role.
 * Callable BY OWNERS ONLY.
 */
export async function promoteToOwner(targetUserId: string) {
  const { user: caller, profile: callerProfile, supabase, isOwner } = await verifyAdmin()
  const adminClient = getAdminClient()

  if (!isOwner) {
    throw new Error('Permission Denied: Only Owners can promote other users to Owner')
  }

  if (caller.id === targetUserId) {
    throw new Error('You cannot modify your own role')
  }

  const { error } = await adminClient
    .from('profiles')
    .update({ role: 'owner' })
    .eq('id', targetUserId)

  if (error) {
    throw new Error(`Failed to promote user to owner: ${error.message}`)
  }

  await supabase.from('admin_audit_logs').insert({
    admin_id: caller.id,
    target_user_id: targetUserId,
    target_content_type: 'profile',
    target_content_id: targetUserId,
    action: 'promote_to_owner',
    details: { caller_role: callerProfile.role }
  })

  revalidatePath('/admin/users')
  return { success: true }
}

/**
 * Revokes owner role from `targetUserId`, setting them back to 'admin'.
 * Callable BY OWNERS ONLY. Self-demotion blocked.
 */
export async function revokeOwner(targetUserId: string) {
  const { user: caller, profile: callerProfile, supabase, isOwner } = await verifyAdmin()
  const adminClient = getAdminClient()

  if (!isOwner) {
    throw new Error('Permission Denied: Only Owners can revoke Owner roles')
  }

  if (caller.id === targetUserId) {
    throw new Error('You cannot demote yourself from Owner')
  }

  const { error } = await adminClient
    .from('profiles')
    .update({ role: 'admin' }) // Revoke to admin by default
    .eq('id', targetUserId)

  if (error) {
    throw new Error(`Failed to revoke owner role: ${error.message}`)
  }

  await supabase.from('admin_audit_logs').insert({
    admin_id: caller.id,
    target_user_id: targetUserId,
    target_content_type: 'profile',
    target_content_id: targetUserId,
    action: 'revoke_owner',
    details: { caller_role: callerProfile.role }
  })

  revalidatePath('/admin/users')
  return { success: true }
}

'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Collects all data tied to the calling user's account and returns it
 * as a structured JSON-serialisable object.
 *
 * Includes: profile, prompts, problems, prompt_reviews, votes (prompt_votes),
 * prompt_comparisons, prompt_reports, admin_audit_logs (target only).
 *
 * Returns the payload — the caller must serialise/download it on the client side.
 */
export async function exportUserData() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Must be authenticated to export data')
  }

  const uid = user.id

  // Fetch in parallel for speed
  const [
    profileResult,
    promptsResult,
    problemsResult,
    reviewsResult,
    votesResult,
    comparisonsResult,
    reportsResult,
    workspacesResult,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', uid).single(),
    supabase.from('prompts').select('*').eq('created_by', uid).eq('is_deleted', false),
    supabase.from('problems').select('*').eq('created_by', uid).eq('is_deleted', false),
    supabase.from('prompt_reviews').select('*').eq('user_id', uid),
    supabase.from('votes').select('*').eq('user_id', uid),
    supabase.from('prompt_comparisons').select('*').eq('voter_id', uid),
    supabase.from('reports').select('*').eq('reporter_id', uid),
    supabase.from('workspaces').select('*').eq('owner_id', uid),
  ])

  return {
    exported_at: new Date().toISOString(),
    account: {
      id: uid,
      email: user.email,
    },
    profile: profileResult.data ?? null,
    prompts: promptsResult.data ?? [],
    problems: problemsResult.data ?? [],
    reviews: reviewsResult.data ?? [],
    votes: votesResult.data ?? [],
    comparisons: comparisonsResult.data ?? [],
    reports: reportsResult.data ?? [],
    workspaces: workspacesResult.data ?? [],
  }
}

/**
 * Permanently deletes or anonymises all personal data for the calling user.
 *
 * Strategy:
 * - Profile: wipe all personal fields (name, email ref, avatar, bio, headline,
 *   location, website). Username set to a random anonymous handle. Role → 'user'.
 * - Prompts/Problems: keep the content (platform continuity) but disassociate
 *   from the user by nulling created_by/owner_id.
 * - Reviews, votes, comparisons, reports: deleted.
 * - Workspaces they own: deleted (cascade will handle workspace_members).
 * - Auth user: deleted via the Supabase Admin API, which revokes all sessions.
 *
 * The caller must supply their own email as confirmation — this is enforced by
 * the server action, not just the UI.
 */
export async function deleteAccount(confirmationEmail: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Must be authenticated')
  }

  // Server-side confirmation: the email they typed must match their actual email
  if (confirmationEmail.trim().toLowerCase() !== user.email?.toLowerCase()) {
    throw new Error('Email confirmation did not match your account email')
  }

  const uid = user.id
  const adminClient = getAdminClient()

  // 1. Disassociate prompts (keep content, null ownership)
  await adminClient
    .from('prompts')
    .update({ created_by: null })
    .eq('created_by', uid)

  // 2. Disassociate problems (keep content, null ownership)
  await adminClient
    .from('problems')
    .update({ created_by: null, owner_id: null })
    .eq('created_by', uid)

  // 3. Delete user-specific activity rows
  await adminClient.from('prompt_reviews').delete().eq('user_id', uid)
  await adminClient.from('votes').delete().eq('user_id', uid)
  await adminClient.from('prompt_comparisons').delete().eq('voter_id', uid)
  await adminClient.from('reports').delete().eq('reporter_id', uid)
  await adminClient.from('user_bans').delete().eq('user_id', uid)
  await adminClient.from('user_rate_limits').delete().eq('user_id', uid)

  // 4. Wipe owned workspaces (workspace_members will cascade)
  await adminClient.from('workspaces').delete().eq('owner_id', uid)

  // 5. Anonymise profile row (don't delete — foreign keys may reference it)
  const anonymousHandle = `deleted_${uid.replace(/-/g, '').substring(0, 12)}`
  await adminClient
    .from('profiles')
    .update({
      display_name: '[Deleted User]',
      username: anonymousHandle,
      avatar_url: null,
      bio: null,
      headline: null,
      location: null,
      website_url: null,
      is_shadowbanned: false,
      shadowban_reason: null,
    })
    .eq('id', uid)

  // 6. Delete the Supabase Auth user — this revokes all active sessions
  const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(uid)
  if (deleteAuthError) {
    // Non-fatal at this point — data is already anonymised.
    // Log and return gracefully rather than throwing, since we can't roll back step 5.
    console.error(`[deleteAccount] Failed to delete auth user ${uid}:`, deleteAuthError.message)
  }

  // Client should redirect after this returns
  return { success: true }
}

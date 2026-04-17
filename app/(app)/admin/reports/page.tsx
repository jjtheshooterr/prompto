import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'

// ─── Server Actions ────────────────────────────────────────────────────────────

async function dismissReport(reportId: string, adminId: string) {
  'use server'
  const supabase = await createClient()
  const { error } = await supabase
    .from('reports')
    .update({ status: 'dismissed', reviewed_by: adminId, reviewed_at: new Date().toISOString() })
    .eq('id', reportId)
  if (error) throw new Error('Failed to dismiss report: ' + error.message)
  revalidatePath('/admin/reports')
}

async function resolveReport(reportId: string, adminId: string, deleteContent: boolean) {
  'use server'
  const supabase = await createClient()

  const { error: reportError } = await supabase
    .from('reports')
    .update({ status: 'resolved', reviewed_by: adminId, reviewed_at: new Date().toISOString() })
    .eq('id', reportId)

  if (reportError) throw new Error('Failed to resolve report: ' + reportError.message)

  if (deleteContent) {
    const { data: report } = await supabase
      .from('reports')
      .select('content_type, content_id')
      .eq('id', reportId)
      .single()

    if (report) {
      const table = report.content_type === 'prompt' ? 'prompts' : 'problems'
      await supabase
        .from(table)
        .update({ is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: adminId })
        .eq('id', report.content_id)
    }
  }

  revalidatePath('/admin/reports')
}

// ─── Page Component (Server) ───────────────────────────────────────────────────

interface Props {
  searchParams: Promise<{ filter?: string }>
}

export default async function AdminReportsPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/admin/reports')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdminOrOwner = profile?.role === 'admin' || profile?.role === 'owner'

  if (!isAdminOrOwner) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-6">
          You must be an admin or owner to access this page.
        </p>
        <Link href="/dashboard" className="text-primary hover:underline">
          Go to Dashboard
        </Link>
      </div>
    )
  }

  const { filter } = await searchParams
  const activeFilter = (filter === 'all' || filter === 'reviewed') ? filter : 'pending'

  // Admin client bypasses RLS — safe because we've already verified admin/owner above
  const adminDb = createAdminClient()

  // ── Step 1: Fetch reports ──────────────────────────────────────────────────
  let reportsQuery = adminDb
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })

  if (activeFilter !== 'all') {
    reportsQuery = reportsQuery.eq('status', activeFilter === 'reviewed' ? 'resolved' : activeFilter)
  }

  const { data: reportsRaw, error: reportsError } = await reportsQuery
  const reports = reportsRaw ?? []

  // ── Step 2: Separate query for accurate tab counts ─────────────────────────
  const { data: allStatuses } = await adminDb
    .from('reports')
    .select('id, status')

  const pendingCount = (allStatuses ?? []).filter(r => r.status === 'pending').length
  const reviewedCount = (allStatuses ?? []).filter(r => r.status !== 'pending').length
  const totalCount = (allStatuses ?? []).length

  // ── Step 3: Batch-resolve reporter / reviewer usernames ────────────────────
  const allUserIds = [
    ...new Set([
      ...reports.map((r: any) => r.reporter_id),
      ...reports.map((r: any) => r.reviewed_by),
    ].filter(Boolean)),
  ]

  const { data: profiles } = allUserIds.length > 0
    ? await adminDb.from('profiles').select('id, username').in('id', allUserIds)
    : { data: [] as { id: string; username: string }[] }

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.username]))

  // ── Step 4: Batch-resolve content slugs for "View Content" links ───────────
  const promptIds = reports.filter((r: any) => r.content_type === 'prompt').map((r: any) => r.content_id)
  const problemIds = reports.filter((r: any) => r.content_type === 'problem').map((r: any) => r.content_id)

  const { data: promptData } = promptIds.length > 0
    ? await adminDb.from('prompts').select('id, slug').in('id', promptIds)
    : { data: [] as { id: string; slug: string }[] }

  const { data: problemData } = problemIds.length > 0
    ? await adminDb.from('problems').select('id, slug, short_id').in('id', problemIds)
    : { data: [] as { id: string; slug: string; short_id: string }[] }

  const promptSlugMap = new Map((promptData ?? []).map((p) => [p.id, p.slug]))
  const problemSlugMap = new Map((problemData ?? []).map((p) => [p.id, `${p.slug}-${p.short_id}`]))

  const contentHref = (contentType: string, contentId: string) => {
    if (contentType === 'prompt') {
      const slug = promptSlugMap.get(contentId)
      return slug ? `/prompts/${slug}` : null
    }
    const slug = problemSlugMap.get(contentId)
    return slug ? `/problems/${slug}` : null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Content Reports</h1>
        <p className="text-muted-foreground">
          Review and moderate reported content. Logged in as{' '}
          <span className="font-medium">{user.email}</span>.
        </p>
      </div>

      {/* Main Admin Navigation */}
      <div className="mb-6 flex gap-2 border-b border-border pb-4 overflow-x-auto">
        <Link
          href="/admin/dashboard"
          className="px-4 py-2 rounded-lg transition-colors bg-muted text-muted-foreground hover:bg-muted/80 whitespace-nowrap"
        >
          System Health
        </Link>
        <Link
          href="/admin/reports"
          className="px-4 py-2 rounded-lg transition-colors bg-primary text-primary-foreground whitespace-nowrap"
        >
          Content Reports
        </Link>
        <Link
          href="/admin/users"
          className="px-4 py-2 rounded-lg transition-colors bg-muted text-muted-foreground hover:bg-muted/80 whitespace-nowrap"
        >
          User Trust & Safety
        </Link>
        <Link
          href="/admin/logs"
          className="px-4 py-2 rounded-lg transition-colors bg-muted text-muted-foreground hover:bg-muted/80 whitespace-nowrap"
        >
          Audit Ledger
        </Link>
      </div>

      {/* Query error banner — useful for debugging */}
      {reportsError && (
        <div className="mb-4 p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
          Query error: {reportsError.message}
        </div>
      )}

      {/* Filter tabs */}
      <div className="mb-6 flex gap-2">
        {[
          { key: 'pending', label: 'Pending', count: pendingCount },
          { key: 'all', label: 'All Reports', count: totalCount },
          { key: 'reviewed', label: 'Reviewed', count: reviewedCount },
        ].map((tab) => (
          <Link
            key={tab.key}
            href={`/admin/reports?filter=${tab.key}`}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeFilter === tab.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {tab.label} ({tab.count})
          </Link>
        ))}
      </div>

      {/* Reports list */}
      <div className="space-y-4">
        {reports.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No reports found.</p>
          </div>
        ) : (
          reports.map((report: any) => {
            const viewHref = contentHref(report.content_type, report.content_id)
            const reporterName = profileMap.get(report.reporter_id) ?? 'Unknown'
            const reviewerName = report.reviewed_by ? (profileMap.get(report.reviewed_by) ?? 'Unknown') : null

            return (
              <div key={report.id} className="bg-card border border-border rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-1 text-xs rounded font-medium ${
                          report.status === 'pending'
                            ? 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400'
                            : report.status === 'resolved'
                              ? 'bg-green-500/15 text-green-700 dark:text-green-400'
                              : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {report.status}
                      </span>
                      <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded capitalize">
                        {report.content_type}
                      </span>
                      <span className="px-2 py-1 text-xs bg-destructive/10 text-destructive rounded">
                        {report.reason}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Reported by <span className="font-medium text-foreground">{reporterName}</span> on{' '}
                      {new Date(report.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {viewHref ? (
                    <Link
                      href={viewHref}
                      className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                      target="_blank"
                    >
                      View Content
                    </Link>
                  ) : (
                    <span className="px-3 py-1 text-sm bg-muted text-muted-foreground rounded">
                      Content not found
                    </span>
                  )}
                </div>

                {report.details && (
                  <div className="mb-4 p-3 bg-muted rounded">
                    <div className="text-sm font-medium text-foreground mb-1">Details:</div>
                    <div className="text-sm text-muted-foreground">{report.details}</div>
                  </div>
                )}

                {report.status === 'pending' && (
                  <div className="flex gap-2">
                    <form action={dismissReport.bind(null, report.id, user.id)}>
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm border border-border rounded hover:bg-muted transition-colors"
                      >
                        Dismiss
                      </button>
                    </form>

                    <form action={resolveReport.bind(null, report.id, user.id, false)}>
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                      >
                        Resolve (Keep Content)
                      </button>
                    </form>

                    <form action={resolveReport.bind(null, report.id, user.id, true)}>
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
                      >
                        Delete Content
                      </button>
                    </form>
                  </div>
                )}

                {report.status !== 'pending' && reviewerName && (
                  <div className="text-sm text-muted-foreground">
                    Reviewed by <span className="font-medium text-foreground">{reviewerName}</span> on{' '}
                    {report.reviewed_at
                      ? new Date(report.reviewed_at).toLocaleDateString()
                      : 'Unknown date'}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

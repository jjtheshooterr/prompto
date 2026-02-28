import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { Report } from '@/types/reports'

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
  // 1. Verify authentication server-side — middleware already checks for a
  //    cookie, but we do a real token validation here for the admin gate.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/admin/reports')
  }

  // 2. Check admin role in the database — this is the real security gate.
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          You must be an admin to access this page.
        </p>
        <Link href="/dashboard" className="text-blue-600 hover:underline">
          Go to Dashboard
        </Link>
      </div>
    )
  }

  // 3. Fetch report data server-side — only reaches here for verified admins.
  const { filter } = await searchParams
  const activeFilter = (filter === 'all' || filter === 'reviewed') ? filter : 'pending'

  let query = supabase
    .from('reports')
    .select(`
      *,
      reporter:profiles!reporter_id(username),
      reviewer:profiles!reviewed_by(username)
    `)
    .order('created_at', { ascending: false })

  if (activeFilter !== 'all') {
    query = query.eq('status', activeFilter === 'reviewed' ? 'resolved' : activeFilter)
  }

  const { data: reports } = await query
  const allReports: Report[] = reports || []

  const pendingCount = allReports.filter(r => r.status === 'pending').length
  const reviewedCount = allReports.filter(r => r.status !== 'pending').length

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Content Reports</h1>
        <p className="text-gray-600">
          Review and moderate reported content. Logged in as{' '}
          <span className="font-medium">{user.email}</span>.
        </p>
      </div>

      {/* Filter tabs — URL-based, no client state */}
      <div className="mb-6 flex gap-2">
        {[
          { key: 'pending', label: 'Pending', count: pendingCount },
          { key: 'all', label: 'All Reports', count: allReports.length },
          { key: 'reviewed', label: 'Reviewed', count: reviewedCount },
        ].map((tab) => (
          <Link
            key={tab.key}
            href={`/admin/reports?filter=${tab.key}`}
            className={`px-4 py-2 rounded-lg transition-colors ${activeFilter === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            {tab.label} ({tab.count})
          </Link>
        ))}
      </div>

      {/* Reports */}
      <div className="space-y-4">
        {allReports.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No reports found.</p>
          </div>
        ) : (
          allReports.map((report) => (
            <div key={report.id} className="bg-white border rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-1 text-xs rounded font-medium ${report.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : report.status === 'resolved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                    >
                      {report.status}
                    </span>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded capitalize">
                      {report.content_type}
                    </span>
                    <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                      {report.reason}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Reported by {(report as any).reporter?.username || 'Unknown'} on{' '}
                    {new Date(report.created_at).toLocaleDateString()}
                  </div>
                </div>

                <Link
                  href={
                    report.content_type === 'prompt'
                      ? `/prompts/${report.content_id}`
                      : `/problems/${report.content_id}`
                  }
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  target="_blank"
                >
                  View Content
                </Link>
              </div>

              {report.details && (
                <div className="mb-4 p-3 bg-gray-50 rounded">
                  <div className="text-sm font-medium text-gray-700 mb-1">Details:</div>
                  <div className="text-sm text-gray-600">{report.details}</div>
                </div>
              )}

              {report.status === 'pending' && (
                <div className="flex gap-2">
                  {/* Dismiss */}
                  <form action={dismissReport.bind(null, report.id, user.id)}>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    >
                      Dismiss
                    </button>
                  </form>

                  {/* Resolve — keep content */}
                  <form action={resolveReport.bind(null, report.id, user.id, false)}>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      Resolve (Keep Content)
                    </button>
                  </form>

                  {/* Resolve — delete content */}
                  <form action={resolveReport.bind(null, report.id, user.id, true)}>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      Delete Content
                    </button>
                  </form>
                </div>
              )}

              {report.status !== 'pending' && report.reviewed_by && (
                <div className="text-sm text-gray-500">
                  Reviewed by {(report as any).reviewer?.username || 'Unknown'} on{' '}
                  {report.reviewed_at
                    ? new Date(report.reviewed_at).toLocaleDateString()
                    : 'Unknown date'}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
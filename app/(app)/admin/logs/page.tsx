import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Pagination from '@/components/ui/Pagination'
import PageSizeSelector from '@/components/admin/PageSizeSelector'

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/admin/logs')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const allowedRoles = ['admin', 'owner']
  if (!profile || !allowedRoles.includes(profile.role)) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-6">Security Incident: Only authenticated Super Admins or Owners can view the immutable audit ledger.</p>
        <Link href="/dashboard" className="text-primary hover:underline">Go to Dashboard</Link>
      </div>
    )
  }

  // Pagination Logic
  const pageSizeOptions = [10, 20, 50]
  const page = Number(params.page) || 1
  const rawPageSize = Number(params.pageSize) || 10
  const pageSize = pageSizeOptions.includes(rawPageSize) ? rawPageSize : 10
  
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // Fetch the logs and join with the admin and target users
  const { data: logs, count, error } = await supabase
    .from('admin_audit_logs')
    .select(`
      id,
      action,
      details,
      created_at,
      admin:profiles!admin_id (username),
      target:profiles!target_user_id (username)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  const totalPages = Math.ceil((count || 0) / pageSize)

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Immutable Audit Ledger</h1>
            <p className="text-muted-foreground">
              A permanent record of all Trust & Safety moderation actions. No logs can be altered or deleted.
            </p>
          </div>
          <div className="flex items-center gap-4 bg-muted/30 p-2 rounded-lg border border-border">
            <PageSizeSelector currentSize={pageSize} />
          </div>
        </div>
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
          className="px-4 py-2 rounded-lg transition-colors bg-muted text-muted-foreground hover:bg-muted/80 whitespace-nowrap"
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
          className="px-4 py-2 rounded-lg transition-colors bg-primary text-primary-foreground whitespace-nowrap"
        >
          Audit Ledger
        </Link>
      </div>

      <div className="bg-card rounded-lg overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-border">
            <thead>
              <tr className="bg-muted">
                <th className="p-3 font-mono text-xs uppercase text-muted-foreground border-b border-border">Timestamp (UTC)</th>
                <th className="p-3 font-mono text-xs uppercase text-muted-foreground border-b border-border">Admin</th>
                <th className="p-3 font-mono text-xs uppercase text-muted-foreground border-b border-border">Action Executed</th>
                <th className="p-3 font-mono text-xs uppercase text-muted-foreground border-b border-border">Target User</th>
                <th className="p-3 font-mono text-xs uppercase text-muted-foreground border-b border-border">Immutable Details</th>
              </tr>
            </thead>
            <tbody className="font-mono text-sm">
              {!logs || logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No moderation logs found in the ledger.
                  </td>
                </tr>
              ) : (
                logs.map((log: any) => (
                  <tr key={log.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="p-3 text-muted-foreground whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-3 font-bold text-red-500 text-xs truncate max-w-[120px]" title={log.admin?.username}>
                      {log.admin?.username || 'UnknownAdmin'}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs shrink-0 font-bold ${
                        log.action.includes('ban') ? 'bg-red-500/20 text-red-500' 
                        : 'bg-blue-500/20 text-blue-500'
                      }`}>
                        {log.action.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-xs truncate max-w-[120px]" title={log.target?.username}>
                      {log.target?.username || 'UnknownTarget'}
                    </td>
                    <td className="p-3 text-muted-foreground text-xs break-all">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-bold text-foreground">{from + 1}</span>-
          <span className="font-bold text-foreground">{Math.min(to + 1, count || 0)}</span> of{' '}
          <span className="font-bold text-foreground">{count || 0}</span> actions
        </div>
        <Pagination currentPage={page} totalPages={totalPages} />
      </div>
    </div>
  )
}

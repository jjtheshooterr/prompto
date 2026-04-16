import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminAuditLogsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/admin/logs')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-6">Security Incident: Only authenticated Super Admins can view the immutable audit ledger.</p>
        <Link href="/dashboard" className="text-primary hover:underline">Go to Dashboard</Link>
      </div>
    )
  }

  // Fetch the logs and join with the admin and target users
  const { data: logs, error } = await supabase
    .from('admin_audit_logs')
    .select(`
      id,
      action,
      details,
      created_at,
      admin:profiles!admin_id (username),
      target:profiles!target_user_id (username)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8 flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Immutable Audit Ledger</h1>
          <p className="text-muted-foreground">
            A permanent record of all Trust & Safety moderation actions. No logs can be altered or deleted.
          </p>
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
                    <td className="p-3 font-bold text-red-500">
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
                    <td className="p-3 font-medium">
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
    </div>
  )
}

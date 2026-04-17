import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getPlatformSettings } from '@/lib/actions/admin.actions'
import { PlatformMetricsCards } from '@/components/admin/PlatformMetricsCards'
import { EmergencyControls } from '@/components/admin/EmergencyControls'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/admin/dashboard')
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
        <p className="text-muted-foreground mb-6">This restricted area is for PromptVexity Administrators and Owners.</p>
        <Link href="/dashboard" className="text-primary hover:underline">Return to Workspace</Link>
      </div>
    )
  }

  // Fetch Global Configuration state
  const settings = await getPlatformSettings()

  // Fetch Live Analytic Views
  const { data: dailyMetrics } = await supabase.from('admin_daily_metrics').select('*').single()
  const { data: totalMetrics } = await supabase.from('admin_total_metrics').select('*').single()

  const defaultDaily = {
    metric_date: new Date().toISOString(),
    daily_active_users: 0,
    new_signups: 0,
    prompts_created: 0,
    ai_evaluations_today: 0
  }

  const defaultTotal = {
    total_users: 0,
    total_prompts: 0,
    total_problems: 0,
    total_ai_evaluations: 0
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8 flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Platform Health & Economics</h1>
          <p className="text-muted-foreground">
            Command Center for systemic metrics, threat response, and platform stability.
          </p>
        </div>
      </div>

      <div className="mb-6 flex gap-2 border-b border-border pb-4 overflow-x-auto">
        <Link
          href="/admin/dashboard"
          className="px-4 py-2 rounded-lg transition-colors bg-primary text-primary-foreground whitespace-nowrap"
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
          className="px-4 py-2 rounded-lg transition-colors bg-muted text-muted-foreground hover:bg-muted/80 whitespace-nowrap"
        >
          Audit Ledger
        </Link>
      </div>

      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2">
            <PlatformMetricsCards 
              daily={dailyMetrics || defaultDaily} 
              total={totalMetrics || defaultTotal} 
            />
          </div>
          <div className="lg:col-span-1">
            <h2 className="text-xl font-bold tracking-tight mb-4">Command Actions</h2>
            <EmergencyControls initialIsLockdown={settings?.is_emergency_lockdown || false} />
          </div>
        </div>
      </div>
    </div>
  )
}

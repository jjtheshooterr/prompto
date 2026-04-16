import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUsers } from '@/lib/actions/admin.actions'
import UsersTable from '@/components/admin/UsersTable'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/admin/users')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-6">You must be an admin to access this page.</p>
        <Link href="/dashboard" className="text-primary hover:underline">Go to Dashboard</Link>
      </div>
    )
  }

  const users = await getUsers()

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8 flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">User Management</h1>
          <p className="text-muted-foreground">
            Manage trust scores, shadowbans, and account access.
          </p>
        </div>
        
        <div className="bg-muted/50 border border-border p-4 rounded-lg mt-2 space-y-2 text-sm">
          <h3 className="font-semibold text-foreground">Moderation Tools Guide</h3>
          <ul className="list-disc list-inside text-muted-foreground space-y-1.5">
            <li><strong className="text-foreground">Trust Score:</strong> An invisible multiplier on a user&apos;s leaderboard rankings. Default is 100 (1.0×). Set it lower (e.g. 50 = 0.5×) to penalize low-quality or spam contributors, or higher (e.g. 150 = 1.5×) to algorithmically amplify trusted creators. The user never sees this value.</li>
            <li><strong className="text-foreground">Shadowban:</strong> Silently removes ALL of the user&apos;s content — prompts, problems — from public feeds, search results, leaderboards, and profile pages. The user can still log in and use the app normally, completely unaware. Optionally attach a reason for internal record-keeping. Can be reversed at any time.</li>
            <li><strong className="text-foreground">Hard Ban:</strong> The nuclear option. Immediately revokes all active sessions, bans the account at the authentication layer (10-year lock), and auto-shadowbans their content so it vanishes from the platform instantly. Their pre-ban shadowban state is saved — if you unban them later, their content visibility is restored exactly as it was before the ban.</li>
            <li><strong className="text-foreground">Audit Ledger:</strong> Every moderation action taken — shadowbans, trust score changes, bans, unbans, featured toggles, and even Panic Button activations — is written to an immutable, append-only database log. Entries cannot be edited or deleted. Each record captures the acting Admin, the target, the action type, and the exact timestamp.</li>
            <li><strong className="text-foreground">Curation (Featured):</strong> Admins see a ★ icon on any public Problem or Prompt card. Toggling it marks the content as <code className="text-xs bg-muted px-1 py-0.5 rounded">is_featured</code>, which injects a large algorithmic weight boost (+10,000 score) to anchor it to the top of trending feeds and front-page placements.</li>
            <li><strong className="text-foreground">Panic Button:</strong> A platform-wide emergency killswitch in the System Health dashboard. When engaged, it circuit-breaks the AI evaluation engine — all prompt scoring requests are immediately rejected with a 503 error, preventing Denial of Wallet attacks or runaway API spend. Re-enabling it restores scoring instantly.</li>
          </ul>
        </div>
      </div>

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
          className="px-4 py-2 rounded-lg transition-colors bg-primary text-primary-foreground whitespace-nowrap"
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

      <div className="bg-card rounded-lg overflow-hidden border border-border">
        <UsersTable users={users as any} />
      </div>
    </div>
  )
}

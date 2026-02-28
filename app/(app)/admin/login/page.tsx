import { redirect } from 'next/navigation'

/**
 * Admin login page — previously used a client-side password check
 * (NEXT_PUBLIC_ADMIN_PASSWORD / localStorage) which was completely bypassable.
 *
 * The admin reports page already correctly gates access by checking
 * `profiles.role === 'admin'` via Supabase auth. There is no need for a
 * separate password layer. Simply redirect straight to /admin/reports and
 * let the DB-level role check do the real enforcement.
 */
export default function AdminLoginPage() {
  redirect('/admin/reports')
}
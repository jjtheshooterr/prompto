import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Admin Supabase client — uses the service role key to bypass RLS.
 * Only use this on the server in verified-admin code paths.
 * NEVER expose this client or the service role key to the browser.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

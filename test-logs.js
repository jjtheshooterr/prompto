import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data: logs, error } = await supabase
    .from('admin_audit_logs')
    .select(`
      id,
      action,
      details,
      created_at,
      admin:profiles!admin_id (username, email),
      target:profiles!target_user_id (username)
    `)
    .limit(10)

  console.log(JSON.stringify({ logs, error }, null, 2))
}

run()

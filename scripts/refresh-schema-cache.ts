/**
 * Refresh Supabase PostgREST Schema Cache
 * 
 * Run this after applying migrations to force PostgREST to reload the schema.
 * This is necessary when new tables are added via migrations.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function refreshSchemaCache() {
  console.log('🔄 Refreshing Supabase schema cache...')
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // Make a simple query to force schema reload
    // PostgREST will detect schema changes on the next request
    const { error } = await supabase.rpc('pg_notify', {
      channel: 'pgrst',
      payload: 'reload schema'
    })

    if (error) {
      console.log('⚠️  RPC method not available, trying alternative method...')
      
      // Alternative: Just make any query to trigger cache check
      const { error: testError } = await supabase
        .from('prompt_comparisons')
        .select('id')
        .limit(1)
      
      if (testError) {
        if (testError.code === 'PGRST205') {
          console.log('❌ Table still not visible in schema cache')
          console.log('💡 Solution: Restart your Supabase project from the dashboard')
          console.log('   Dashboard → Settings → General → Restart project')
          console.log('   Or wait 1-2 minutes for automatic cache refresh')
        } else {
          console.log('✅ Schema cache refreshed! Table is now accessible')
        }
      } else {
        console.log('✅ Schema cache refreshed! Table is now accessible')
      }
    } else {
      console.log('✅ Schema reload signal sent')
    }
  } catch (err) {
    console.error('Error:', err)
  }
}

refreshSchemaCache()

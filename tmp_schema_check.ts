import { createClient } from '@supabase/supabase-js'
import { Client } from 'pg'

const pgClient = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
})

async function run() {
    await pgClient.connect()
    const res = await pgClient.query("SELECT column_name FROM information_schema.columns WHERE table_name='problems';")
    console.log("Problems columns:", res.rows.map(r => r.column_name))
    await pgClient.end()
}
run()

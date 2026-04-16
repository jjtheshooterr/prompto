import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
    const email = 'testuser1@example.com'
    const password = 'AdminPassword123!'

    const { data: { users } } = await supabase.auth.admin.listUsers()
    const existing = users.find(u => u.email === email)
    if (!existing) {
        console.error('testuser1 not found')
        process.exit(1)
    }

    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
        password: password
    })

    if (error) {
        console.error('Error updating password:', error.message)
        process.exit(1)
    }

    // Set as admin in profiles
    await supabase.from('profiles').update({ role: 'admin' }).eq('id', existing.id)

    console.log('SUCCESS')
    console.log('Email:', email)
    console.log('Password:', password)
}

main()

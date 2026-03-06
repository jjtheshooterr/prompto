import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
    console.log('Creating test user...')

    const email = 'new-test-user@example.com'
    const password = 'TestPassword123!'

    // First try to delete the user if it exists to ensure a clean slate
    // (This might fail if the user doesn't exist, which is fine)
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const existingUser = users.find(u => u.email === email)
    if (existingUser) {
        console.log('User already exists, deleting first...')
        await supabase.auth.admin.deleteUser(existingUser.id)
    }

    const { data, error } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
            username: 'Test_User_123',
            display_name: 'Test User'
        }
    })

    if (error) {
        console.error('Error creating user:', error)
        process.exit(1)
    }

    console.log('✅ Successfully created test user!')
    console.log('Email:', email)
    console.log('Password:', password)
}

main()

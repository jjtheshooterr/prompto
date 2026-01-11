import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()

    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    return NextResponse.json({
        serverConfig: {
            supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            anonKeyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...'
        },
        cookies: allCookies.map(c => ({
            name: c.name,
            hasValue: !!c.value,
            valueLength: c.value?.length || 0
        })),
        authState: {
            hasUser: !!user,
            userEmail: user?.email || null,
            error: error ? {
                message: error.message,
                status: error.status,
                name: error.name
            } : null
        }
    })
}

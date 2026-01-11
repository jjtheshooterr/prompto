import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('sb-yknsbonffoaxxcwvxrls-auth-token')

    console.log('Debug Cookie - Name:', authCookie?.name)
    console.log('Debug Cookie - Value length:', authCookie?.value?.length)
    console.log('Debug Cookie - Value preview:', authCookie?.value?.substring(0, 100))

    // Try to manually parse
    let parsedData = null
    try {
        if (authCookie?.value) {
            // Supabase stores session as base64-encoded JSON
            const decoded = Buffer.from(authCookie.value, 'base64').toString('utf-8')
            parsedData = JSON.parse(decoded)
            console.log('Debug Cookie - Parsed successfully:', !!parsedData)
        }
    } catch (e: any) {
        console.log('Debug Cookie - Parse error:', e.message)
        // Cookie might not be base64, try direct JSON parse
        try {
            if (authCookie?.value) {
                parsedData = JSON.parse(authCookie.value)
                console.log('Debug Cookie - Direct JSON parse successful')
            }
        } catch (e2: any) {
            console.log('Debug Cookie - Direct JSON parse also failed:', e2.message)
        }
    }

    const supabase = await createClient()
    const { data: { session }, error } = await supabase.auth.getSession()

    return NextResponse.json({
        rawCookie: {
            exists: !!authCookie,
            length: authCookie?.value?.length || 0,
            preview: authCookie?.value?.substring(0, 50) + '...'
        },
        parsedCookie: parsedData ? {
            hasAccessToken: !!parsedData.access_token,
            hasRefreshToken: !!parsedData.refresh_token,
            userEmail: parsedData.user?.email || null
        } : null,
        supabaseSession: {
            hasSession: !!session,
            userEmail: session?.user?.email || null,
            error: error?.message || null
        }
    })
}

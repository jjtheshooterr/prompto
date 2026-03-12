import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 60 // Allows this function to run for up to 60 seconds

export async function GET(request: Request) {
  // Verify Vercel Cron Secret for security
  const authHeader = request.headers.get('authorization');
  if (
    process.env.NODE_ENV === 'production' &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // We must use the Service Role key to ensure we have permission to refresh materialized views
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    console.log("Triggering leaderboard materialized view refreshes...");

    // Call the RPC function defined in the SQL migration
    const { error } = await supabaseAdmin.rpc('refresh_leaderboards');

    if (error) {
      console.error("Error refreshing leaderboards:", error);
      throw error;
    }

    return NextResponse.json({ success: true, message: "Leaderboards refreshed successfully" });

  } catch (error: any) {
    console.error('Leaderboard cron failed:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
    console.log("Checking columns on:", supabaseUrl);
    const { data, error } = await supabase.from('prompts').select('*').limit(1);

    if (error) {
        console.error("Error:", error);
        return;
    }

    if (data && data.length > 0) {
        console.log("Columns in 'prompts' table:", Object.keys(data[0]));
    } else {
        console.log("No data in 'prompts' table to check columns.");
    }
}

run();

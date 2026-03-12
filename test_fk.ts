import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('prompts').select('id, created_by, author:profiles!prompts_created_by_fkey(id, username)').limit(1);
  console.log("With explicit fkey name:", JSON.stringify({ data, error }, null, 2));

  const { data: d2, error: e2 } = await supabase.from('prompts').select('id, created_by, author:profiles!created_by(id, username)').limit(1);
  console.log("With column name:", JSON.stringify({ data: d2, error: e2 }, null, 2));
}

run();

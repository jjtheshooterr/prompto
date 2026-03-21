const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function testDeepSeek() {
  const envFile = fs.readFileSync('.env.local', 'utf8');
  function getEnv(key) {
    const match = envFile.match(new RegExp(`${key}=(.*)`));
    return match ? match[1].trim() : null;
  }

  const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
  const supabaseKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Login
  console.log("Logging in...");
  const { data: { session }, error: authError } = await supabase.auth.signInWithPassword({
    email: 'ui-tester-3@example.com',
    password: 'password123'
  });
  
  if (authError || !session) {
    console.error("Login failed:", authError);
    return;
  }
  
  const userId = session.user.id;
  const jwt = session.access_token;
  
  // Insert a test prompt
  console.log("Inserting test prompt...");
  const { data: prompt, error: insertError } = await supabase.from('prompts').insert({
    created_by: userId,
    title: 'DeepSeek Automated Test Prompt',
    problem_id: '11111111-1111-1111-1111-111111111111', // Dummy UUID, won't strictly enforce fkey if not exists? Wait, problem_id is a foreign key. Let's find a real one.
    system_prompt: 'You are an AI assistant...',
    user_prompt_template: 'Return data as JSON'
  }).select().single();
  
  if (insertError) {
    console.error("Failed to insert prompt. Let's fetch an existing one to test.");
    // Fetch an existing prompt owned by user
    const { data: existing } = await supabase.from('prompts').select('id').eq('created_by', userId).limit(1);
    if (!existing || existing.length === 0) {
      console.error("No prompts found for user to score.");
      return;
    }
    await evaluatePrompt(existing[0].id, jwt);
    return;
  }
  
  console.log("Created prompt:", prompt.id);
  await evaluatePrompt(prompt.id, jwt);
}

async function evaluatePrompt(promptId, jwt) {
  console.log("Evaluating prompt via API...");
  const res = await fetch('http://localhost:3000/api/jobs/score-prompt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `sb-yknsbonffoaxxcwvxrls-auth-token=${jwt}` // Best effort auth injection, but Next.js router might need Authorization header or supabase auth cookie
    },
    body: JSON.stringify({ promptId })
  });
  
  const text = await res.text();
  console.log("API Response Status:", res.status);
  console.log("API Response Body:", text);
}

testDeepSeek();

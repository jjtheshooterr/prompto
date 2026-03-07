import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

function slugify(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

const newPrompts = [
    {
        title: 'Customer Churn Predictor',
        system_prompt: 'Analyze this user activity log and predict the likelihood of churn in the next 30 days based on their login frequency, feature usage, and support ticket history.',
        user_prompt_template: 'Here is the user log: {{user_log}}',
        model: 'gpt-4o'
    },
    {
        title: 'Sales Email Sequence Generator',
        system_prompt: 'Create a 3-part cold email sequence targeting enterprise decision makers for a B2B cybersecurity product. Emphasize compliance, risk reduction, and ROI.',
        user_prompt_template: 'Product details: {{product_details}}\nTarget persona: {{target_persona}}',
        model: 'claude-3-5-sonnet'
    },
    {
        title: 'Frontend Component Refactor',
        system_prompt: 'Refactor the following React component to use custom hooks for state management and improve its reusability and testability.',
        user_prompt_template: 'Component code:\n```tsx\n{{component_code}}\n```',
        model: 'gpt-4-turbo'
    },
    {
        title: 'Product Launch Brainstorm',
        system_prompt: 'Generate 10 creative marketing campaign ideas for launching a new AI-powered document search feature to an existing user base of lawyers.',
        user_prompt_template: 'Feature specs: {{feature_specs}}\nBudget: {{budget}}',
        model: 'gemini-1.5-pro'
    },
    {
        title: 'SEO Keyword Strategy',
        system_prompt: 'Create a comprehensive SEO keyword strategy for a new project management tool targeting remote teams. Include long-tail terms and search intent.',
        user_prompt_template: 'Product name: {{product_name}}\nNiche: {{niche}}',
        model: 'gpt-4o'
    },
    {
        title: 'Code Documentation Writer',
        system_prompt: 'Write clear and concise inline documentation and a README summary for the provided TypeScript utility file, focusing on usage examples.',
        user_prompt_template: 'Code:\n```ts\n{{code}}\n```',
        model: 'claude-3-haiku'
    }
];

async function run() {
    // We need a user to assign these to, finding the first available user or creating a mock assignment assumption
    const { data: users } = await supabase.from('profiles').select('id').limit(1);
    const userId = users && users.length > 0 ? users[0].id : null;

    if (!userId) {
        console.log("No users found in database. Please run signup to create a user first!");
        return;
    }

    console.log(`Creating 6 mock prompts for user ${userId}...`);

    for (const p of newPrompts) {
        // 1. Insert prompt
        const { data: insertedPrompt, error: insertError } = await supabase
            .from('prompts')
            .insert({
                title: p.title,
                system_prompt: p.system_prompt,
                user_prompt_template: p.user_prompt_template,
                // Let DB generate ID, then we update slug
                slug: 'temp-slug-' + Date.now(),
                created_by: userId,
                status: 'published',
                visibility: 'public',
                is_listed: true,
                model: p.model
            })
            .select('id')
            .single();

        if (insertError) {
            console.error(`Failed to create prompt ${p.title}:`, insertError);
            continue;
        }

        // 2. Format slug
        const shortId = insertedPrompt.id.split('-')[0];
        const newSlug = `${slugify(p.title)}-${shortId}`;

        // 3. Update with final slug
        await supabase.from('prompts').update({ slug: newSlug }).eq('id', insertedPrompt.id);

        console.log(`Created prompt: ${p.title} (${newSlug})`);
    }
    console.log("Finished seeding mock prompts.");
}

run();

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

// Generate slugs based on titles
function slugify(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

const replacementPrompts = [
    {
        title: 'Customer Churn Predictor',
        system_prompt: 'Analyze this user activity log and predict the likelihood of churn in the next 30 days based on their login frequency, feature usage, and support ticket history.',
    },
    {
        title: 'Sales Email Sequence Generator',
        system_prompt: 'Create a 3-part cold email sequence targeting enterprise decision makers for a B2B cybersecurity product. Emphasize compliance, risk reduction, and ROI.',
    },
    {
        title: 'Frontend Component Refactor',
        system_prompt: 'Refactor the following React component to use custom hooks for state management and improve its reusability and testability.',
    },
    {
        title: 'Product Launch Brainstorm',
        system_prompt: 'Generate 10 creative marketing campaign ideas for launching a new AI-powered document search feature to an existing user base of lawyers.',
    },
    {
        title: 'SEO Keyword Strategy',
        system_prompt: 'Create a comprehensive SEO keyword strategy for a new project management tool targeting remote teams. Include long-tail terms and search intent.',
    },
    {
        title: 'Investor Update Email',
        system_prompt: 'Draft a monthly investor update email template that highlights ARR growth, new key hires, product milestones, and asks for specific intros.',
    },
    {
        title: 'Code Documentation Writer',
        system_prompt: 'Write clear and concise inline documentation and a README summary for the provided TypeScript utility file, focusing on usage examples.',
    },
    {
        title: 'Technical Interview Questions',
        system_prompt: 'Generate 5 advanced system design interview questions focused on building highly available microservices with distributed caching.',
    },
    {
        title: 'User Story Generator',
        system_prompt: 'Convert the following high-level feature description into well-defined Agile user stories with clear acceptance criteria (Given/When/Then).',
    },
    {
        title: 'Bug Bash Instructions',
        system_prompt: 'Create a set of instructions for a QA team conducting a bug bash on the new checkout flow. Include key edge cases to test.',
    },
    {
        title: 'Database Migration Plan',
        system_prompt: 'Draft a step-by-step zero-downtime database migration plan for moving from a single PostgreSQL instance to a master-replica setup.',
    },
    {
        title: 'Competitor Feature Matrix',
        system_prompt: 'Generate a feature comparison matrix analyzing our SaaS product against our top 3 competitors, highlighting our unique selling propositions.',
    }
];

async function run() {
    // Find gibberish prompts
    const { data: prompts, error } = await supabase
        .from('prompts')
        .select('id, title, slug')
        .in('title', ['fdgf', 'rdgf', 'ghgfh', 'fdgfdfdg', 'g', 'fghfxg', 'thfgfd', 'ghxgfhfgh', 'fdgfd', 'sdg', 'gfdzf']);

    if (error) {
        console.error('Error fetching prompts:', error);
        return;
    }

    console.log(`Found ${prompts?.length || 0} gibberish prompts to update.`);
    if (!prompts) return;

    for (let i = 0; i < prompts.length; i++) {
        const prompt = prompts[i];
        const replacement = replacementPrompts[i % replacementPrompts.length];

        // We append the short ID to the slug
        const shortId = prompt.id.split('-')[0]
        const newSlug = `${slugify(replacement.title)}-${shortId}`;

        const { error: updateError } = await supabase
            .from('prompts')
            .update({
                title: replacement.title,
                system_prompt: replacement.system_prompt,
                slug: newSlug
            })
            .eq('id', prompt.id);

        if (updateError) {
            console.error(`Failed to update prompt ${prompt.id}:`, updateError);
        } else {
            console.log(`Updated prompt ${prompt.id} to "${replacement.title}" (slug: ${newSlug})`);
        }
    }
}

run();

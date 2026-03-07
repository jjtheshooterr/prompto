import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

function slugify(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

async function run() {
    console.log("Fetching all prompts from:", supabaseUrl);
    const { data: prompts, error } = await supabase
        .from('prompts')
        .select('id, title, slug');

    if (error) {
        console.error('Error fetching prompts:', error);
        return;
    }

    console.log(`Processing ${prompts?.length || 0} prompts...`);

    for (const prompt of prompts || []) {
        const cleanSlug = slugify(prompt.title);

        // Only update if it's different
        if (prompt.slug !== cleanSlug) {
            const { error: updateError } = await supabase
                .from('prompts')
                .update({ slug: cleanSlug })
                .eq('id', prompt.id);

            if (updateError) {
                console.error(`Failed to update prompt ${prompt.id}:`, updateError);
            } else {
                console.log(`Updated ${prompt.id}: "${prompt.slug}" -> "${cleanSlug}"`);
            }
        } else {
            console.log(`Skipped ${prompt.id}: already clean ("${prompt.slug}")`);
        }
    }
}

run();

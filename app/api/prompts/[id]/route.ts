import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = await createClient()

        const { data: prompt, error } = await supabase
            .from('prompts')
            .select(`
                id,
                title,
                slug,
                model,
                system_prompt,
                user_prompt_template,
                improvement_summary,
                best_for,
                tradeoffs,
                created_at,
                created_by,
                problem_id,
                status,
                prompt_stats (
                    score,
                    upvotes,
                    downvotes,
                    works_count,
                    fails_count,
                    quality_score,
                    structure_score,
                    ai_quality_score,
                    copy_count,
                    fork_count,
                    view_count,
                    reviews_count
                )
            `)
            .eq('id', id)
            .eq('status', 'published')
            .single()

        if (error || !prompt) {
            console.error('Error fetching prompt:', error)
            return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
        }

        // Build response object with proper typing
        const response: any = { ...prompt }

        // Fetch author profile
        if (prompt.created_by) {
            const { data: author } = await supabase
                .from('profiles')
                .select('id, username, display_name, avatar_url')
                .eq('id', prompt.created_by)
                .single()
            
            response.author = author
        }

        // Fetch problem info
        if (prompt.problem_id) {
            const { data: problem } = await supabase
                .from('problems')
                .select('id, slug, title, short_id')
                .eq('id', prompt.problem_id)
                .single()
            
            if (problem) {
                response.problemId = problem.id
                response.problemSlug = problem.slug
                response.problemTitle = problem.title
                response.problemShortId = problem.short_id || problem.id.slice(0, 8)
            }
        }

        return NextResponse.json(response)
    } catch (error) {
        console.error('Error fetching prompt:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

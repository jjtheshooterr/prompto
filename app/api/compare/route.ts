import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { promptIds } = await request.json()

        if (!Array.isArray(promptIds) || promptIds.length < 2) {
            return NextResponse.json(
                { error: 'At least 2 prompt IDs are required' },
                { status: 400 }
            )
        }

        if (promptIds.length > 4) {
            return NextResponse.json(
                { error: 'Maximum 4 prompts can be compared' },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        // Fetch prompts with all compare-relevant fields
        const { data: prompts, error: promptsError } = await supabase
            .from('prompts')
            .select(`
                id,
                problem_id,
                title,
                slug,
                model,
                params,
                system_prompt,
                user_prompt_template,
                example_input,
                example_output,
                known_failures,
                notes,
                improvement_summary,
                best_for,
                tradeoffs,
                fix_summary,
                usage_context,
                parent_prompt_id,
                root_prompt_id,
                depth,
                created_by,
                created_at,
                updated_at,
                status
            `)
            .in('id', promptIds)
            .eq('status', 'published')

        if (promptsError) {
            console.error('Error fetching prompts:', promptsError)
            return NextResponse.json(
                { error: 'Failed to fetch prompts' },
                { status: 500 }
            )
        }

        if (!prompts || prompts.length === 0) {
            return NextResponse.json(
                { error: 'No prompts found' },
                { status: 404 }
            )
        }

        // Validate same problem
        const problemIds = [...new Set(prompts.map(p => p.problem_id))]
        if (problemIds.length > 1) {
            return NextResponse.json(
                { error: 'Only prompts from the same problem can be compared.' },
                { status: 400 }
            )
        }

        const problemId = problemIds[0]

        // Fetch problem details
        const { data: problem, error: problemError } = await supabase
            .from('problems')
            .select('id, slug, title, short_id, description, goal, difficulty, industry')
            .eq('id', problemId)
            .single()

        if (problemError || !problem) {
            console.error('Error fetching problem:', problemError)
            return NextResponse.json(
                { error: 'Problem not found' },
                { status: 404 }
            )
        }

        // Fetch stats for all prompts
        const { data: stats } = await supabase
            .from('prompt_stats')
            .select(`
                prompt_id,
                upvotes,
                downvotes,
                score,
                copy_count,
                view_count,
                fork_count,
                works_count,
                fails_count,
                reviews_count,
                last_reviewed_at,
                structure_score,
                ai_quality_score,
                quality_score,
                ai_scored_at
            `)
            .in('prompt_id', promptIds)

        // Fetch authors
        const authorIds = [...new Set(prompts.map(p => p.created_by).filter(Boolean))]
        const { data: authors } = await supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url, headline, reputation, reputation_score')
            .in('id', authorIds)

        // Fetch review summaries
        const { data: reviews } = await supabase
            .from('prompt_reviews')
            .select('prompt_id, review_type, created_at')
            .in('prompt_id', promptIds)

        // Build review summaries
        const reviewSummaries = promptIds.map(promptId => {
            const promptReviews = reviews?.filter(r => r.prompt_id === promptId) || []
            const workedCount = promptReviews.filter(r => r.review_type === 'worked').length
            const failedCount = promptReviews.filter(r => r.review_type === 'failed').length
            const noteCount = promptReviews.filter(r => r.review_type === 'note').length
            const latestReview = promptReviews.sort((a, b) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0]

            return {
                prompt_id: promptId,
                total_reviews: promptReviews.length,
                worked_count: workedCount,
                failed_count: failedCount,
                note_count: noteCount,
                latest_review_at: latestReview?.created_at || null
            }
        })

        // Build author map
        const authorMap = new Map(authors?.map(a => [a.id, a]) || [])
        
        // Build stats map
        const statsMap = new Map(stats?.map(s => [s.prompt_id, s]) || [])
        
        // Build review summary map
        const reviewMap = new Map(reviewSummaries.map(r => [r.prompt_id, r]))

        // Assemble final payload
        const enrichedPrompts = prompts.map(prompt => ({
            ...prompt,
            author: authorMap.get(prompt.created_by) || null,
            stats: statsMap.get(prompt.id) || null,
            review_summary: reviewMap.get(prompt.id) || null
        }))

        // Optional: Fetch pairwise history if exactly 2 prompts
        let pairwiseHistory = null
        if (promptIds.length === 2) {
            const { data: comparisons } = await supabase
                .from('prompt_comparisons')
                .select('winner_prompt_id, is_blind')
                .or(`prompt_a_id.in.(${promptIds.join(',')}),prompt_b_id.in.(${promptIds.join(',')})`)

            if (comparisons && comparisons.length > 0) {
                const promptAWins = comparisons.filter(c => c.winner_prompt_id === promptIds[0]).length
                const promptBWins = comparisons.filter(c => c.winner_prompt_id === promptIds[1]).length
                const blindMatchups = comparisons.filter(c => c.is_blind).length

                pairwiseHistory = {
                    total_matchups: comparisons.length,
                    prompt_a_wins: promptAWins,
                    prompt_b_wins: promptBWins,
                    latest_winner_prompt_id: comparisons[0]?.winner_prompt_id || null,
                    blind_matchups: blindMatchups
                }
            }
        }

        return NextResponse.json({
            problem,
            prompts: enrichedPrompts,
            pairwise_history: pairwiseHistory
        })

    } catch (error) {
        console.error('Error in compare API:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

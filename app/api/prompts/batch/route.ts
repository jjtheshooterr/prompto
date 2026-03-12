import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { ids } = await request.json()

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'Invalid prompt IDs' }, { status: 400 })
        }

        const supabase = await createClient()

        const { data: prompts, error } = await supabase
            .from('prompts')
            .select(`
                id,
                title,
                problem_id,
                problems!prompts_problem_id_fkey (
                    id,
                    slug,
                    title
                )
            `)
            .in('id', ids)
            .eq('status', 'published')

        if (error) {
            console.error('Error fetching prompts:', error)
            return NextResponse.json({ error: 'Failed to fetch prompts' }, { status: 500 })
        }

        const formatted = prompts.map((prompt: any) => ({
            id: prompt.id,
            title: prompt.title,
            problemId: prompt.problem_id,
            problemSlug: prompt.problems.slug,
            problemTitle: prompt.problems.title,
            problemShortId: prompt.problems.id.slice(0, 8)
        }))

        return NextResponse.json(formatted)
    } catch (error) {
        console.error('Error in batch prompts API:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

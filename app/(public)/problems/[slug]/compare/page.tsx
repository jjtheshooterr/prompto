import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { extractDbSlug } from '@/lib/utils/prompt-url'
import { SimplePromptComparison } from '@/components/compare/SimplePromptComparison'
import Link from 'next/link'

interface ComparePageProps {
    params: Promise<{ slug: string }>
    searchParams: Promise<{ prompts?: string }>
}

export default async function ComparePage({ params, searchParams }: ComparePageProps) {
    const { slug: slugParam } = await params
    const { prompts: promptsParam } = await searchParams

    const { dbSlug, shortId, isFullUuid } = extractDbSlug(slugParam)
    const supabase = await createClient()

    // 1. Fetch Problem
    const problemQuery = isFullUuid
        ? supabase.from('problems').select('*').eq('id', dbSlug).single()
        : supabase.from('problems').select('*').eq('slug', dbSlug).eq('short_id', shortId).single()

    const { data: problem } = await problemQuery
    if (!problem) return redirect('/problems')

    const expectedSlugParam = `${problem.slug}-${problem.short_id}`

    // 2. Parse selected prompts
    const requestedPromptIds = promptsParam ? promptsParam.split(',').filter(Boolean) : []

    if (requestedPromptIds.length < 2) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <h2 className="text-lg font-bold text-slate-900 mb-2">Not Enough Prompts</h2>
                    <p className="text-slate-500 text-sm mb-6">You need to select at least 2 prompts to compare them side-by-side.</p>
                    <Link href={`/problems/${expectedSlugParam}`} className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors text-sm">
                        Back to Problem
                    </Link>
                </div>
            </div>
        )
    }

    // 3. Fetch Prompts & Stats
    const { data: promptsRaw } = await supabase
        .from('prompts')
        .select(`
      *,
      prompt_stats(*)
    `)
        .in('id', requestedPromptIds)
    
    const prompts = promptsRaw || []
    
    // Fetch author profiles separately
    if (prompts.length > 0) {
        const authorIds = [...new Set(prompts.map(p => p.created_by).filter(Boolean))]
        const { data: authors } = await supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url')
            .in('id', authorIds)
        
        // Attach authors to prompts
        const authorMap = new Map(authors?.map(a => [a.id, a]) || [])
        prompts.forEach(p => {
            p.author = authorMap.get(p.created_by) || null
        })
    }

    // 4. Validate problem_id
    const validPrompts = prompts.filter(p => p.problem_id === problem.id)
    const mismatchCount = requestedPromptIds.length - validPrompts.length

    if (validPrompts.length < 2) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 mb-2">Invalid Selection</h2>
                    <p className="text-slate-500 text-sm mb-6">
                        The selected prompts do not belong to this problem. You can only compare solutions that share the exact same problem context.
                    </p>
                    <Link href={`/problems/${expectedSlugParam}`} className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors text-sm">
                        Back to Problem
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Compact Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                            <Link
                                href={`/problems/${expectedSlugParam}`}
                                className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </Link>
                            <div className="min-w-0">
                                <h1 className="text-lg font-bold text-slate-900 truncate">
                                    Compare Prompts
                                </h1>
                                <p className="text-sm text-slate-500 truncate">
                                    Problem: {problem.title}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-sm font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
                                {validPrompts.length} prompts selected
                            </span>
                            <Link
                                href={`/problems/${expectedSlugParam}`}
                                className="text-sm font-semibold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                Clear
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {mismatchCount > 0 && (
                <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3 text-center sm:px-6 lg:px-8">
                    <p className="text-sm text-yellow-800 font-medium flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Selected prompts that belong to a different problem were removed from comparison.
                    </p>
                </div>
            )}

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <SimplePromptComparison prompts={validPrompts} />
            </main>
        </div>
    )
}

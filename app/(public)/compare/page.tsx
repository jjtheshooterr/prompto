'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SimplePromptComparison } from '@/components/compare/SimplePromptComparison'

interface PromptData {
    id: string
    title: string
    problemId: string
    problemSlug: string
    problemTitle: string
    problemShortId: string
    model?: string
    system_prompt?: string
    user_prompt_template?: string
    improvement_summary?: string
    best_for?: string[]
    tradeoffs?: string
    created_at: string
    created_by?: string
    slug?: string
    author?: {
        username?: string
        display_name?: string
        avatar_url?: string
    }
    prompt_stats?: Array<{
        score?: number
        upvotes?: number
        downvotes?: number
        works_count?: number
        fails_count?: number
    }>
}

export default function ComparePage() {
    const router = useRouter()
    const [prompts, setPrompts] = useState<PromptData[]>([])
    const [loading, setLoading] = useState(true)
    const [problemInfo, setProblemInfo] = useState<{ title: string; slug: string; shortId: string } | null>(null)

    useEffect(() => {
        const loadPrompts = async () => {
            const ids = JSON.parse(localStorage.getItem('comparePrompts') || '[]')
            
            if (ids.length === 0) {
                setLoading(false)
                return
            }

            try {
                const response = await fetch('/api/compare', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ promptIds: ids })
                })

                if (response.ok) {
                    const data = await response.json()
                    console.log('Compare API response:', data)
                    
                    setPrompts(data.prompts)
                    
                    if (data.problem) {
                        setProblemInfo({
                            title: data.problem.title,
                            slug: data.problem.slug,
                            shortId: data.problem.short_id || data.problem.id.slice(0, 8)
                        })
                    }
                    
                    // Clean up invalid IDs
                    const validIds = data.prompts.map((p: PromptData) => p.id)
                    if (validIds.length !== ids.length) {
                        localStorage.setItem('comparePrompts', JSON.stringify(validIds))
                    }
                } else {
                    const error = await response.json()
                    console.error('Compare API error:', error)
                    
                    if (response.status === 400 && error.error?.includes('same problem')) {
                        // Handle multi-problem error
                        setLoading(false)
                    }
                }
            } catch (error) {
                console.error('Failed to load prompts:', error)
            } finally {
                setLoading(false)
            }
        }

        loadPrompts()
    }, [])

    const handleRemovePrompt = (id: string) => {
        const updated = prompts.filter(p => p.id !== id)
        setPrompts(updated)
        localStorage.setItem('comparePrompts', JSON.stringify(updated.map(p => p.id)))
        
        if (updated.length === 0) {
            router.push('/problems')
        }
    }

    const handleClear = () => {
        localStorage.removeItem('comparePrompts')
        router.push('/problems')
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-500">Loading comparison...</p>
                </div>
            </div>
        )
    }

    if (prompts.length === 0) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-6">
                    <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">No Prompts Selected</h2>
                    <p className="text-slate-500 mb-6">
                        Select 2-4 prompts from a problem page to compare them side-by-side.
                    </p>
                    <Link
                        href="/problems"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                    >
                        Browse Problems
                    </Link>
                </div>
            </div>
        )
    }

    // Check if all prompts are from same problem
    const problemIds = [...new Set(prompts.map(p => p.problemId))]
    const isMultiProblem = problemIds.length > 1

    if (isMultiProblem) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 mb-2">Different Problems Selected</h2>
                    <p className="text-slate-500 text-sm mb-6">
                        You can only compare prompts from the same problem. Please clear your selection and choose prompts from one problem.
                    </p>
                    <button
                        onClick={handleClear}
                        className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors text-sm"
                    >
                        Clear Selection
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                            {problemInfo && (
                                <Link
                                    href={`/problems/${problemInfo.slug}-${problemInfo.shortId}`}
                                    className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </Link>
                            )}
                            <div className="min-w-0">
                                <h1 className="text-lg font-bold text-slate-900 truncate">
                                    Compare Prompts
                                </h1>
                                {problemInfo && (
                                    <p className="text-sm text-slate-500 truncate">
                                        Problem: {problemInfo.title}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-sm font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
                                {prompts.length} prompts selected
                            </span>
                            <button
                                onClick={handleClear}
                                className="text-sm font-semibold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Comparison */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <SimplePromptComparison prompts={prompts} onRemovePrompt={handleRemovePrompt} />
            </main>
        </div>
    )
}

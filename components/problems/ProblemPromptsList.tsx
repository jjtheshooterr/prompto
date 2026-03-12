'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { promptUrl } from '@/lib/utils/prompt-url'
import { CompareSelectionBar } from './CompareSelectionBar'

function WorksBadge({ works, fails }: { works: number; fails: number }) {
    const total = works + fails
    if (total === 0) return <span className="text-xs text-slate-400 italic">No tests yet</span>
    const rate = Math.round((works / total) * 100)
    const cls = rate >= 80
        ? 'text-green-700 bg-green-50 border-green-200'
        : rate >= 50
            ? 'text-yellow-700 bg-yellow-50 border-yellow-200'
            : 'text-red-700 bg-red-50 border-red-200'
    const icon = rate >= 80
        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        : rate >= 50
            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
    return (
        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${cls}`}>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">{icon}</svg>
            {rate}% Works
        </span>
    )
}

interface Props {
    prompts: any[];
    problemSlug: string;
}

export function ProblemPromptsList({ prompts, problemSlug }: Props) {
    const [selectedIds, setSelectedIds] = useState<string[]>([])

    // Load from localStorage on mount
    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem('comparePrompts') || '[]')
        setSelectedIds(stored)
    }, [])

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => {
            let updated: string[]
            if (prev.includes(id)) {
                updated = prev.filter(pId => pId !== id)
            } else {
                if (prev.length >= 4) {
                    toast.error('You can only compare up to 4 prompts at once.')
                    return prev
                }
                updated = [...prev, id]
            }
            // Sync to localStorage
            localStorage.setItem('comparePrompts', JSON.stringify(updated))
            window.dispatchEvent(new CustomEvent('compareUpdated'))
            return updated
        })
    }

    const clearSelection = () => {
        setSelectedIds([])
        localStorage.removeItem('comparePrompts')
        window.dispatchEvent(new CustomEvent('compareUpdated'))
    }

    if (prompts.length === 0) {
        return (
            <div className="bg-white border border-dashed border-slate-200 rounded-2xl py-16 text-center">
                <svg className="w-10 h-10 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3-3-3z" />
                </svg>
                <p className="text-slate-400 text-sm mb-4">No prompts yet. Be the first!</p>
                <Link
                    href={`/create/prompt?problem=${problemSlug}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-semibold"
                >
                    Add the First Prompt
                </Link>
            </div>
        )
    }

    return (
        <>
            <div className="space-y-4">
                {prompts.map((prompt: any, index: number) => {
                    const s = prompt.prompt_stats?.[0] || {}
                    const works = s.works_count || 0
                    const fails = s.fails_count || 0
                    const score = s.quality_score || 0
                    const isForked = !!prompt.parent_prompt_id
                    const isSelected = selectedIds.includes(prompt.id)

                    return (
                        <div
                            key={prompt.id}
                            className={`bg-white border rounded-2xl overflow-hidden transition-all duration-150 ${isSelected
                                    ? 'border-blue-500 ring-1 ring-blue-500 shadow-md'
                                    : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                                }`}
                        >
                            {/* Card top bar */}
                            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-4">
                                    {/* Selection Checkbox */}
                                    <button
                                        onClick={() => toggleSelection(prompt.id)}
                                        className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-slate-300 hover:border-blue-400'
                                            }`}
                                    >
                                        {isSelected && (
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </button>

                                    <div className="flex items-center gap-3">
                                        {/* Rank badge */}
                                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${index === 0 ? 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-300' :
                                            index === 1 ? 'bg-slate-100 text-slate-600 ring-1 ring-slate-300' :
                                                index === 2 ? 'bg-orange-100 text-orange-700 ring-1 ring-orange-300' :
                                                    'bg-blue-50 text-blue-600'
                                            }`}>
                                            #{index + 1}
                                        </span>

                                        <div>
                                            <Link
                                                href={promptUrl({ id: prompt.id, slug: prompt.slug || '' })}
                                                className="text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                                            >
                                                {prompt.title}
                                            </Link>
                                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                {/* Type tags */}
                                                {isForked && (
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-orange-500 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded">
                                                        Fork
                                                    </span>
                                                )}
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                                    Prompt
                                                </span>
                                                <span className="text-xs text-slate-400">
                                                    {new Date(prompt.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                                {prompt.author && (
                                                    <span className="text-xs text-slate-400">
                                                        by <span className="text-slate-600 font-medium">{prompt.author.display_name || prompt.author.username}</span>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Works badge */}
                                <WorksBadge works={works} fails={fails} />
                            </div>

                            {/* Prompt preview */}
                            <div className="px-5 py-4">
                                {prompt.system_prompt && (
                                    <div className="bg-slate-50 border border-slate-200 rounded-md p-3 mb-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSelection(prompt.id)}>
                                        <p className="text-xs font-mono text-slate-600 line-clamp-3 leading-relaxed">
                                            {prompt.system_prompt}
                                        </p>
                                    </div>
                                )}

                                {/* Metrics row */}
                                <div className="flex items-center justify-between">
                                    <div className="grid grid-cols-4 gap-6">
                                        <div>
                                            <div className="text-xs text-slate-400 mb-0.5">Score</div>
                                            <div className="text-lg font-bold text-slate-900">{score}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-400 mb-0.5">Works</div>
                                            <div className="text-lg font-bold text-green-600">{works}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-400 mb-0.5">Fails</div>
                                            <div className="text-lg font-bold text-red-500">{fails}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-400 mb-0.5">Model</div>
                                            <div className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded font-mono mt-0.5 truncate max-w-[90px]">
                                                {prompt.model || '—'}
                                            </div>
                                        </div>
                                    </div>

                                    <Link
                                        href={promptUrl({ id: prompt.id, slug: prompt.slug || '' })}
                                        className="inline-flex items-center gap-1 px-4 py-2 text-xs font-semibold border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors ml-4 flex-shrink-0"
                                    >
                                        View Details
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            <CompareSelectionBar
                selectedPrompts={selectedIds}
                problemSlug={problemSlug}
                onClear={clearSelection}
            />
        </>
    )
}

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
        ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20'
        : rate >= 50
            ? 'text-amber-600 bg-amber-500/10 border-amber-500/20'
            : 'text-destructive bg-destructive/10 border-destructive/20'
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
            <div className="bg-card border border-dashed border-border rounded-2xl py-16 text-center">
                <svg className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3-3-3z" />
                </svg>
                <p className="text-muted-foreground text-sm mb-4">No prompts yet. Be the first!</p>
                <Link
                    href={`/create/prompt?problem=${problemSlug}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors text-sm font-semibold"
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
                            className={`bg-card border rounded-2xl overflow-hidden transition-all duration-150 ${isSelected
                                    ? 'border-primary ring-1 ring-primary shadow-md'
                                    : 'border-border hover:border-primary/50 hover:shadow-sm'
                                }`}
                        >
                            {/* Card top bar */}
                            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border">
                                <div className="flex items-center gap-4">
                                    {/* Selection Checkbox */}
                                    <button
                                        onClick={() => toggleSelection(prompt.id)}
                                        className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'bg-background border-input hover:border-primary'
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
                                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${index === 0 ? 'bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/30' :
                                            index === 1 ? 'bg-muted text-muted-foreground ring-1 ring-border' :
                                                index === 2 ? 'bg-orange-500/10 text-orange-600 ring-1 ring-orange-500/30' :
                                                    'bg-primary/10 text-primary'
                                            }`}>
                                            #{index + 1}
                                        </span>

                                        <div>
                                            <Link
                                                href={promptUrl({ id: prompt.id, slug: prompt.slug || '' })}
                                                className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
                                            >
                                                {prompt.title}
                                            </Link>
                                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                {/* Type tags */}
                                                {isForked && (
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.5 rounded">
                                                        Fork
                                                    </span>
                                                )}
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                    Prompt
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(prompt.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                                {prompt.author && (
                                                    <span className="text-xs text-muted-foreground">
                                                        by <span className="text-foreground font-medium">{prompt.author.display_name || prompt.author.username}</span>
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
                                    <div className="bg-muted/30 border border-border rounded-md p-3 mb-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => toggleSelection(prompt.id)}>
                                        <p className="text-xs font-mono text-muted-foreground line-clamp-3 leading-relaxed">
                                            {prompt.system_prompt}
                                        </p>
                                    </div>
                                )}

                                {/* Metrics row */}
                                <div className="flex items-center justify-between">
                                    <div className="grid grid-cols-4 gap-6">
                                        <div>
                                            <div className="text-xs text-muted-foreground mb-0.5">Score</div>
                                            <div className="text-lg font-bold text-foreground">{score}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-muted-foreground mb-0.5">Works</div>
                                            <div className="text-lg font-bold text-emerald-600">{works}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-muted-foreground mb-0.5">Fails</div>
                                            <div className="text-lg font-bold text-destructive">{fails}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-muted-foreground mb-0.5">Model</div>
                                            <div className="text-xs font-semibold text-foreground bg-muted px-2 py-1 rounded font-mono mt-0.5 truncate max-w-[90px]">
                                                {prompt.model || '-'}
                                            </div>
                                        </div>
                                    </div>

                                    <Link
                                        href={promptUrl({ id: prompt.id, slug: prompt.slug || '' })}
                                        className="inline-flex items-center gap-1 px-4 py-2 text-xs font-semibold border border-border rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:border-border transition-colors ml-4 flex-shrink-0"
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

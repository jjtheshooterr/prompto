'use client'

import { useState } from 'react'
import Link from 'next/link'
import { promptUrl } from '@/lib/utils/prompt-url'

interface Props {
    prompts: any[]
    onRemovePrompt?: (id: string) => void
}

export function SimplePromptComparison({ prompts, onRemovePrompt }: Props) {
    const [expandedPrompt, setExpandedPrompt] = useState<{ prompt: any; type: string; text: string } | null>(null)

    // Calculate badges
    const maxQuality = Math.max(...prompts.map(p => p.stats?.quality_score || p.stats?.ai_quality_score || 0))
    const maxReliability = Math.max(...prompts.map(p => {
        const stats = p.stats || {}
        const total = (stats.works_count || 0) + (stats.fails_count || 0)
        return total > 0 ? (stats.works_count || 0) / total : 0
    }))
    const maxForks = Math.max(...prompts.map(p => p.stats?.fork_count || 0))

    return (
        <>
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${prompts.length}, minmax(0, 1fr))` }}>
                {prompts.map((prompt, index) => {
                    const stats = prompt.stats || {}
                    
                    const works = stats.works_count || 0
                    const fails = stats.fails_count || 0
                    const score = stats.score || 0
                    const upvotes = stats.upvotes || 0
                    const downvotes = stats.downvotes || 0
                    const qualityScore = stats.quality_score || stats.ai_quality_score || 0
                    const forkCount = stats.fork_count || 0
                    const isFork = !!prompt.parent_prompt_id

                    // Calculate reliability
                    const total = works + fails
                    const reliability = total > 0 ? works / total : 0

                    // Determine badges
                    const isBestQuality = qualityScore > 0 && qualityScore === maxQuality && maxQuality > 0
                    const isMostReliable = reliability > 0 && reliability === maxReliability && maxReliability > 0 && total >= 2
                    const isMostForked = forkCount > 0 && forkCount === maxForks && maxForks > 0

                    return (
                        <div key={prompt.id} className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden flex flex-col">
                            {/* Top Badges */}
                            {(isBestQuality || isMostReliable || isMostForked) && (
                                <div className="px-5 pt-3 pb-2 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                    <div className="flex flex-wrap gap-1.5">
                                        {isBestQuality && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                                Best Quality
                                            </span>
                                        )}
                                        {isMostReliable && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Most Reliable
                                            </span>
                                        )}
                                        {isMostForked && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                                </svg>
                                                Most Forked
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                            
                            {/* Header */}
                            <div className="p-5 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
                                        Prompt {String.fromCharCode(65 + index)}
                                    </span>
                                    {onRemovePrompt && (
                                        <button
                                            onClick={() => onRemovePrompt(prompt.id)}
                                            className="text-slate-400 hover:text-red-600 transition-colors p-1"
                                            title="Remove from comparison"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 leading-tight mb-2">
                                    {prompt.title}
                                </h3>
                                <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                                    <span className="font-medium">{prompt.author?.display_name || prompt.author?.username || 'Anonymous'}</span>
                                    <span>•</span>
                                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono border border-slate-200">
                                        {prompt.model || 'No model'}
                                    </span>
                                </div>
                                {/* Fork lineage - softer styling */}
                                {isFork && (
                                    <div className="mt-2 pt-2 border-t border-slate-100">
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-orange-50 text-orange-600 border border-orange-100">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                                </svg>
                                                Forked
                                            </span>
                                            {prompt.depth > 0 && (
                                                <>
                                                    <span className="text-slate-300">•</span>
                                                    <span className="text-slate-500">Depth {prompt.depth}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Score Summary - Consistent format */}
                            <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                                <div className="flex items-center justify-between text-xs mb-2">
                                    <div className="flex items-center gap-3">
                                        <span className="text-slate-500">
                                            ↑ <span className="font-bold text-slate-700">{upvotes}</span>
                                        </span>
                                        <span className="text-slate-500">
                                            ↓ <span className="font-bold text-slate-700">{downvotes}</span>
                                        </span>
                                        <span className="text-slate-500">
                                            Score <span className="font-bold text-slate-900">{score}</span>
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-green-600 font-semibold">
                                            {works} Works
                                        </span>
                                        <span className="text-slate-300">•</span>
                                        <span className="text-red-500 font-semibold">
                                            {fails} Fails
                                        </span>
                                    </div>
                                </div>
                                {/* Quality score - always show, stronger bar */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-400 w-20">Quality:</span>
                                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all ${qualityScore > 0 ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500' : 'bg-slate-300'}`}
                                            style={{ width: `${qualityScore}%` }}
                                        />
                                    </div>
                                    <span className={`text-xs font-bold w-10 text-right ${qualityScore > 0 ? 'text-slate-900' : 'text-slate-400'}`}>
                                        {qualityScore || 0}
                                    </span>
                                </div>
                                {qualityScore === 0 && (
                                    <p className="text-xs text-slate-400 italic">Not AI scored yet</p>
                                )}
                            </div>

                            {/* Content - Tighter spacing for premium density */}
                            <div className="p-5 space-y-3 flex-grow">
                                {/* System Prompt - Always show */}
                                <div>
                                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                                        System Prompt
                                    </div>
                                    {prompt.system_prompt ? (
                                        <>
                                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                                                <p className="text-xs font-mono text-slate-700 leading-relaxed line-clamp-3">
                                                    {prompt.system_prompt}
                                                </p>
                                            </div>
                                            {prompt.system_prompt.length > 150 && (
                                                <button
                                                    onClick={() => setExpandedPrompt({ prompt, type: 'System Prompt', text: prompt.system_prompt })}
                                                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 mt-1.5 transition-colors"
                                                >
                                                    Show more →
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-sm text-slate-400 italic py-0.5">— Not provided</p>
                                    )}
                                </div>

                                {/* User Template - Always show */}
                                <div>
                                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                                        User Template
                                    </div>
                                    {prompt.user_prompt_template ? (
                                        <>
                                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                                                <p className="text-xs font-mono text-slate-700 leading-relaxed line-clamp-3">
                                                    {prompt.user_prompt_template}
                                                </p>
                                            </div>
                                            {prompt.user_prompt_template.length > 150 && (
                                                <button
                                                    onClick={() => setExpandedPrompt({ prompt, type: 'User Template', text: prompt.user_prompt_template })}
                                                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 mt-1.5 transition-colors"
                                                >
                                                    Show more →
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-sm text-slate-400 italic py-0.5">— Not provided</p>
                                    )}
                                </div>

                                {/* Improvement Summary - Always show */}
                                <div>
                                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                                        Improvement Summary
                                    </div>
                                    {prompt.improvement_summary ? (
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            {prompt.improvement_summary}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-slate-400 italic py-0.5">— Not provided</p>
                                    )}
                                </div>

                                {/* Best For - Always show */}
                                <div>
                                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                                        Best For
                                    </div>
                                    {prompt.best_for && prompt.best_for.length > 0 ? (
                                        <ul className="space-y-0.5">
                                            {prompt.best_for.map((item: string, i: number) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                                    <span className="text-green-500 mt-0.5">•</span>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-slate-400 italic py-0.5">— Not provided</p>
                                    )}
                                </div>

                                {/* Tradeoffs - Always show */}
                                <div>
                                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                                        Tradeoffs
                                    </div>
                                    {prompt.tradeoffs ? (
                                        <p className="text-sm text-slate-600 leading-relaxed italic">
                                            {prompt.tradeoffs}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-slate-400 italic py-0.5">— Not provided</p>
                                    )}
                                </div>

                                {/* Fix Summary - Always show */}
                                <div>
                                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                                        Fix Summary
                                    </div>
                                    {prompt.fix_summary ? (
                                        <p className="text-sm text-slate-600 leading-relaxed">
                                            {prompt.fix_summary}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-slate-400 italic py-0.5">— Not provided</p>
                                    )}
                                </div>

                                {/* Usage Context - Always show */}
                                <div>
                                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                                        Usage Context
                                    </div>
                                    {prompt.usage_context ? (
                                        <p className="text-sm text-slate-600 leading-relaxed">
                                            {prompt.usage_context}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-slate-400 italic py-0.5">— Not provided</p>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2">
                                <Link
                                    href={promptUrl({ id: prompt.id, slug: prompt.slug || '' })}
                                    className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors text-center"
                                >
                                    View Details
                                </Link>
                                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                                    Fork
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Expanded Prompt Modal */}
            {expandedPrompt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">{expandedPrompt.type}</h3>
                                <p className="text-sm font-medium text-slate-500 mt-0.5">{expandedPrompt.prompt.title}</p>
                            </div>
                            <button
                                onClick={() => setExpandedPrompt(null)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto bg-slate-50 grow">
                            <pre className="text-sm font-mono text-slate-700 whitespace-pre-wrap break-words">
                                {expandedPrompt.text}
                            </pre>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-100 shrink-0 bg-white rounded-b-2xl flex justify-end">
                            <button
                                onClick={() => setExpandedPrompt(null)}
                                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

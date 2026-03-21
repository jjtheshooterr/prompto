'use client'

import { useState } from 'react'
import Link from 'next/link'
import { calculateTokenCount, estimateCost, type AIModel } from '@/lib/utils/tokenizer'
import { promptUrl } from '@/lib/utils/prompt-url'

interface Props {
    prompts: any[];
}

export function PromptComparisonMatrix({ prompts }: Props) {
    const [expandedPrompt, setExpandedPrompt] = useState<any | null>(null)

    // Pre-calculate rows data
    const columns = prompts.map(p => {
        const s = p.prompt_stats?.[0] || {}
        const works = s.works_count || 0
        const fails = s.fails_count || 0
        const totalRuns = works + fails
        const successRate = totalRuns > 0 ? works / totalRuns : null

        const totalText = (p.system_prompt || '') + '\n' + (p.user_prompt_template || '')
        const avgTokens = calculateTokenCount(totalText)
        const costPerRun = estimateCost(avgTokens, 0, p.model || '').totalCost
        const costPerSuccess = successRate && successRate > 0 ? costPerRun / successRate : null

        return {
            prompt: p,
            stats: s,
            computed: {
                successRate, works, fails,
                avgTokens, costPerRun, costPerSuccess
            }
        }
    })

    const formatCost = (c: number | null) => c !== null ? `$${c.toFixed(5)}` : '-'
    const formatRate = (r: number | null) => r !== null ? `${Math.round(r * 100)}%` : '-'
    const formatNum = (n: number | null | undefined) => n !== null && n !== undefined ? n.toLocaleString() : '0'
    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

    const trClass = "border-b border-slate-100 last:border-none hover:bg-slate-50 transition-colors"
    const tdLabelClass = "py-4 px-6 text-sm font-semibold text-slate-700 bg-slate-50/50 w-48 shrink-0 align-top"
    const tdValueClass = "py-4 px-6 text-sm text-slate-800 border-l border-slate-100 min-w-[280px] align-top"
    const sectionHeaderClass = "bg-slate-100/80 px-6 py-2 text-xs font-bold uppercase tracking-wider text-slate-500"

    return (
        <div className="overflow-x-auto w-full pb-4">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr>
                        <th className="py-5 px-6 bg-white w-48 shrink-0 z-10">
                            {/* Empty corner */}
                        </th>
                        {columns.map(({ prompt }, i) => (
                            <th key={prompt.id} className="py-5 px-6 bg-white border-l border-slate-100 min-w-[280px] z-10 align-top">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-600">
                                        Option {i + 1}
                                    </span>
                                    <Link href={promptUrl({ id: prompt.id, slug: prompt.slug })} className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors">
                                        View full &rarr;
                                    </Link>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 leading-snug">{prompt.title}</h3>
                                <p className="text-sm font-medium text-slate-500 mt-1">by {prompt.author?.display_name || prompt.author?.username}</p>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>

                    {/* ── PERFORMANCE ── */}
                    <tr><td colSpan={columns.length + 1} className={sectionHeaderClass}>Performance</td></tr>
                    <tr className={trClass}>
                        <td className={tdLabelClass}>AI Quality Score</td>
                        {columns.map(c => <td key={c.prompt.id} className={tdValueClass}><span className="font-bold text-lg">{c.stats.quality_score || '-'}</span></td>)}
                    </tr>
                    <tr className={trClass}>
                        <td className={tdLabelClass}>Success Rate</td>
                        {columns.map(c => <td key={c.prompt.id} className={tdValueClass}><span className="font-semibold">{formatRate(c.computed.successRate)}</span></td>)}
                    </tr>
                    <tr className={trClass}>
                        <td className={tdLabelClass}>Works / Fails</td>
                        {columns.map(c => (
                            <td key={c.prompt.id} className={tdValueClass}>
                                <span className="text-green-600 font-medium">{c.computed.works} W</span>
                                <span className="mx-1 text-slate-300">/</span>
                                <span className="text-red-500 font-medium">{c.computed.fails} F</span>
                            </td>
                        ))}
                    </tr>

                    {/* ── EFFICIENCY ── */}
                    <tr><td colSpan={columns.length + 1} className={sectionHeaderClass}>Efficiency</td></tr>
                    <tr className={trClass}>
                        <td className={tdLabelClass}>Avg Total Tokens</td>
                        {columns.map(c => <td key={c.prompt.id} className={tdValueClass}>{formatNum(c.computed.avgTokens)}</td>)}
                    </tr>
                    <tr className={trClass}>
                        <td className={tdLabelClass}>Avg Cost / Run</td>
                        {columns.map(c => <td key={c.prompt.id} className={tdValueClass}>{formatCost(c.computed.costPerRun)}</td>)}
                    </tr>
                    <tr className={trClass}>
                        <td className={tdLabelClass}>Cost / Successful Run</td>
                        {columns.map(c => <td key={c.prompt.id} className={tdValueClass}><span className="font-semibold text-emerald-700">{formatCost(c.computed.costPerSuccess)}</span></td>)}
                    </tr>

                    {/* ── ADOPTION ── */}
                    <tr><td colSpan={columns.length + 1} className={sectionHeaderClass}>Adoption</td></tr>
                    <tr className={trClass}>
                        <td className={tdLabelClass}>Community Score</td>
                        {columns.map(c => <td key={c.prompt.id} className={tdValueClass}>{c.stats.score || '0'}</td>)}
                    </tr>
                    <tr className={trClass}>
                        <td className={tdLabelClass}>Copies / Forks</td>
                        {columns.map(c => <td key={c.prompt.id} className={tdValueClass}>{formatNum(c.stats.copy_count)} / {formatNum(c.stats.fork_count)}</td>)}
                    </tr>
                    <tr className={trClass}>
                        <td className={tdLabelClass}>Views</td>
                        {columns.map(c => <td key={c.prompt.id} className={tdValueClass}>{formatNum(c.stats.view_count)}</td>)}
                    </tr>

                    {/* ── METADATA ── */}
                    <tr><td colSpan={columns.length + 1} className={sectionHeaderClass}>Metadata</td></tr>
                    <tr className={trClass}>
                        <td className={tdLabelClass}>Target Model</td>
                        {columns.map(c => (
                            <td key={c.prompt.id} className={tdValueClass}>
                                <span className="bg-slate-100 text-slate-700 px-2 py-1 flex items-center w-max rounded text-xs font-mono border border-slate-200">{c.prompt.model || '-'}</span>
                            </td>
                        ))}
                    </tr>
                    <tr className={trClass}>
                        <td className={tdLabelClass}>Created</td>
                        {columns.map(c => <td key={c.prompt.id} className={tdValueClass}>{formatDate(c.prompt.created_at)}</td>)}
                    </tr>

                    {/* ── PROMPT PREVIEWS ── */}
                    <tr><td colSpan={columns.length + 1} className={sectionHeaderClass}>Prompt Details</td></tr>
                    <tr className={trClass}>
                        <td className={tdLabelClass}>System Prompt</td>
                        {columns.map(c => (
                            <td key={c.prompt.id} className={tdValueClass}>
                                <div className="relative">
                                    <div className="text-xs font-mono text-slate-600 leading-relaxed line-clamp-4 bg-slate-50 p-3 rounded border border-slate-200">
                                        {c.prompt.system_prompt || <span className="italic text-slate-400">Empty</span>}
                                    </div>
                                    {c.prompt.system_prompt && c.prompt.system_prompt.length > 150 && (
                                        <button
                                            onClick={() => setExpandedPrompt({ p: c.prompt, type: 'System Prompt', text: c.prompt.system_prompt })}
                                            className="text-xs font-bold text-blue-600 mt-2 hover:text-blue-800 transition-colors"
                                        >
                                            Expand Full Prompt &rarr;
                                        </button>
                                    )}
                                </div>
                            </td>
                        ))}
                    </tr>
                    <tr className={trClass}>
                        <td className={tdLabelClass}>User Template</td>
                        {columns.map(c => (
                            <td key={c.prompt.id} className={tdValueClass}>
                                <div className="relative">
                                    <div className="text-xs font-mono text-slate-600 leading-relaxed line-clamp-3 bg-slate-50 p-3 rounded border border-slate-200">
                                        {c.prompt.user_prompt_template || <span className="italic text-slate-400">Empty</span>}
                                    </div>
                                    {c.prompt.user_prompt_template && c.prompt.user_prompt_template.length > 100 && (
                                        <button
                                            onClick={() => setExpandedPrompt({ p: c.prompt, type: 'User Template', text: c.prompt.user_prompt_template })}
                                            className="text-xs font-bold text-blue-600 mt-2 hover:text-blue-800 transition-colors"
                                        >
                                            Expand Full Template &rarr;
                                        </button>
                                    )}
                                </div>
                            </td>
                        ))}
                    </tr>

                </tbody>
            </table>

            {/* Expanded Prompt Modal */}
            {expandedPrompt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-[0_20px_60px_rgb(0,0,0,0.2)]">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">{expandedPrompt.type}</h3>
                                <p className="text-sm font-medium text-slate-500 mt-0.5">{expandedPrompt.p.title}</p>
                            </div>
                            <button
                                onClick={() => setExpandedPrompt(null)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto bg-slate-50 grow">
                            <pre className="text-sm font-mono text-slate-700 whitespace-pre-wrap word-break">
                                {expandedPrompt.text}
                            </pre>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-100 shrink-0 bg-white rounded-b-2xl flex justify-end">
                            <button
                                onClick={() => setExpandedPrompt(null)}
                                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors"
                            >
                                Close details
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

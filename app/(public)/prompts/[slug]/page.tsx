'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import ForkModal from '@/components/prompts/ForkModal'
import ForkLineage from '@/components/prompts/ForkLineage'
import ReportModal from '@/components/moderation/ReportModal'
import PromptReviewForm from '@/components/prompts/PromptReviewForm'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { promptUrl, problemUrl, extractDbSlug } from '@/lib/utils/prompt-url'
import { TokenCostBadge } from '@/components/prompts/TokenCostBadge'

type Tab = 'system' | 'template' | 'example' | 'lineage'

export default function PromptDetailPage() {
    const params = useParams()
    const router = useRouter()
    const slugParam = params.slug as string

    const [prompt, setPrompt] = useState<any>(null)
    const [userVote, setUserVote] = useState<number | null>(null)
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)
    const [showForkModal, setShowForkModal] = useState(false)
    const [showReportModal, setShowReportModal] = useState(false)
    const [reviews, setReviews] = useState<any[]>([])
    const [activeTab, setActiveTab] = useState<Tab>('system')
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        const init = async () => {
            // Resolve stored DB slug from URL param (strips trailing -XXXXXXXX shortId)
            const { dbSlug, shortId, isFullUuid } = extractDbSlug(slugParam)

            const supabase = createClient()
            const { data: { user: currentUser } } = await supabase.auth.getUser()
            setUser(currentUser)

            let promptData = null

            if (isFullUuid) {
                // Legacy: full UUID in URL → redirect to canonical
                const { data } = await supabase.from('prompts').select('*, author:profiles!created_by(id, username, display_name, avatar_url)').eq('id', slugParam).single()
                promptData = data
            } else {
                // Multiple prompts can have the same slug. Fetch them all and filter by shortId 
                // to avoid 406 Not Acceptable from .single()
                const { data } = await supabase.from('prompts').select('*, author:profiles!created_by(id, username, display_name, avatar_url)').eq('slug', dbSlug)

                if (data && data.length > 0) {
                    if (shortId) {
                        promptData = data.find((p: any) => p.id.startsWith(shortId)) || data[0]
                    } else {
                        promptData = data[0]
                    }
                }
            }

            if (!promptData) { setNotFound(true); setLoading(false); return }

            // Canonical redirect: if slug in URL doesn't match, redirect
            const canonical = promptUrl({ slug: promptData.slug, id: promptData.id })
            if (typeof window !== 'undefined' && window.location.pathname !== canonical) {
                router.replace(canonical)
                return
            }

            // Fetch related data
            let problemData = null
            if (promptData.problem_id) {
                const { data: problem } = await supabase
                    .from('problems')
                    .select('id, title, slug')
                    .eq('id', promptData.problem_id)
                    .single()
                problemData = problem
            }

            const { data: statsData } = await supabase
                .from('prompt_stats')
                .select('*')
                .eq('prompt_id', promptData.id)
                .single()

            promptData.prompt_stats = [statsData || {
                upvotes: 0, downvotes: 0, score: 0,
                copy_count: 0, view_count: 0, fork_count: 0,
                works_count: 0, fails_count: 0, reviews_count: 0,
            }]
            promptData.problems = problemData
            setPrompt(promptData)

            const { data: recentReviews } = await supabase
                .from('prompt_reviews')
                .select('*')
                .eq('prompt_id', promptData.id)
                .order('created_at', { ascending: false })
                .limit(8)
            if (recentReviews) setReviews(recentReviews)

            if (currentUser) {
                const { data: voteData } = await supabase
                    .from('votes').select('value')
                    .eq('prompt_id', promptData.id)
                    .eq('user_id', currentUser.id)
                    .maybeSingle()
                setUserVote(voteData?.value || null)
            }

            setLoading(false)
        }
        init()
    }, [slugParam, router])

    const promptId = prompt?.id

    const loadData = async () => {
        if (!promptId) return
        const supabase = createClient()
        const { data: statsData } = await supabase
            .from('prompt_stats').select('*').eq('prompt_id', promptId).single()
        if (statsData && prompt) {
            setPrompt((p: any) => ({ ...p, prompt_stats: [statsData] }))
        }
        const { data: recentReviews } = await supabase
            .from('prompt_reviews').select('*')
            .eq('prompt_id', promptId).order('created_at', { ascending: false }).limit(8)
        if (recentReviews) setReviews(recentReviews)
    }

    const handleVote = async (value: 1 | -1) => {
        if (!user) { toast('Please log in to vote'); return }
        try {
            const supabase = createClient()
            if (userVote === value) {
                await supabase.from('votes').delete().eq('prompt_id', promptId).eq('user_id', user.id)
                setUserVote(null)
            } else {
                const { data: existingVote } = await supabase.from('votes').select('*')
                    .eq('prompt_id', promptId).eq('user_id', user.id).maybeSingle()
                if (existingVote) {
                    await supabase.from('votes').update({ value }).eq('prompt_id', promptId).eq('user_id', user.id)
                } else {
                    await supabase.from('votes').insert({ prompt_id: promptId, user_id: user.id, value })
                }
                setUserVote(value)
            }
            setTimeout(() => loadData(), 500)
        } catch { toast.error('Vote failed') }
    }

    const handleCopy = async () => {
        const text = `${prompt.system_prompt || ''}\n\n${prompt.user_prompt_template || ''}`
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        if (user) {
            const supabase = createClient()
            try { await supabase.rpc('increment_prompt_copies', { prompt_id: promptId }) } catch { }
        }
        toast('Prompt copied to clipboard')
    }

    const handleAddToCompare = () => {
        const selected = JSON.parse(localStorage.getItem('comparePrompts') || '[]')
        if (!selected.includes(promptId)) {
            selected.push(promptId)
            localStorage.setItem('comparePrompts', JSON.stringify(selected))
            window.dispatchEvent(new CustomEvent('compareUpdated'))
            toast.success(`Added to comparison (${selected.length} total)`, {
                action: { label: 'View Comparison', onClick: () => window.location.href = '/compare' }
            })
        } else {
            toast('Already in comparison')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="space-y-3 w-full max-w-4xl px-6">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        )
    }

    if (notFound || !prompt) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <p className="text-slate-500">Prompt not found.</p>
            </div>
        )
    }

    const stats = prompt.prompt_stats?.[0] || {
        upvotes: 0, downvotes: 0, quality_score: 0,
        copy_count: 0, view_count: 0, fork_count: 0,
        works_count: 0, fails_count: 0, reviews_count: 0,
    }

    const totalReviews = (stats.works_count || 0) + (stats.fails_count || 0)
    const successRate = totalReviews > 0
        ? Math.round((stats.works_count / totalReviews) * 100)
        : null

    const qualityScore = stats.quality_score || 0

    const tabs: { id: Tab; label: string }[] = [
        { id: 'system', label: 'System Prompt' },
        { id: 'template', label: 'User Template' },
        { id: 'example', label: 'Execution Example' },
        { id: 'lineage', label: 'Prompt Lineage' },
    ]

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-slate-400 mb-5">
                    <Link href="/problems" className="hover:text-slate-600 transition-colors">Problems</Link>
                    {prompt.problems && (
                        <>
                            <span>/</span>
                            <Link href={problemUrl(prompt.problems)} className="hover:text-slate-600 transition-colors">
                                {prompt.problems.title}
                            </Link>
                        </>
                    )}
                    <span>/</span>
                    <span className="text-slate-600 font-medium truncate max-w-xs">{prompt.title}</span>
                </div>

                {/* Page Header */}
                <div className="flex items-start justify-between gap-4 mb-8">
                    <div className="min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-2xl font-bold text-slate-900">{prompt.title}</h1>
                            {prompt.model && (
                                <span className="px-2 py-0.5 text-xs font-semibold rounded border border-slate-200 text-slate-500 bg-slate-50">
                                    {prompt.model}
                                </span>
                            )}
                            <TokenCostBadge 
                                systemPrompt={prompt.system_prompt} 
                                userPromptTemplate={prompt.user_prompt_template} 
                                exampleOutput={prompt.example_output}
                                model={prompt.model} 
                            />
                            {prompt.depth > 0 && (
                                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-700 border border-blue-200">
                                    v{prompt.depth + 1}
                                </span>
                            )}
                            {prompt.status === 'draft' && (
                                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-yellow-100 text-yellow-700 border border-yellow-200">
                                    Draft
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            {prompt.author && (
                                <div className="flex items-center gap-2 text-sm">
                                    {prompt.author.avatar_url ? (
                                        <img src={prompt.author.avatar_url} alt="author" className="w-5 h-5 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-5 h-5 bg-blue-100 text-blue-700 font-bold flex items-center justify-center rounded-full text-[10px]">
                                            {(prompt.author.display_name || prompt.author.username || 'U')[0].toUpperCase()}
                                        </div>
                                    )}
                                    <span className="text-slate-500">by</span>
                                    {prompt.author.username ? (
                                        <Link href={`/u/${prompt.author.username}`} className="font-medium text-slate-700 hover:text-blue-600 transition-colors">
                                            {prompt.author.display_name || prompt.author.username}
                                        </Link>
                                    ) : (
                                        <span className="font-medium text-slate-700">{prompt.author.display_name}</span>
                                    )}
                                </div>
                            )}
                            {prompt.author && <span className="text-slate-300">•</span>}
                            <p className="text-sm text-slate-400">
                                Created {new Date(prompt.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        {user && (
                            <div className="flex items-center gap-1 border border-slate-200 rounded-lg overflow-hidden">
                                <button
                                    onClick={() => handleVote(1)}
                                    className={`px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1 ${userVote === 1 ? 'bg-green-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                                    {stats.upvotes}
                                </button>
                                <div className="w-px h-6 bg-slate-200" />
                                <button
                                    onClick={() => handleVote(-1)}
                                    className={`px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1 ${userVote === -1 ? 'bg-red-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    {stats.downvotes}
                                </button>
                            </div>
                        )}
                        <button onClick={handleCopy} className="px-3 py-1.5 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600">
                            {copied ? '✓ Copied' : 'Copy'}
                        </button>
                        <button onClick={handleAddToCompare} className="px-3 py-1.5 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600">
                            Compare
                        </button>
                        <button onClick={() => setShowReportModal(true)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-slate-50">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                        </button>
                    </div>
                </div>

                {/* Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="border border-slate-200 rounded-xl p-5 bg-white relative group">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Quality Score</span>
                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        </div>
                        <div className="text-4xl font-bold text-slate-900">{qualityScore}<span className="text-lg font-normal text-slate-400">/100</span></div>
                        <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${qualityScore}%` }} />
                        </div>
                        <p className="text-xs text-slate-400 mt-2 hover:text-blue-600 transition-colors cursor-help">Hover for breakdown</p>
                        
                        {/* Tooltip Breakdown */}
                        <div className="absolute top-[80%] left-0 mt-2 w-64 bg-slate-900 border border-slate-800 text-white p-3 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 text-sm">
                            <div className="flex justify-between mb-1">
                                <span className="text-slate-300">Structure</span>
                                <span className="font-semibold text-blue-400">{stats.structure_score || 0}/70</span>
                            </div>
                            <div className="flex justify-between mb-1">
                                <span className="text-slate-300">AI Evaluation</span>
                                <span className="font-semibold text-purple-400">{stats.ai_quality_score || 0}/30</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-slate-700 mt-2">
                                <span className="text-slate-400 text-xs">Community Impact</span>
                                <span className="text-slate-400 text-xs text-right truncate pl-2 max-w-[130px]" title="Dynamic Weighting dynamically shifts the final quality score progressively towards community votes over time.">Dynamic Weights</span>
                            </div>
                        </div>
                    </div>

                    <div className="border border-slate-200 rounded-xl p-5 bg-white">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Success Rate</span>
                            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div className="text-4xl font-bold text-slate-900">{successRate !== null ? `${successRate}%` : '—'}</div>
                        {successRate !== null && (
                            <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 rounded-full" style={{ width: `${successRate}%` }} />
                            </div>
                        )}
                        <p className="text-xs text-slate-400 mt-2">{totalReviews > 0 ? `${totalReviews} instance${totalReviews !== 1 ? 's' : ''}` : 'No tests yet'}</p>
                    </div>

                    <div className="border border-slate-200 rounded-xl p-5 bg-white">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pass / Fail</span>
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        </div>
                        <div className="flex items-end gap-4 mb-3">
                            <div><span className="text-3xl font-bold text-green-600">{stats.works_count || 0}</span><span className="text-xs text-green-600 ml-1 font-medium">Works</span></div>
                            <div><span className="text-3xl font-bold text-red-500">{stats.fails_count || 0}</span><span className="text-xs text-red-500 ml-1 font-medium">Fail</span></div>
                        </div>
                        {totalReviews > 0 && (
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                                <div className="h-full bg-green-500" style={{ width: `${(stats.works_count / totalReviews) * 100}%` }} />
                                <div className="h-full bg-red-400" style={{ width: `${(stats.fails_count / totalReviews) * 100}%` }} />
                            </div>
                        )}
                        <p className="text-xs text-slate-400 mt-2">{stats.view_count || 0} views · {stats.fork_count || 0} forks</p>
                    </div>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">

                        {/* Tabs */}
                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                            <div className="flex border-b border-slate-200 bg-slate-50">
                                {tabs.map((tab) => (
                                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                        className={`px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id ? 'text-blue-600 border-b-2 border-blue-600 bg-white -mb-px' : 'text-slate-500 hover:text-slate-700'}`}>
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                            <div className="p-5">
                                {activeTab === 'system' && (
                                    <div>
                                        {prompt.system_prompt ? (
                                            <div className="relative group">
                                                <pre className="whitespace-pre-wrap font-mono text-sm text-slate-700 bg-slate-50 rounded-lg p-4 leading-relaxed border border-slate-100 max-h-[480px] overflow-y-auto">{prompt.system_prompt}</pre>
                                                <button onClick={handleCopy} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 text-xs bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-50">{copied ? '✓' : 'Copy'}</button>
                                            </div>
                                        ) : <p className="text-slate-400 italic text-sm">No system prompt provided.</p>}
                                        {(prompt.usage_context || prompt.tradeoffs) && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                                                {prompt.usage_context && (
                                                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                                                        <p className="text-xs font-semibold uppercase tracking-wider text-blue-500 mb-1">Usage Context</p>
                                                        <p className="text-sm text-blue-900">{prompt.usage_context}</p>
                                                    </div>
                                                )}
                                                {prompt.tradeoffs && (
                                                    <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                                                        <p className="text-xs font-semibold uppercase tracking-wider text-purple-500 mb-1">Tradeoffs</p>
                                                        <p className="text-sm text-purple-900">{prompt.tradeoffs}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {activeTab === 'template' && (
                                    <div>
                                        {prompt.user_prompt_template
                                            ? <pre className="whitespace-pre-wrap font-mono text-sm text-slate-700 bg-slate-50 rounded-lg p-4 leading-relaxed border border-slate-100 max-h-[480px] overflow-y-auto">{prompt.user_prompt_template}</pre>
                                            : <p className="text-slate-400 italic text-sm">No user template provided.</p>}
                                        {prompt.notes && (
                                            <div className="mt-4 bg-amber-50 border border-amber-100 rounded-lg p-4">
                                                <p className="text-xs font-semibold uppercase tracking-wider text-amber-500 mb-1">Notes</p>
                                                <p className="text-sm text-amber-900">{prompt.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {activeTab === 'example' && (
                                    <div>
                                        {(prompt.example_input || prompt.example_output) ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2"><span className="w-2 h-2 rounded-full bg-slate-400 inline-block" /><span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Input</span></div>
                                                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 min-h-[120px]">
                                                        <pre className="whitespace-pre-wrap font-mono text-xs text-slate-700">{typeof prompt.example_input === 'string' ? prompt.example_input : JSON.stringify(prompt.example_input, null, 2)}</pre>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /><span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Output</span></div>
                                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 min-h-[120px]">
                                                        <pre className="whitespace-pre-wrap font-mono text-xs text-green-900">{typeof prompt.example_output === 'string' ? prompt.example_output : JSON.stringify(prompt.example_output, null, 2)}</pre>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : <p className="text-slate-400 italic text-sm">No execution example provided.</p>}
                                    </div>
                                )}
                                {activeTab === 'lineage' && (
                                    <div>
                                        {prompt.parent_prompt_id && prompt.fix_summary && (
                                            <div className="mb-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
                                                <p className="text-xs font-semibold uppercase tracking-wider text-orange-500 mb-1">Fork Summary</p>
                                                <p className="text-sm text-orange-900">{prompt.fix_summary}</p>
                                            </div>
                                        )}
                                        <ForkLineage promptId={promptId} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Reviews */}
                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                                <h3 className="font-semibold text-slate-900">Feedback</h3>
                                <span className="text-xs text-slate-400">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
                            </div>
                            {reviews.length > 0 && (
                                <div className="divide-y divide-slate-100">
                                    {reviews.map((review) => (
                                        <div key={review.id} className="px-5 py-4">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border ${review.review_type === 'worked' ? 'bg-green-50 text-green-700 border-green-200' : review.review_type === 'failed' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                                    {review.review_type === 'worked'
                                                        ? <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg> Worked</>
                                                        : review.review_type === 'failed'
                                                            ? <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg> Failed</>
                                                            : <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg> Note</>}
                                                </span>
                                                <span className="text-xs text-slate-400">{new Date(review.created_at).toLocaleDateString()}</span>
                                            </div>
                                            {(review.worked_reason || review.failure_reason || review.comment) && (
                                                <p className="text-sm text-slate-600 leading-relaxed">{review.worked_reason || review.failure_reason || review.comment}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="px-5 py-4 bg-slate-50 border-t border-slate-100">
                                <PromptReviewForm promptId={promptId} onSuccess={() => { toast.success('Review added!'); loadData() }} />
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-5">
                        <div className="border border-slate-200 rounded-xl p-5 bg-white">
                            <h3 className="font-semibold text-slate-900 mb-1">Run or Save</h3>
                            <p className="text-sm text-slate-400 mb-4">Fork this prompt to edit and test it in your own workspace.</p>
                            {user ? (
                                <button onClick={() => setShowForkModal(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors">
                                    Fork &amp; Edit
                                </button>
                            ) : (
                                <Link href="/login" className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors">
                                    Sign in to Fork
                                </Link>
                            )}
                            <button onClick={handleCopy} className="w-full mt-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-sm py-2.5 rounded-lg transition-colors">
                                {copied ? '✓ Copied!' : 'Copy Prompt Text'}
                            </button>
                        </div>

                        <div className="border border-slate-200 rounded-xl p-5 bg-white">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Statistics</h3>
                            <div className="space-y-3">
                                {[
                                    { label: 'Views', value: stats.view_count || 0, icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> },
                                    { label: 'Copies', value: stats.copy_count || 0, icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> },
                                    { label: 'Forks', value: stats.fork_count || 0, icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" /></svg> },
                                    { label: 'Score', value: stats.quality_score || 0, icon: <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg> },
                                ].map(({ label, value, icon }) => (
                                    <div key={label} className="flex items-center justify-between">
                                        <span className="text-sm text-slate-500 flex items-center gap-1.5">{icon} {label}</span>
                                        <span className="text-sm font-semibold text-slate-900">{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {(prompt.model || prompt.params) && (
                            <div className="border border-slate-200 rounded-xl p-5 bg-white">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Model</h3>
                                {prompt.model && (
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm text-slate-500">Model</span>
                                        <span className="text-sm font-semibold text-slate-900">{prompt.model}</span>
                                    </div>
                                )}
                                {prompt.params && Object.keys(prompt.params).length > 0 && (
                                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                        <pre className="text-xs text-slate-600 font-mono">{JSON.stringify(prompt.params, null, 2)}</pre>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="border border-slate-200 rounded-xl p-5 bg-white">
                            <h3 className="font-semibold text-slate-900 mb-1 text-sm">Compare Prompts</h3>
                            <p className="text-xs text-slate-400 mb-3">Add to comparison list to evaluate side-by-side.</p>
                            <button onClick={handleAddToCompare} className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-sm py-2 rounded-lg transition-colors">
                                + Add to Compare
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <ForkModal
                isOpen={showForkModal}
                onClose={() => setShowForkModal(false)}
                promptId={promptId}
                onSuccess={(newPromptId) => {
                    // After fork, we need to load the new prompt to build its URL
                    // Redirect to the new prompt's edit page using the UUID (edit route stays as-is)
                    router.push(`/prompts/${newPromptId}/edit`)
                }}
            />
            <ReportModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                contentType="prompt"
                contentId={promptId}
                contentTitle={prompt.title}
            />
        </div>
    )
}

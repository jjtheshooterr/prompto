'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { extractDbSlug, promptUrl } from '@/lib/utils/prompt-url'

export default function EditPromptPage() {
    const params = useParams()
    const router = useRouter()
    // The route param is now [slug] (e.g. "my-prompt-title-21218e6e" or a full UUID)
    // We extract the short_id and look up by it
    const slugParam = params.slug as string

    const [promptId, setPromptId] = useState<string>('')
    const [prompt, setPrompt] = useState<any>(null)
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        system_prompt: '',
        user_prompt_template: '',
        model: 'gpt-4',
        params: '{}',
        example_input: '',
        example_output: '',
        notes: '',
        status: 'draft',
        tradeoffs: '',
        usage_context: '',
        improvement_summary: '',
        fix_summary: ''
    })

    useEffect(() => {
        const loadData = async () => {
            const supabase = createClient()

            const { data: { user: currentUser } } = await supabase.auth.getUser()
            setUser(currentUser)

            if (!currentUser) {
                router.push('/login')
                return
            }

            // Support both full UUID (legacy links) and slug-shortId format
            const isFullUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugParam)
            let query = supabase.from('prompts').select('*').eq('created_by', currentUser.id)

            if (isFullUuid) {
                query = query.eq('id', slugParam)
            } else {
                const { dbSlug } = extractDbSlug(slugParam)
                query = query.eq('slug', dbSlug)
            }

            const { data: promptData } = await query.single()

            if (!promptData) {
                router.push('/dashboard')
                return
            }

            setPromptId(promptData.id)
            setPrompt(promptData)
            setFormData({
                title: promptData.title || '',
                system_prompt: promptData.system_prompt || '',
                user_prompt_template: promptData.user_prompt_template || '',
                model: promptData.model || 'gpt-4',
                params: JSON.stringify(promptData.params || {}, null, 2),
                example_input: promptData.example_input || '',
                example_output: promptData.example_output || '',
                notes: promptData.notes || '',
                status: promptData.status || 'draft',
                tradeoffs: promptData.tradeoffs || '',
                usage_context: promptData.usage_context || '',
                improvement_summary: promptData.improvement_summary || '',
                fix_summary: promptData.fix_summary || ''
            })

            setLoading(false)
        }

        loadData()
    }, [slugParam, router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            const supabase = createClient()

            const { data: { user }, error: authError } = await supabase.auth.getUser()
            if (authError || !user) {
                alert('You must be logged in to update prompts')
                return
            }

            let parsedParams = {}
            try {
                parsedParams = formData.params ? JSON.parse(formData.params) : {}
            } catch (e) {
                alert('Invalid JSON in params field')
                return
            }

            const { data, error } = await supabase
                .from('prompts')
                .update({
                    title: formData.title,
                    system_prompt: formData.system_prompt,
                    user_prompt_template: formData.user_prompt_template,
                    model: formData.model,
                    params: parsedParams,
                    example_input: formData.example_input,
                    example_output: formData.example_output,
                    notes: formData.notes,
                    status: formData.status,
                    tradeoffs: formData.tradeoffs,
                    usage_context: formData.usage_context,
                    improvement_summary: formData.improvement_summary,
                    fix_summary: formData.fix_summary,
                    updated_at: new Date().toISOString()
                })
                .eq('id', promptId)
                .eq('created_by', user.id)
                .select()
                .single()

            if (error) {
                alert(`Failed to update prompt: ${error.message}`)
                return
            }

            router.push(promptUrl({ id: promptId, slug: data?.slug || formData.title.toLowerCase().replace(/\s+/g, '-') }))
        } catch (error) {
            alert('Failed to update prompt. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    const handlePublish = async () => {
        const updatedFormData = { ...formData, status: 'published' }
        setFormData(updatedFormData)

        setSaving(true)
        try {
            const supabase = createClient()

            const { data: { user }, error: authError } = await supabase.auth.getUser()
            if (authError || !user) {
                alert('You must be logged in to publish prompts')
                return
            }

            let parsedParams = {}
            try {
                parsedParams = updatedFormData.params ? JSON.parse(updatedFormData.params) : {}
            } catch (e) {
                alert('Invalid JSON in params field')
                return
            }

            const { error } = await supabase
                .from('prompts')
                .update({
                    title: updatedFormData.title,
                    system_prompt: updatedFormData.system_prompt,
                    user_prompt_template: updatedFormData.user_prompt_template,
                    model: updatedFormData.model,
                    params: parsedParams,
                    example_input: updatedFormData.example_input,
                    example_output: updatedFormData.example_output,
                    notes: updatedFormData.notes,
                    status: 'published',
                    tradeoffs: updatedFormData.tradeoffs,
                    usage_context: updatedFormData.usage_context,
                    improvement_summary: updatedFormData.improvement_summary,
                    fix_summary: updatedFormData.fix_summary,
                    updated_at: new Date().toISOString()
                })
                .eq('id', promptId)
                .eq('created_by', user.id)

            if (error) {
                alert(`Failed to publish prompt: ${error.message}`)
                return
            }

            router.push(promptUrl({ id: promptId, slug: prompt?.slug || '' }))
        } catch (error) {
            alert('Failed to publish prompt. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">Loading...</div>
            </div>
        )
    }

    if (!prompt) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">Prompt not found or access denied</div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Edit Prompt</h1>
                        {prompt.parent_prompt_id && (
                            <p className="text-muted-foreground mt-2">Editing fork of original prompt</p>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-4 py-2 border border-border rounded-lg hover:bg-muted"
                        >
                            Cancel
                        </button>
                        {formData.status === 'draft' && (
                            <button
                                type="button"
                                onClick={handlePublish}
                                disabled={saving}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                                {saving ? 'Publishing...' : 'Publish'}
                            </button>
                        )}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">Title *</label>
                        <input type="text" id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary" required />
                    </div>

                    <div>
                        <label htmlFor="system_prompt" className="block text-sm font-medium text-foreground mb-2">System Prompt *</label>
                        <textarea id="system_prompt" value={formData.system_prompt} onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })} className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary h-32" required />
                    </div>

                    <div>
                        <label htmlFor="user_prompt_template" className="block text-sm font-medium text-foreground mb-2">User Prompt Template *</label>
                        <textarea id="user_prompt_template" value={formData.user_prompt_template} onChange={(e) => setFormData({ ...formData, user_prompt_template: e.target.value })} className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary h-32" required />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="model" className="block text-sm font-medium text-foreground mb-2">Model</label>
                            <select id="model" value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                                <option value="gpt-5.2">GPT-5.2</option>
                                <option value="gpt-4o">GPT-4o</option>
                                <option value="claude-opus-4.5">Claude Opus 4.5</option>
                                <option value="claude-sonnet-4.5">Claude Sonnet 4.5</option>
                                <option value="gemini-3-pro">Gemini 3 Pro</option>
                                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                                <option value="grok-4">Grok 4</option>
                                <option value="llama-4-maverick">Llama 4 Maverick</option>
                                <option value="mistral-large-2">Mistral Large 2</option>
                                <option value="mixtral-8x22b">Mixtral 8x22B</option>
                                <option value="command-r-plus">Command-R+</option>
                                <option value="qwen3-max">Qwen3 Max</option>
                                <option value="deepseek-v3">DeepSeek V3</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="params" className="block text-sm font-medium text-foreground mb-2">Parameters (JSON)</label>
                            <textarea id="params" value={formData.params} onChange={(e) => setFormData({ ...formData, params: e.target.value })} className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary h-20 font-mono text-sm" placeholder='{"temperature": 0.7}' />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="example_input" className="block text-sm font-medium text-foreground mb-2">Example Input</label>
                            <textarea id="example_input" value={formData.example_input} onChange={(e) => setFormData({ ...formData, example_input: e.target.value })} className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary h-24" />
                        </div>
                        <div>
                            <label htmlFor="example_output" className="block text-sm font-medium text-foreground mb-2">Example Output</label>
                            <textarea id="example_output" value={formData.example_output} onChange={(e) => setFormData({ ...formData, example_output: e.target.value })} className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary h-24" />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-foreground mb-2">Notes</label>
                        <textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary h-20" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="usage_context" className="block text-sm font-medium text-foreground mb-2">Usage Context</label>
                            <textarea id="usage_context" value={formData.usage_context} onChange={(e) => setFormData({ ...formData, usage_context: e.target.value })} className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary h-24 font-mono text-sm" />
                        </div>
                        <div>
                            <label htmlFor="tradeoffs" className="block text-sm font-medium text-foreground mb-2">Tradeoffs</label>
                            <textarea id="tradeoffs" value={formData.tradeoffs} onChange={(e) => setFormData({ ...formData, tradeoffs: e.target.value })} className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary h-24 font-mono text-sm" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="improvement_summary" className="block text-sm font-medium text-foreground mb-2">Improvement Summary *</label>
                            <textarea id="improvement_summary" value={formData.improvement_summary} onChange={(e) => setFormData({ ...formData, improvement_summary: e.target.value })} className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary h-24 font-mono text-sm" required />
                        </div>
                        {prompt.parent_prompt_id && (
                            <div>
                                <label htmlFor="fix_summary" className="block text-sm font-medium text-foreground mb-2">Fix Summary * (Required for forks)</label>
                                <textarea id="fix_summary" value={formData.fix_summary} onChange={(e) => setFormData({ ...formData, fix_summary: e.target.value })} className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary h-24 font-mono text-sm" required />
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end">
                        <button type="submit" disabled={saving} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50">
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

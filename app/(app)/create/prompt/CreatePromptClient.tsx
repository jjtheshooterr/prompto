'use client'

import { useRouter } from 'next/navigation'
import { promptUrl } from '@/lib/utils/prompt-url'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers'

interface CreatePromptClientProps {
  user: any
  problemId: string
}

export default function CreatePromptClient({ user, problemId }: CreatePromptClientProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [paramsError, setParamsError] = useState('')
  const [structureScore, setStructureScore] = useState(0)
  const { user: contextUser } = useAuth()

  const handleFormChange = (e: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData(e.currentTarget)
    let score = 0
    const sp = formData.get('system_prompt') as string || ''
    const up = formData.get('user_prompt_template') as string || ''
    const ei = formData.get('example_input') as string || ''
    const eo = formData.get('example_output') as string || ''
    const uc = formData.get('usage_context') as string || ''
    const tr = formData.get('tradeoffs') as string || ''
    const md = formData.get('model') as string || ''

    if (sp.trim().length > 20) score += 10
    if (up.trim().length > 20) score += 8
    if (ei.trim() !== '') score += 6
    if (eo.trim() !== '') score += 6
    if (uc.trim().length > 10) score += 8
    if (tr.trim().length > 10) score += 7
    if (md.trim() !== '') score += 5

    setStructureScore(score)
  }

  const validateParams = (params: string) => {
    if (!params || !params.trim()) {
      setParamsError('')
      return true
    }

    try {
      JSON.parse(params)
      setParamsError('')
      return true
    } catch (e) {
      setParamsError('Invalid JSON syntax')
      return false
    }
  }

  async function handleSubmit(formData: FormData) {
    setSubmitting(true)
    try {
      // Create prompt directly from client instead of using server action
      const supabase = createClient()

      // Double-check authentication via context
      if (!contextUser) {
        throw new Error('Please log in again')
      }

      const title = formData.get('title') as string
      const systemPrompt = formData.get('system_prompt') as string
      const userPromptTemplate = formData.get('user_prompt_template') as string
      const model = formData.get('model') as string
      const params = formData.get('params') as string
      const exampleInput = formData.get('example_input') as string
      const exampleOutput = formData.get('example_output') as string
      const status = 'published' // Default to published, hidden from UI
      const tradeoffs = formData.get('tradeoffs') as string
      const usage_context = formData.get('usage_context') as string

      let parsedParams = {}
      if (params && params.trim()) {
        try {
          parsedParams = JSON.parse(params)
        } catch (e) {
          throw new Error('Invalid JSON in params field. Please check your JSON syntax.')
        }
      }

      // Get or create user's workspace and ensure membership
      let { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', user.id)
        .single()

      if (!workspace) {
        // Create workspace if it doesn't exist
        const workspaceSlug = `user-${user.id.replace(/-/g, '')}`

        const { data: newWorkspace, error: workspaceError } = await supabase
          .from('workspaces')
          .insert({
            name: `${user.email}'s Workspace`,
            slug: workspaceSlug,
            owner_id: user.id
          })
          .select('id')
          .single()

        if (workspaceError) {
          throw new Error(`Failed to create workspace: ${workspaceError.message}`)
        }

        // Add user as workspace member
        await supabase
          .from('workspace_members')
          .insert({
            workspace_id: newWorkspace.id,
            user_id: user.id,
            role: 'owner'
          })

        workspace = newWorkspace
      } else {
        // Ensure user is a member of their workspace
        const { data: membership } = await supabase
          .from('workspace_members')
          .select('*')
          .eq('workspace_id', workspace.id)
          .eq('user_id', user.id)
          .single()

        if (!membership) {
          // Add user as workspace member if not already
          await supabase
            .from('workspace_members')
            .insert({
              workspace_id: workspace.id,
              user_id: user.id,
              role: 'owner'
            })
        }
      }

      // Attempt insert with retry on slug collision
      let prompt: any = null
      let insertError: any = null
      for (let attempt = 0; attempt < 3; attempt++) {
        const attemptSlug = title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 50) + '-' + Math.random().toString(36).substring(2, 8)

        const { data: inserted, error: err } = await supabase
          .from('prompts')
          .insert({
            problem_id: problemId,
            title,
            slug: attemptSlug,
            system_prompt: systemPrompt,
            user_prompt_template: userPromptTemplate,
            model,
            params: parsedParams,
            example_input: exampleInput,
            example_output: exampleOutput,
            status,
            tradeoffs,
            usage_context,
            visibility: 'public',
            is_listed: true,
            created_by: user.id,
            workspace_id: workspace.id
          })
          .select()
          .single()

        if (!err) {
          prompt = inserted
          break
        }
        // 23505 = unique_violation (slug collision), retry
        if (err.code !== '23505') {
          insertError = err
          break
        }
      }

      if (insertError) {
        throw new Error(`Failed to create prompt: ${insertError.message}`)
      }
      if (!prompt) {
        throw new Error('Failed to generate a unique slug after 3 attempts. Please try again.')
      }

      // Stats are now auto-created by database trigger

      // Fire-and-forget background job to generate the AI Quality Score
      fetch('/api/jobs/score-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptId: prompt.id }),
      }).catch(err => console.error('Failed to trigger AI score:', err))

      router.push(promptUrl(prompt))
    } catch (error) {
      console.error('Failed to create prompt:', error)
      alert(`Failed to create prompt: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Create New Prompt</h1>
        <p className="text-muted-foreground">
          Add your prompt solution to help solve this problem.
        </p>
      </div>

      <form action={handleSubmit} onChange={handleFormChange} className="space-y-6">
        <input type="hidden" name="problem_id" value={problemId} />

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
            Prompt Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="e.g., SQL Query Generator v2.1"
          />
        </div>

        <div>
          <label htmlFor="model" className="block text-sm font-medium text-foreground mb-2">
            AI Model *
          </label>
          <select
            id="model"
            name="model"
            required
            className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="">Select a model</option>
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
          <label htmlFor="system_prompt" className="block text-sm font-medium text-foreground mb-2">
            System Prompt *
          </label>
          <textarea
            id="system_prompt"
            name="system_prompt"
            required
            rows={6}
            className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary font-mono text-sm"
            placeholder="You are an expert SQL developer. Your task is to convert natural language questions into accurate SQL queries..."
          />
          <p className="text-sm text-muted-foreground mt-1">
            The system message that sets the AI&apos;s role and behavior.
          </p>
        </div>

        <div>
          <label htmlFor="user_prompt_template" className="block text-sm font-medium text-foreground mb-2">
            User Prompt Template *
          </label>
          <textarea
            id="user_prompt_template"
            name="user_prompt_template"
            required
            rows={4}
            className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary font-mono text-sm"
            placeholder="Convert this question to SQL: {question}&#10;&#10;Database schema: {schema}&#10;&#10;SQL Query:"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Template for user input. Use {'{variable}'} for placeholders.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="example_input" className="block text-sm font-medium text-foreground mb-2">
              Example Input
            </label>
            <textarea
              id="example_input"
              name="example_input"
              rows={4}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary font-mono text-sm"
              placeholder="Show me all customers who made purchases in the last 30 days"
            />
          </div>

          <div>
            <label htmlFor="example_output" className="block text-sm font-medium text-foreground mb-2">
              Example Output
            </label>
            <textarea
              id="example_output"
              name="example_output"
              rows={4}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary font-mono text-sm"
              placeholder="SELECT DISTINCT c.* FROM customers c JOIN orders o ON c.id = o.customer_id WHERE o.created_at >= NOW() - INTERVAL 30 DAY;"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="usage_context" className="block text-sm font-medium text-foreground mb-2">
              Usage Context
            </label>
            <textarea
              id="usage_context"
              name="usage_context"
              rows={3}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary font-mono text-sm"
              placeholder="e.g. Best used in background asynchronous jobs where latency is not an issue."
            />
          </div>

          <div>
            <label htmlFor="tradeoffs" className="block text-sm font-medium text-foreground mb-2">
              Tradeoffs
            </label>
            <textarea
              id="tradeoffs"
              name="tradeoffs"
              rows={3}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary font-mono text-sm"
              placeholder="e.g. High accuracy but uses complex regex matching that is slower."
            />
          </div>
        </div>

        <div>
          <label htmlFor="params" className="block text-sm font-medium text-foreground mb-2">
            Model Parameters (JSON)
          </label>
          <textarea
            id="params"
            name="params"
            rows={3}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary font-mono text-sm ${paramsError ? 'border-destructive' : 'border-border'
              }`}
            placeholder='{"temperature": 0.1, "max_tokens": 500, "top_p": 1}'
            onChange={(e) => validateParams(e.target.value)}
          />
          {paramsError && (
            <p className="text-sm text-destructive mt-1">{paramsError}</p>
          )}
          <p className="text-sm text-muted-foreground mt-1">
            Optional model parameters as valid JSON. Leave empty for defaults. Example: {`{"temperature": 0.1}`}
          </p>
        </div>



        <div className="bg-muted border border-border rounded-lg p-5 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Live Structure Score Preview</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Add more detail to your templates, usage context, and examples to boost your prompt&apos;s initial ranking.
              <br />
              {/* Removed AI note per user request */}
            </p>
          </div>
          <div className="text-3xl font-bold text-foreground pl-4 border-l border-border">
            {structureScore} <span className="text-lg text-muted-foreground font-normal">/ 50</span>
          </div>
        </div>

        <div className="flex gap-4 pt-6">
          <button
            type="submit"
            disabled={submitting || !!paramsError}
            className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating...' : 'Create Prompt'}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
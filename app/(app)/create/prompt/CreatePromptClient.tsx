'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface CreatePromptClientProps {
  user: any
  problemId: string
}

export default function CreatePromptClient({ user, problemId }: CreatePromptClientProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [paramsError, setParamsError] = useState('')

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

      // Double-check authentication
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
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

      console.log('Creating prompt with workspace:', workspace.id)

      const { data: prompt, error } = await supabase
        .from('prompts')
        .insert({
          problem_id: problemId,
          title,
          system_prompt: systemPrompt,
          user_prompt_template: userPromptTemplate,
          model,
          params: parsedParams,
          example_input: exampleInput,
          example_output: exampleOutput,
          status,
          visibility: 'public',
          is_listed: true,
          created_by: user.id,
          workspace_id: workspace.id // Use actual workspace ID
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create prompt: ${error.message}`)
      }

      // Create initial prompt_stats row
      await supabase
        .from('prompt_stats')
        .insert({
          prompt_id: prompt.id,
          upvotes: 0,
          downvotes: 0,
          score: 0
        })

      router.push(`/prompts/${prompt.id}`)
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
        <p className="text-gray-600">
          Add your prompt solution to help solve this problem.
        </p>
      </div>

      <form action={handleSubmit} className="space-y-6">
        <input type="hidden" name="problem_id" value={problemId} />

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Prompt Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., SQL Query Generator v2.1"
          />
        </div>

        <div>
          <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">
            AI Model *
          </label>
          <select
            id="model"
            name="model"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a model</option>
            <option value="gpt-4">GPT-4</option>
            <option value="gpt-4-turbo">GPT-4 Turbo</option>
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            <option value="claude-3-opus">Claude 3 Opus</option>
            <option value="claude-3-sonnet">Claude 3 Sonnet</option>
            <option value="claude-3-haiku">Claude 3 Haiku</option>
            <option value="gemini-pro">Gemini Pro</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="system_prompt" className="block text-sm font-medium text-gray-700 mb-2">
            System Prompt *
          </label>
          <textarea
            id="system_prompt"
            name="system_prompt"
            required
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            placeholder="You are an expert SQL developer. Your task is to convert natural language questions into accurate SQL queries..."
          />
          <p className="text-sm text-gray-500 mt-1">
            The system message that sets the AI's role and behavior.
          </p>
        </div>

        <div>
          <label htmlFor="user_prompt_template" className="block text-sm font-medium text-gray-700 mb-2">
            User Prompt Template *
          </label>
          <textarea
            id="user_prompt_template"
            name="user_prompt_template"
            required
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            placeholder="Convert this question to SQL: {question}&#10;&#10;Database schema: {schema}&#10;&#10;SQL Query:"
          />
          <p className="text-sm text-gray-500 mt-1">
            Template for user input. Use {'{variable}'} for placeholders.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="example_input" className="block text-sm font-medium text-gray-700 mb-2">
              Example Input
            </label>
            <textarea
              id="example_input"
              name="example_input"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              placeholder="Show me all customers who made purchases in the last 30 days"
            />
          </div>

          <div>
            <label htmlFor="example_output" className="block text-sm font-medium text-gray-700 mb-2">
              Example Output
            </label>
            <textarea
              id="example_output"
              name="example_output"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              placeholder="SELECT DISTINCT c.* FROM customers c JOIN orders o ON c.id = o.customer_id WHERE o.created_at >= NOW() - INTERVAL 30 DAY;"
            />
          </div>
        </div>

        <div>
          <label htmlFor="params" className="block text-sm font-medium text-gray-700 mb-2">
            Model Parameters (JSON)
          </label>
          <textarea
            id="params"
            name="params"
            rows={3}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm ${paramsError ? 'border-red-300' : 'border-gray-300'
              }`}
            placeholder='{"temperature": 0.1, "max_tokens": 500, "top_p": 1}'
            onChange={(e) => validateParams(e.target.value)}
          />
          {paramsError && (
            <p className="text-sm text-red-600 mt-1">{paramsError}</p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            Optional model parameters as valid JSON. Leave empty for defaults. Example: {`{"temperature": 0.1}`}
          </p>
        </div>



        <div className="flex gap-4 pt-6">
          <button
            type="submit"
            disabled={submitting || !!paramsError}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating...' : 'Create Prompt'}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
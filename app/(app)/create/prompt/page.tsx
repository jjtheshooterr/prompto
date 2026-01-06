'use client'

import { createPrompt } from '@/lib/actions/prompts.actions'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function CreatePromptPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const problemId = searchParams.get('problem')
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }
      
      setUser(user)
      setLoading(false)
    }

    checkAuth()
  }, [router])

  if (!problemId) {
    router.push('/problems')
    return null
  }

  async function handleSubmit(formData: FormData) {
    if (!user) {
      router.push('/login')
      return
    }

    setSubmitting(true)
    try {
      // Create prompt directly from client
      const supabase = createClient()
      
      // Double-check authentication
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const title = formData.get('title') as string
      const systemPrompt = formData.get('system_prompt') as string
      const userPromptTemplate = formData.get('user_prompt_template') as string
      const model = formData.get('model') as string
      const params = formData.get('params') as string
      const exampleInput = formData.get('example_input') as string
      const exampleOutput = formData.get('example_output') as string
      const status = formData.get('status') as string || 'production'

      // Get problem to get workspace_id
      const { data: problem } = await supabase
        .from('problems')
        .select('workspace_id')
        .eq('id', problemId)
        .single()

      let parsedParams = {}
      try {
        parsedParams = params ? JSON.parse(params) : {}
      } catch (e) {
        throw new Error('Invalid JSON in params field')
      }

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
          workspace_id: problem?.workspace_id
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            placeholder='{"temperature": 0.1, "max_tokens": 500, "top_p": 1}'
          />
          <p className="text-sm text-gray-500 mt-1">
            Optional model parameters as JSON. Leave empty for defaults.
          </p>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue="production"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="production">Production - Ready for use</option>
            <option value="draft">Draft - Still testing</option>
            <option value="experimental">Experimental - Early stage</option>
          </select>
        </div>

        <div className="flex gap-4 pt-6">
          <button
            type="submit"
            disabled={submitting}
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
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function EditPromptPage() {
  const params = useParams()
  const router = useRouter()
  const promptId = params.id as string

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
    status: 'draft'
  })

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()

      // Get user
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)

      if (!currentUser) {
        router.push('/login')
        return
      }

      // Get prompt
      const { data: promptData } = await supabase
        .from('prompts')
        .select('*')
        .eq('id', promptId)
        .eq('created_by', currentUser.id) // Only allow editing own prompts
        .single()

      if (!promptData) {
        router.push('/dashboard')
        return
      }

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
        status: promptData.status || 'draft'
      })

      setLoading(false)
    }

    loadData()
  }, [promptId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const supabase = createClient()

      // Get current user
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
          updated_at: new Date().toISOString()
        })
        .eq('id', promptId)
        .eq('created_by', user.id) // Only allow updating own prompts
        .select()
        .single()

      if (error) {
        console.error('Failed to update prompt:', error)
        alert(`Failed to update prompt: ${error.message}`)
        return
      }

      router.push(`/prompts/${promptId}`)
    } catch (error) {
      console.error('Failed to update prompt:', error)
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

      // Get current user
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
          updated_at: new Date().toISOString()
        })
        .eq('id', promptId)
        .eq('created_by', user.id)

      if (error) {
        console.error('Failed to publish prompt:', error)
        alert(`Failed to publish prompt: ${error.message}`)
        return
      }

      router.push(`/prompts/${promptId}`)
    } catch (error) {
      console.error('Failed to publish prompt:', error)
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
              <p className="text-gray-600 mt-2">
                Editing fork of original prompt
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
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
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* System Prompt */}
          <div>
            <label htmlFor="system_prompt" className="block text-sm font-medium text-gray-700 mb-2">
              System Prompt *
            </label>
            <textarea
              id="system_prompt"
              value={formData.system_prompt}
              onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
              required
            />
          </div>

          {/* User Prompt Template */}
          <div>
            <label htmlFor="user_prompt_template" className="block text-sm font-medium text-gray-700 mb-2">
              User Prompt Template *
            </label>
            <textarea
              id="user_prompt_template"
              value={formData.user_prompt_template}
              onChange={(e) => setFormData({ ...formData, user_prompt_template: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
              required
            />
          </div>

          {/* Model and Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">
                Model
              </label>
              <select
                id="model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="claude-3-opus">Claude 3 Opus</option>
                <option value="claude-3-sonnet">Claude 3 Sonnet</option>
              </select>
            </div>

            <div>
              <label htmlFor="params" className="block text-sm font-medium text-gray-700 mb-2">
                Parameters (JSON)
              </label>
              <textarea
                id="params"
                value={formData.params}
                onChange={(e) => setFormData({ ...formData, params: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 font-mono text-sm"
                placeholder='{"temperature": 0.7}'
              />
            </div>
          </div>

          {/* Example Input/Output */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="example_input" className="block text-sm font-medium text-gray-700 mb-2">
                Example Input
              </label>
              <textarea
                id="example_input"
                value={formData.example_input}
                onChange={(e) => setFormData({ ...formData, example_input: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
              />
            </div>

            <div>
              <label htmlFor="example_output" className="block text-sm font-medium text-gray-700 mb-2">
                Example Output
              </label>
              <textarea
                id="example_output"
                value={formData.example_output}
                onChange={(e) => setFormData({ ...formData, example_output: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
              placeholder="Additional notes about this prompt..."
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
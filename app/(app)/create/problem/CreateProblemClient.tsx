'use client'

import { createProblem } from '@/lib/actions/problems.actions'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface CreateProblemClientProps {
  user: any
}

export default function CreateProblemClient({ user }: CreateProblemClientProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(formData: FormData) {
    setSubmitting(true)
    try {
      const problem = await createProblem(formData)
      router.push(`/problems/${problem.slug}`)
    } catch (error) {
      console.error('Failed to create problem:', error)
      alert(`Failed to create problem: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Create New Problem</h1>
        <p className="text-gray-600">
          Define a coding problem that the community can solve with prompts.
        </p>
      </div>

      <form action={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Problem Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Generate SQL queries from natural language"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Describe the problem in detail. What should the AI accomplish? What are the constraints?"
          />
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
            Tags
          </label>
          <input
            type="text"
            id="tags"
            name="tags"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="sql, database, query, natural-language (comma-separated)"
          />
          <p className="text-sm text-gray-500 mt-1">
            Separate tags with commas. Use lowercase and hyphens for multi-word tags.
          </p>
        </div>

        <div>
          <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
            Industry *
          </label>
          <select
            id="industry"
            name="industry"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select an industry</option>
            <option value="dev">Development & Technology</option>
            <option value="marketing">Marketing</option>
            <option value="content">Content Creation</option>
            <option value="data">Data & Analytics</option>
            <option value="finance">Finance</option>
            <option value="healthcare">Healthcare</option>
            <option value="education">Education</option>
            <option value="legal">Legal</option>
            <option value="sales">Sales</option>
            <option value="support">Customer Support</option>
            <option value="hr">Human Resources</option>
            <option value="video">Video & Media</option>
          </select>
        </div>

        <div>
          <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 mb-2">
            Visibility
          </label>
          <select
            id="visibility"
            name="visibility"
            defaultValue="public"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="public">Public - Anyone can see and contribute</option>
            <option value="workspace">Workspace - Only workspace members</option>
            <option value="private">Private - Only you</option>
          </select>
        </div>

        <div className="flex gap-4 pt-6">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating...' : 'Create Problem'}
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
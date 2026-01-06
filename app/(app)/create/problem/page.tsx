'use client'

import { createProblem } from '@/lib/actions/problems.actions'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function CreateProblemPage() {
  const router = useRouter()
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

  async function handleSubmit(formData: FormData) {
    if (!user) {
      router.push('/login')
      return
    }

    setSubmitting(true)
    try {
      // Create problem directly from client
      const supabase = createClient()
      
      // Double-check authentication
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const title = formData.get('title') as string
      const description = formData.get('description') as string
      const tags = (formData.get('tags') as string).split(',').map(tag => tag.trim()).filter(Boolean)
      const industry = formData.get('industry') as string
      const visibility = formData.get('visibility') as string || 'public'

      // Create slug from title
      const slug = title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      // Get or create user's default workspace
      let { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', user.id)
        .single()

      if (!workspace) {
        // Generate a unique workspace slug
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
        
        workspace = newWorkspace
      }

      const { data: problem, error } = await supabase
        .from('problems')
        .insert({
          title,
          description,
          tags,
          industry,
          visibility,
          slug,
          is_listed: true,
          created_by: user.id,
          workspace_id: workspace?.id
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create problem: ${error.message}`)
      }

      router.push(`/problems/${problem.slug}`)
    } catch (error) {
      console.error('Failed to create problem:', error)
      alert(`Failed to create problem: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
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
            <option value="technology">Technology</option>
            <option value="finance">Finance</option>
            <option value="healthcare">Healthcare</option>
            <option value="education">Education</option>
            <option value="retail">Retail</option>
            <option value="manufacturing">Manufacturing</option>
            <option value="media">Media & Entertainment</option>
            <option value="government">Government</option>
            <option value="other">Other</option>
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
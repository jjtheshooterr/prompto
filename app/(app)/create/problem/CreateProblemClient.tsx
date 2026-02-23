'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ProblemInput, ProblemConstraint, ProblemSuccessCriterion } from '@/types/problems'
import { toast } from 'sonner'
import { useAuth } from '@/app/providers'

interface CreateProblemClientProps {
  user: any
}

export default function CreateProblemClient({ user }: CreateProblemClientProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const { user: contextUser } = useAuth()
  const [inputs, setInputs] = useState<ProblemInput[]>([
    { name: '', description: '', required: true }
  ])
  const [constraints, setConstraints] = useState<ProblemConstraint[]>([
    { rule: '', severity: 'hard' }
  ])
  const [successCriteria, setSuccessCriteria] = useState<ProblemSuccessCriterion[]>([
    { criterion: '' }
  ])

  const addInput = () => {
    setInputs([...inputs, { name: '', description: '', required: true }])
  }

  const removeInput = (index: number) => {
    if (inputs.length > 1) {
      setInputs(inputs.filter((_, i) => i !== index))
    }
  }

  const updateInput = (index: number, field: keyof ProblemInput, value: string | boolean) => {
    const updated = [...inputs]
    updated[index] = { ...updated[index], [field]: value }
    setInputs(updated)
  }

  const addConstraint = () => {
    setConstraints([...constraints, { rule: '', severity: 'hard' }])
  }

  const removeConstraint = (index: number) => {
    if (constraints.length > 1) {
      setConstraints(constraints.filter((_, i) => i !== index))
    }
  }

  const updateConstraint = (index: number, field: keyof ProblemConstraint, value: string) => {
    const updated = [...constraints]
    updated[index] = { ...updated[index], [field]: value }
    setConstraints(updated)
  }

  const addSuccessCriterion = () => {
    setSuccessCriteria([...successCriteria, { criterion: '' }])
  }

  const removeSuccessCriterion = (index: number) => {
    if (successCriteria.length > 1) {
      setSuccessCriteria(successCriteria.filter((_, i) => i !== index))
    }
  }

  const updateSuccessCriterion = (index: number, field: keyof ProblemSuccessCriterion, value: string) => {
    const updated = [...successCriteria]
    updated[index] = { ...updated[index], [field]: value }
    setSuccessCriteria(updated)
  }

  async function handleSubmit(formData: FormData) {
    setSubmitting(true)
    try {
      // Create problem directly from client instead of using server action
      const supabase = createClient()

      // Double-check authentication via context
      if (!contextUser) {
        throw new Error('Please log in again')
      }

      const title = formData.get('title') as string
      const description = formData.get('description') as string
      const goal = formData.get('goal') as string
      const tags = (formData.get('tags') as string)
        .split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(Boolean)
        .filter((tag, index, array) => array.indexOf(tag) === index) // Remove duplicates
      const industry = formData.get('industry') as string
      const visibility = formData.get('visibility') as string || 'public'

      // Filter out empty inputs, constraints, and criteria
      const validInputs = inputs.filter(input => input.name.trim() && input.description.trim())
      const validConstraints = constraints.filter(constraint => constraint.rule.trim())
      const validCriteria = successCriteria.filter(criterion => criterion.criterion.trim())

      // Create slug from title
      const slug = title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

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

      console.log('Creating problem with workspace:', workspace.id)

      const { data: problem, error } = await supabase
        .from('problems')
        .insert({
          title,
          description,
          goal: goal || null,
          inputs: validInputs.length > 0 ? validInputs : null,
          constraints: validConstraints.length > 0 ? validConstraints : null,
          success_criteria: validCriteria.length > 0 ? validCriteria : null,
          // tags handled via RPC below
          industry,
          visibility,
          slug,
          is_listed: true,
          created_by: user.id,
          owner_id: user.id, // Set owner_id for new visibility system
          workspace_id: workspace.id
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create problem: ${error.message}`)
      }

      // Sync tags using the new RPC
      if (tags && tags.length > 0) {
        const { error: tagError } = await supabase.rpc('manage_problem_tags', {
          p_problem_id: problem.id,
          p_tags: tags
        })

        if (tagError) {
          console.error('Failed to save tags:', tagError)
          // Don't block creation, but warn
          toast.error('Problem created but tags failed to save')
        }
      }

      // If creating a private problem, add the owner as a member
      if (visibility === 'private') {
        await supabase
          .from('problem_members')
          .insert({
            problem_id: problem.id,
            user_id: user.id,
            role: 'owner'
          })
      }

      router.push(`/problems/${problem.slug}`)
    } catch (error) {
      console.error('Failed to create problem:', error)
      toast.error(`Failed to create problem: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
          <label htmlFor="goal" className="block text-sm font-medium text-gray-700 mb-2">
            Goal <span className="text-gray-500">(recommended)</span>
          </label>
          <input
            type="text"
            id="goal"
            name="goal"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Convert plain-English questions into correct, efficient SQL queries that run successfully on the first attempt"
          />
          <p className="text-sm text-gray-500 mt-1">
            One clear sentence describing what success looks like.
          </p>
        </div>

        {/* Inputs Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Expected Inputs <span className="text-gray-500">(optional)</span>
            </label>
            <button
              type="button"
              onClick={addInput}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              + Add Input
            </button>
          </div>
          <div className="space-y-3">
            {inputs.map((input, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Input {index + 1}</span>
                  {inputs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeInput(index)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Input name (e.g., database_schema)"
                    value={input.name}
                    onChange={(e) => updateInput(index, 'name', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={input.description}
                    onChange={(e) => updateInput(index, 'description', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="mt-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={input.required}
                      onChange={(e) => updateInput(index, 'required', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600">Required</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Constraints Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Constraints <span className="text-gray-500">(optional)</span>
            </label>
            <button
              type="button"
              onClick={addConstraint}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              + Add Constraint
            </button>
          </div>
          <div className="space-y-3">
            {constraints.map((constraint, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Constraint {index + 1}</span>
                  {constraints.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeConstraint(index)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Rule (e.g., Do not use SELECT *)"
                    value={constraint.rule}
                    onChange={(e) => updateConstraint(index, 'rule', e.target.value)}
                    className="md:col-span-2 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <select
                    value={constraint.severity}
                    onChange={(e) => updateConstraint(index, 'severity', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="hard">Hard (Must follow)</option>
                    <option value="soft">Soft (Preferred)</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Success Criteria Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Success Criteria <span className="text-gray-500">(optional)</span>
            </label>
            <button
              type="button"
              onClick={addSuccessCriterion}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              + Add Criterion
            </button>
          </div>
          <div className="space-y-3">
            {successCriteria.map((criterion, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Criterion {index + 1}</span>
                  {successCriteria.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSuccessCriterion(index)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Success criterion (e.g., Query runs without errors)"
                    value={criterion.criterion}
                    onChange={(e) => updateSuccessCriterion(index, 'criterion', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={criterion.description || ''}
                    onChange={(e) => updateSuccessCriterion(index, 'description', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>
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
            onBlur={(e) => {
              // Clean up tags on blur
              const cleanTags = e.target.value
                .split(',')
                .map(tag => tag.trim().toLowerCase())
                .filter(Boolean)
                .filter((tag, index, array) => array.indexOf(tag) === index)
                .join(', ')
              e.target.value = cleanTags
            }}
          />
          <p className="text-sm text-gray-500 mt-1">
            Separate tags with commas. Duplicates will be automatically removed. Use lowercase and hyphens for multi-word tags.
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
            <option value="unlisted">Unlisted - Anyone with link can see and contribute</option>
            <option value="private">Private - Only you and invited members</option>
          </select>
          <p className="text-sm text-gray-500 mt-1">
            Public problems appear in browse and search. Unlisted problems are accessible via direct link. Private problems require explicit member invitations.
          </p>
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
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ForkModalProps {
  isOpen: boolean
  onClose: () => void
  promptId: string
  originalTitle: string
  onSuccess: (newPromptId: string) => void
}

export default function ForkModal({ 
  isOpen, 
  onClose, 
  promptId, 
  originalTitle, 
  onSuccess 
}: ForkModalProps) {
  const [newTitle, setNewTitle] = useState('')
  const [forkReason, setForkReason] = useState('')
  const [changesSummary, setChangesSummary] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newTitle.trim()) {
      alert('Please provide a title for your fork')
      return
    }
    
    if (!forkReason.trim()) {
      alert('Please provide a reason for forking (required)')
      return
    }

    setIsSubmitting(true)
    
    try {
      const supabase = createClient()
      
      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        alert('You must be logged in to fork prompts')
        return
      }

      // Get the parent prompt
      const { data: parentPrompt, error: fetchError } = await supabase
        .from('prompts')
        .select('*')
        .eq('id', promptId)
        .single()

      if (fetchError || !parentPrompt) {
        throw new Error('Parent prompt not found')
      }

      // Check if prompt is hidden/unlisted and user has access
      if (parentPrompt.is_hidden || !parentPrompt.is_listed) {
        const { data: membership } = await supabase
          .from('workspace_members')
          .select('role')
          .eq('workspace_id', parentPrompt.workspace_id)
          .eq('user_id', user.id)
          .single()

        if (!membership) {
          throw new Error('Cannot fork hidden or unlisted prompts')
        }
      }

      // Get user's workspace
      let { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', user.id)
        .single()

      if (!workspace) {
        throw new Error('User workspace not found')
      }

      // Prepare notes with attribution and changes summary
      const notesData = {
        forked_from: promptId,
        fork_reason: forkReason,
        changes_summary: changesSummary || null
      }
      const attributedNotes = `Forked from ${promptId}. ${forkReason}${changesSummary ? ` | Changes: ${changesSummary}` : ''}`

      // Create forked prompt
      const { data: forkedPrompt, error } = await supabase
        .from('prompts')
        .insert({
          workspace_id: workspace.id,
          problem_id: parentPrompt.problem_id,
          visibility: parentPrompt.visibility,
          title: newTitle,
          system_prompt: parentPrompt.system_prompt,
          user_prompt_template: parentPrompt.user_prompt_template,
          model: parentPrompt.model,
          params: parentPrompt.params,
          example_input: parentPrompt.example_input,
          example_output: parentPrompt.example_output,
          known_failures: parentPrompt.known_failures,
          notes: attributedNotes,
          parent_prompt_id: promptId,
          status: 'production', // Use production instead of draft for now
          is_listed: true,
          is_hidden: false,
          is_reported: false,
          report_count: 0,
          created_by: user.id
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to fork prompt: ${error.message}`)
      }

      // Create prompt_stats for forked prompt - skip if RLS blocks it
      try {
        await supabase
          .from('prompt_stats')
          .insert({
            prompt_id: forkedPrompt.id,
            upvotes: 0,
            downvotes: 0,
            score: 0,
            copy_count: 0,
            view_count: 0,
            fork_count: 0
          })
      } catch (statsError) {
        console.warn('Could not create prompt_stats (will be created by triggers):', statsError)
      }

      // Insert fork event
      await supabase
        .from('prompt_events')
        .insert({
          prompt_id: promptId,
          user_id: user.id,
          event_type: 'fork'
        })

      // Update fork count on parent using RPC function
      try {
        await supabase.rpc('increment_fork_count', { prompt_id: promptId })
      } catch (rpcError) {
        console.warn('RPC failed for fork count:', rpcError)
      }

      onSuccess(forkedPrompt.id)
      onClose()
    } catch (error) {
      console.error('Fork failed:', error)
      alert(`Failed to fork prompt: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4">Fork this prompt</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Fork Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g., Behavior-Driven Email Personalization"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Give your fork a clean, descriptive title
            </p>
          </div>

          <div>
            <label htmlFor="forkReason" className="block text-sm font-medium text-gray-700 mb-1">
              Why are you forking this? <span className="text-red-500">*</span>
            </label>
            <textarea
              id="forkReason"
              value={forkReason}
              onChange={(e) => setForkReason(e.target.value)}
              placeholder="e.g., To satisfy constraint #2, To improve success criterion #1, To handle edge case better..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Reference specific constraints or success criteria from the problem
            </p>
          </div>

          <div>
            <label htmlFor="changesSummary" className="block text-sm font-medium text-gray-700 mb-1">
              What will you change? <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              id="changesSummary"
              value={changesSummary}
              onChange={(e) => setChangesSummary(e.target.value)}
              placeholder="e.g., Updated system prompt with behavioral triggers, Added JSON schema validation, Simplified language for cheaper models..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Describe the specific changes you plan to make
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Forking...' : 'Fork Prompt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
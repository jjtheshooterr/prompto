'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useAuth } from '@/app/providers'
import { sanitizeSlug } from '@/lib/utils/slug'

interface ForkModalProps {
  isOpen: boolean
  onClose: () => void
  promptId: string
  onSuccess: (newPromptId: string) => void
}

export default function ForkModal({
  isOpen,
  onClose,
  promptId,
  onSuccess
}: ForkModalProps) {
  const [newTitle, setNewTitle] = useState('')
  const [forkReason, setForkReason] = useState('')
  const [changesSummary, setChangesSummary] = useState('')
  const [improvementSummary, setImprovementSummary] = useState('')
  const [bestFor, setBestFor] = useState('')
  const [visibility, setVisibility] = useState('public')
  const [slug, setSlug] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newTitle.trim()) {
      toast('Please provide a title for your fork')
      return
    }

    if (!forkReason.trim()) {
      toast('Please provide a reason for forking')
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient()

      // Check authentication
      if (!user) {
        toast('Please log in to fork prompts')
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

      // Check if prompt is hidden and user has access
      if (parentPrompt.is_hidden || !parentPrompt.is_listed) {
        const { data: membership } = await supabase
          .from('workspace_members')
          .select('role')
          .eq('workspace_id', parentPrompt.workspace_id)
          .eq('user_id', user.id)
          .single()

        if (!membership) {
          throw new Error('Cannot fork hidden prompts')
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
      const attributedNotes = `Forked from ${promptId}. ${forkReason}${changesSummary ? ` | Changes: ${changesSummary}` : ''}`

      // Insert with retry loop to handle slug collisions (UNIQUE(problem_id, slug))
      let forkedPrompt: any = null
      let insertError: any = null
      for (let attempt = 0; attempt < 3; attempt++) {
        // Use central utility + forceRandom for forked prompts to ensure uniqueness
        const attemptSlug = sanitizeSlug(newTitle, { forceRandom: true })

        const { data: inserted, error: err } = await supabase
          .from('prompts')
          .insert({
            workspace_id: workspace.id,
            problem_id: parentPrompt.problem_id,
            visibility: visibility,
            title: newTitle,
            slug: attemptSlug,
            system_prompt: parentPrompt.system_prompt,
            user_prompt_template: parentPrompt.user_prompt_template,
            model: parentPrompt.model,
            params: parentPrompt.params,
            example_input: parentPrompt.example_input,
            example_output: parentPrompt.example_output,
            known_failures: parentPrompt.known_failures,
            notes: attributedNotes,
            parent_prompt_id: promptId,
            status: 'published',
            is_listed: true,
            is_hidden: false,
            created_by: user.id,
            improvement_summary: improvementSummary || 'Development fork initially',
            fix_summary: changesSummary || 'Fork setup initial state',
            best_for: bestFor ? bestFor.split(',').map(tag => tag.trim()).filter(tag => tag) : null
          })
          .select()
          .single()

        if (!err) { forkedPrompt = inserted; break }
        if (err.code !== '23505') { insertError = err; break }
      }

      if (insertError) throw new Error(`Failed to fork prompt: ${insertError.message}`)
      if (!forkedPrompt) throw new Error('Slug collision after 3 attempts — please try again.')

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
      toast.error('Could not fork prompt')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card text-card-foreground border border-border shadow-lg rounded-lg p-6 w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200">
        <h2 className="text-xl font-bold mb-4">Fork this prompt</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-foreground mb-1">
              Fork Title <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={newTitle}
              onChange={(e) => {
                const val = e.target.value
                setNewTitle(val)
                setSlug(sanitizeSlug(val, { forceRandom: true }))
              }}
              placeholder="e.g., Behavior-Driven Email Personalization"
              className="w-full px-3 py-2 bg-background border border-border placeholder:text-muted-foreground text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              required
            />
            {newTitle && (
              <div className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 border border-primary/10 rounded-md ring-1 ring-primary/10">
                <span className="text-[10px] font-mono font-bold text-primary uppercase tracking-wider">URL Preview</span>
                <span className="text-xs text-muted-foreground font-mono truncate">
                  /p/<span className="text-primary font-bold">{slug}</span>
                </span>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Give your fork a clean, descriptive title
            </p>
          </div>

          <div>
            <label htmlFor="forkReason" className="block text-sm font-medium text-foreground mb-1">
              Why are you forking this? <span className="text-destructive">*</span>
            </label>
            <textarea
              id="forkReason"
              value={forkReason}
              onChange={(e) => setForkReason(e.target.value)}
              placeholder="e.g., To satisfy constraint #2, To improve success criterion #1, To handle edge case better..."
              className="w-full px-3 py-2 bg-background border border-border placeholder:text-muted-foreground text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary h-20 resize-none transition-all"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Reference specific constraints or success criteria from the problem
            </p>
          </div>

          <div>
            <label htmlFor="changesSummary" className="block text-sm font-medium text-foreground mb-1">
              What will you change? <span className="text-muted-foreground">(optional)</span>
            </label>
            <textarea
              id="changesSummary"
              value={changesSummary}
              onChange={(e) => setChangesSummary(e.target.value)}
              placeholder="e.g., Updated system prompt with behavioral triggers, Added JSON schema validation, Simplified language for cheaper models..."
              className="w-full px-3 py-2 bg-background border border-border placeholder:text-muted-foreground text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary h-20 resize-none transition-all"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Describe the specific changes you plan to make
            </p>
          </div>

          <div>
            <label htmlFor="improvementSummary" className="block text-sm font-medium text-foreground mb-1">
              How does this improve the original? <span className="text-muted-foreground">(optional)</span>
            </label>
            <textarea
              id="improvementSummary"
              value={improvementSummary}
              onChange={(e) => setImprovementSummary(e.target.value)}
              placeholder="e.g., Reduces hallucination by 30%, Better handles edge cases, More consistent output format..."
              className="w-full px-3 py-2 bg-background border border-border placeholder:text-muted-foreground text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary h-20 resize-none transition-all"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Explain the specific improvements this fork provides
            </p>
          </div>

          <div>
            <label htmlFor="bestFor" className="block text-sm font-medium text-foreground mb-1">
              Best for (tags) <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              type="text"
              id="bestFor"
              value={bestFor}
              onChange={(e) => setBestFor(e.target.value)}
              placeholder="e.g., beginners, complex data, creative writing, technical docs"
              className="w-full px-3 py-2 bg-background border border-border placeholder:text-muted-foreground text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Comma-separated tags describing what this prompt works best for
            </p>
          </div>

          <div>
            <label htmlFor="visibility" className="block text-sm font-medium text-foreground mb-1">
              Visibility
            </label>
            <select
              id="visibility"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              Public prompts are visible on your profile and on the problem page
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border text-foreground rounded-md hover:bg-accent transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
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
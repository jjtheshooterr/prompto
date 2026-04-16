'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toDisplayString } from '@/lib/utils/prompt-url'

interface Problem {
  id: string
  slug: string
  title: string
  description: string
  visibility: 'public' | 'private'
  created_at: string
  prompts?: any[]
  member_role?: string
}

interface ProblemCardProps {
  problem: Problem
  isOwner: boolean
  memberRole?: string
  onManageMembers?: () => void
}

export default function ProblemCard({ 
  problem, 
  isOwner, 
  memberRole,
  onManageMembers 
}: ProblemCardProps) {
  const [visibility, setVisibility] = useState(problem.visibility)
  const [updating, setUpdating] = useState(false)

  const handleVisibilityChange = async (newVisibility: 'public' | 'private') => {
    if (!isOwner) {
      console.log('Not owner, cannot change visibility')
      return
    }
    
    console.log('Changing visibility from', visibility, 'to', newVisibility)
    setUpdating(true)
    
    try {
      const supabase = createClient()
      
      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('Auth error:', authError)
        throw new Error('Must be authenticated')
      }

      console.log('User authenticated:', user.id)
      console.log('Updating problem:', problem.id)

      // Update visibility - RLS policy will check if user has owner/admin role
      const { data, error } = await supabase
        .from('problems')
        .update({ visibility: newVisibility })
        .eq('id', problem.id)
        .select()

      console.log('Update response:', { data, error })

      if (error) {
        console.error('Update error:', error)
        throw new Error(`Failed to update visibility: ${error.message}`)
      }

      if (!data || data.length === 0) {
        console.error('No data returned - RLS policy may have blocked the update')
        throw new Error('Update blocked - you may not have permission to modify this problem')
      }

      console.log('Successfully updated to:', data[0].visibility)
      setVisibility(newVisibility)
      alert('Visibility updated successfully!')
    } catch (error) {
      console.error('Failed to update visibility:', error)
      alert(`Failed to update visibility: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setUpdating(false)
    }
  }

  const getVisibilityColor = (vis: string) => {
    switch (vis) {
      case 'private': return 'bg-muted text-muted-foreground'
      default: return 'bg-primary/10 text-primary'
    }
  }

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
      case 'member': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
      case 'viewer': return 'bg-muted text-muted-foreground'
      default: return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
    }
  }

  const promptCount = problem.prompts?.length || 0

  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Link 
            href={`/problems/${problem.slug}`}
            className="text-lg font-semibold text-foreground hover:text-primary transition-colors"
          >
            {toDisplayString(problem.title)}
          </Link>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date(problem.created_at).toLocaleDateString()}
          </p>
        </div>
        
        <div className="flex flex-col gap-2 ml-4">
          <span className={`px-2 py-1 text-xs rounded font-medium ${getVisibilityColor(visibility)}`}>
            {visibility}
          </span>
          {!isOwner && memberRole && (
            <span className={`px-2 py-1 text-xs rounded font-medium ${getRoleColor(memberRole)}`}>
              {memberRole}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
        {toDisplayString(problem.description)}
      </p>

      {/* Stats */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground">
          {promptCount} prompt{promptCount !== 1 ? 's' : ''}
        </span>
        
        {isOwner && (
          <Link
            href={`/create/prompt?problem=${problem.id}`}
            className="text-sm text-primary hover:text-primary/80 font-medium"
          >
            Add Prompt
          </Link>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Link
          href={`/problems/${problem.slug}`}
          className="flex-1 px-3 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors text-center"
        >
          View Problem
        </Link>
        
        {isOwner && (
          <>
            {visibility === 'private' && onManageMembers && (
              <button
                onClick={onManageMembers}
                className="px-3 py-2 text-sm border border-border text-foreground rounded hover:bg-muted transition-colors"
              >
                Members
              </button>
            )}
          </>
        )}
      </div>

      {/* Visibility Controls for Owner */}
      {isOwner && (
        <div className="mt-4 pt-4 border-t border-border">
          <label className="block text-xs font-medium text-foreground mb-2">
            Visibility
          </label>
          <select
            value={visibility}
            onChange={(e) => handleVisibilityChange(e.target.value as any)}
            disabled={updating}
            className="w-full text-xs px-2 py-1 bg-background border border-border text-foreground rounded focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50"
          >
            <option value="private">Private - Workspace only</option>
          </select>
        </div>
      )}
    </div>
  )
}
'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Problem {
  id: string
  slug: string
  title: string
  description: string
  visibility: 'public' | 'unlisted' | 'private'
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

  const handleVisibilityChange = async (newVisibility: 'public' | 'unlisted' | 'private') => {
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
      case 'public': return 'bg-green-100 text-green-800'
      case 'unlisted': return 'bg-yellow-100 text-yellow-800'
      case 'private': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800'
      case 'member': return 'bg-blue-100 text-blue-800'
      case 'viewer': return 'bg-gray-100 text-gray-800'
      default: return 'bg-green-100 text-green-800'
    }
  }

  const promptCount = problem.prompts?.length || 0

  return (
    <div className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Link 
            href={`/problems/${problem.slug}`}
            className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
          >
            {problem.title}
          </Link>
          <p className="text-sm text-gray-500 mt-1">
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
      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
        {problem.description}
      </p>

      {/* Stats */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">
          {promptCount} prompt{promptCount !== 1 ? 's' : ''}
        </span>
        
        {isOwner && (
          <Link
            href={`/create/prompt?problem=${problem.id}`}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Add Prompt
          </Link>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Link
          href={`/problems/${problem.slug}`}
          className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-center"
        >
          View Problem
        </Link>
        
        {isOwner && (
          <>
            {visibility === 'private' && onManageMembers && (
              <button
                onClick={onManageMembers}
                className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
              >
                Members
              </button>
            )}
          </>
        )}
      </div>

      {/* Visibility Controls for Owner */}
      {isOwner && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Visibility
          </label>
          <select
            value={visibility}
            onChange={(e) => handleVisibilityChange(e.target.value as any)}
            disabled={updating}
            className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
          >
            <option value="public">Public - Anyone can see</option>
            <option value="unlisted">Unlisted - Link only</option>
            <option value="private">Private - Members only</option>
          </select>
        </div>
      )}
    </div>
  )
}
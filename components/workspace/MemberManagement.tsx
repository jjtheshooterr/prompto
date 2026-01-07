'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Member {
  id: string
  user_id: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  created_at: string
  profiles: {
    username: string | null
    display_name: string | null
  }
}

interface MemberManagementProps {
  problemId: string
  onClose: () => void
  onUpdate: () => void
}

export default function MemberManagement({ problemId, onClose, onUpdate }: MemberManagementProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberRole, setNewMemberRole] = useState<'admin' | 'member' | 'viewer'>('member')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    loadMembers()
  }, [problemId])

  const loadMembers = async () => {
    try {
      const supabase = createClient()
      
      // Get members first
      const { data: members, error: membersError } = await supabase
        .from('problem_members')
        .select('*')
        .eq('problem_id', problemId)
        .order('created_at', { ascending: false })

      if (membersError) {
        console.error('Error loading members:', membersError)
        return
      }

      // Get profiles for each member separately
      if (members && members.length > 0) {
        const userIds = members.map(m => m.user_id)
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, display_name')
          .in('id', userIds)

        if (profilesError) {
          console.error('Error loading profiles:', profilesError)
          setMembers(members) // Set members without profiles
          return
        }

        // Combine members with profiles
        const membersWithProfiles = members.map(member => ({
          ...member,
          profiles: profiles?.find(p => p.id === member.user_id) || null
        }))

        setMembers(membersWithProfiles)
      } else {
        setMembers([])
      }
    } catch (error) {
      console.error('Error loading members:', error)
    }
    setLoading(false)
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMemberEmail.trim()) return

    setAdding(true)
    try {
      const supabase = createClient()
      
      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error('Must be authenticated')
      }

      // Find user by email using our database function
      const { data: targetUserId, error: lookupError } = await supabase
        .rpc('get_user_id_by_email', { user_email: newMemberEmail.trim() })

      if (lookupError || !targetUserId) {
        throw new Error('User not found with that email address')
      }

      // Add member (RLS policy will handle permission check)
      const { error } = await supabase
        .from('problem_members')
        .insert({
          problem_id: problemId,
          user_id: targetUserId,
          role: newMemberRole
        })

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new Error('User is already a member of this problem')
        }
        throw new Error(`Failed to add member: ${error.message}`)
      }
      
      setNewMemberEmail('')
      setNewMemberRole('member')
      await loadMembers()
      onUpdate()
    } catch (error) {
      console.error('Error adding member:', error)
      alert(error instanceof Error ? error.message : 'Failed to add member')
    }
    setAdding(false)
  }

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return

    try {
      const supabase = createClient()
      
      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error('Must be authenticated')
      }

      // Remove member (RLS policy will handle permission check)
      const { error } = await supabase
        .from('problem_members')
        .delete()
        .eq('problem_id', problemId)
        .eq('user_id', userId)

      if (error) {
        throw new Error(`Failed to remove member: ${error.message}`)
      }

      await loadMembers()
      onUpdate()
    } catch (error) {
      console.error('Error removing member:', error)
      alert(error instanceof Error ? error.message : 'Failed to remove member')
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-green-100 text-green-800'
      case 'admin': return 'bg-purple-100 text-purple-800'
      case 'member': return 'bg-blue-100 text-blue-800'
      case 'viewer': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Manage Members</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Add Member Form */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-3">Add New Member</h3>
          <form onSubmit={handleAddMember} className="space-y-3">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                id="role"
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="viewer">Viewer - Can view only</option>
                <option value="member">Member - Can view and contribute</option>
                <option value="admin">Admin - Can manage members</option>
              </select>
            </div>
            
            <button
              type="submit"
              disabled={adding}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {adding ? 'Adding...' : 'Add Member'}
            </button>
          </form>
        </div>

        {/* Current Members */}
        <div>
          <h3 className="font-medium mb-3">Current Members ({members.length})</h3>
          
          {loading ? (
            <div className="text-center py-4">Loading members...</div>
          ) : members.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No members yet</div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">
                      {member.profiles.display_name || member.profiles.username || 'Unknown User'}
                    </div>
                    <div className="text-sm text-gray-500">
                      Added {new Date(member.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 text-xs rounded font-medium ${getRoleColor(member.role)}`}>
                      {member.role}
                    </span>
                    
                    {member.role !== 'owner' && (
                      <button
                        onClick={() => handleRemoveMember(member.user_id)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Role Descriptions */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Role Permissions</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <div><strong>Owner:</strong> Full control, cannot be removed</div>
            <div><strong>Admin:</strong> Can manage members and contribute</div>
            <div><strong>Member:</strong> Can view and contribute prompts</div>
            <div><strong>Viewer:</strong> Can only view content</div>
          </div>
        </div>
      </div>
    </div>
  )
}
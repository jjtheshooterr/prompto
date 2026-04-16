import { SupabaseClient } from '@supabase/supabase-js'

export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer'

export interface WorkspaceMembershipManager {
  addMember(workspaceId: string, userId: string, role: WorkspaceRole): Promise<void>
  removeMember(workspaceId: string, userId: string): Promise<void>
  updateRole(workspaceId: string, userId: string, role: WorkspaceRole): Promise<void>
  getRole(workspaceId: string, userId: string): Promise<WorkspaceRole | null>
  isMember(workspaceId: string, userId: string): Promise<boolean>
}

export class WorkspaceMembershipService implements WorkspaceMembershipManager {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Add a member to a workspace with the specified role
   * @throws Error if user is already a member or if validation fails
   */
  async addMember(workspaceId: string, userId: string, role: WorkspaceRole): Promise<void> {
    // Validate role
    this.validateRole(role)

    const { error } = await this.supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspaceId,
        user_id: userId,
        role,
      })

    if (error) {
      if (error.code === '23505') {
        throw new Error('User is already a member of this workspace')
      }
      throw new Error(`Failed to add workspace member: ${error.message}`)
    }
  }

  /**
   * Remove a member from a workspace
   * Cascades to remove all problem memberships in this workspace
   * @throws Error if attempting to remove the last owner
   */
  async removeMember(workspaceId: string, userId: string): Promise<void> {
    // Check if this is the last owner
    const { data: owners, error: ownerCheckError } = await this.supabase
      .from('workspace_members')
      .select('user_id')
      .eq('workspace_id', workspaceId)
      .eq('role', 'owner')

    if (ownerCheckError) {
      throw new Error(`Failed to check workspace owners: ${ownerCheckError.message}`)
    }

    // If this user is an owner and they're the only owner, prevent removal
    const isOwner = owners?.some(owner => owner.user_id === userId)
    if (isOwner && owners?.length === 1) {
      throw new Error('Cannot remove the last owner from workspace')
    }

    // Get all problem IDs in this workspace
    const { data: problems, error: problemsError } = await this.supabase
      .from('problems')
      .select('id')
      .eq('workspace_id', workspaceId)

    if (problemsError) {
      throw new Error(`Failed to get workspace problems: ${problemsError.message}`)
    }

    // Remove problem memberships first (cascade)
    if (problems && problems.length > 0) {
      const problemIds = problems.map(p => p.id)
      const { error: problemMembersError } = await this.supabase
        .from('problem_members')
        .delete()
        .eq('user_id', userId)
        .in('problem_id', problemIds)

      if (problemMembersError) {
        throw new Error(`Failed to remove problem memberships: ${problemMembersError.message}`)
      }
    }

    // Remove workspace membership
    const { error } = await this.supabase
      .from('workspace_members')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to remove workspace member: ${error.message}`)
    }
  }

  /**
   * Update a member's role in a workspace
   * @throws Error if attempting to promote to owner without proper permissions
   * @throws Error if attempting to remove the last owner
   */
  async updateRole(workspaceId: string, userId: string, role: WorkspaceRole): Promise<void> {
    // Validate role
    this.validateRole(role)

    // Get current role
    const currentRole = await this.getRole(workspaceId, userId)
    
    if (!currentRole) {
      throw new Error('User is not a member of this workspace')
    }

    // If downgrading from owner, check if they're the last owner
    if (currentRole === 'owner' && role !== 'owner') {
      const { data: owners, error: ownerCheckError } = await this.supabase
        .from('workspace_members')
        .select('user_id')
        .eq('workspace_id', workspaceId)
        .eq('role', 'owner')

      if (ownerCheckError) {
        throw new Error(`Failed to check workspace owners: ${ownerCheckError.message}`)
      }

      if (owners?.length === 1) {
        throw new Error('Cannot remove the last owner from workspace')
      }
    }

    // Update role
    const { error } = await this.supabase
      .from('workspace_members')
      .update({ role })
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to update workspace member role: ${error.message}`)
    }
  }

  /**
   * Get a member's role in a workspace
   * @returns The role or null if not a member
   */
  async getRole(workspaceId: string, userId: string): Promise<WorkspaceRole | null> {
    const { data, error } = await this.supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null
      }
      throw new Error(`Failed to get workspace member role: ${error.message}`)
    }

    return data?.role as WorkspaceRole || null
  }

  /**
   * Check if a user is a member of a workspace
   * @returns true if the user is a member, false otherwise
   */
  async isMember(workspaceId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('workspace_members')
      .select('user_id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return false
      }
      throw new Error(`Failed to check workspace membership: ${error.message}`)
    }

    return !!data
  }

  /**
   * Validate that a role is one of the allowed values
   * @throws Error if role is invalid
   */
  private validateRole(role: string): asserts role is WorkspaceRole {
    const validRoles: WorkspaceRole[] = ['owner', 'admin', 'member', 'viewer']
    if (!validRoles.includes(role as WorkspaceRole)) {
      throw new Error(`Invalid role: ${role}. Must be one of: ${validRoles.join(', ')}`)
    }
  }
}

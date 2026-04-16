import { describe, it, expect, beforeEach, vi } from 'vitest'
import { WorkspaceMembershipService } from './WorkspaceMembershipManager'
import type { SupabaseClient } from '@supabase/supabase-js'

describe('WorkspaceMembershipService', () => {
  let service: WorkspaceMembershipService
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = {} as any
    service = new WorkspaceMembershipService(mockSupabase as unknown as SupabaseClient)
  })

  describe('addMember', () => {
    it('should add a member with valid role', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null })
      mockSupabase.from = vi.fn().mockReturnValue({
        insert: mockInsert,
      })

      await service.addMember('workspace-1', 'user-1', 'member')

      expect(mockSupabase.from).toHaveBeenCalledWith('workspace_members')
      expect(mockInsert).toHaveBeenCalledWith({
        workspace_id: 'workspace-1',
        user_id: 'user-1',
        role: 'member',
      })
    })

    it('should throw error for invalid role', async () => {
      await expect(
        service.addMember('workspace-1', 'user-1', 'invalid' as any)
      ).rejects.toThrow('Invalid role')
    })

    it('should throw error if user is already a member', async () => {
      const mockInsert = vi.fn().mockResolvedValue({
        error: { code: '23505', message: 'duplicate key' },
      })
      mockSupabase.from = vi.fn().mockReturnValue({
        insert: mockInsert,
      })

      await expect(
        service.addMember('workspace-1', 'user-1', 'member')
      ).rejects.toThrow('User is already a member')
    })
  })

  describe('getRole', () => {
    it('should return role if user is a member', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: { role: 'admin' },
        error: null,
      })
      const mockEq2 = vi.fn().mockReturnValue({ single: mockSingle })
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 })
      mockSupabase.from = vi.fn().mockReturnValue({
        select: mockSelect,
      })

      const role = await service.getRole('workspace-1', 'user-1')

      expect(role).toBe('admin')
      expect(mockSupabase.from).toHaveBeenCalledWith('workspace_members')
    })

    it('should return null if user is not a member', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      })
      const mockEq2 = vi.fn().mockReturnValue({ single: mockSingle })
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 })
      mockSupabase.from = vi.fn().mockReturnValue({
        select: mockSelect,
      })

      const role = await service.getRole('workspace-1', 'user-1')

      expect(role).toBeNull()
    })
  })

  describe('isMember', () => {
    it('should return true if user is a member', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: { user_id: 'user-1' },
        error: null,
      })
      const mockEq2 = vi.fn().mockReturnValue({ single: mockSingle })
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 })
      mockSupabase.from = vi.fn().mockReturnValue({
        select: mockSelect,
      })

      const isMember = await service.isMember('workspace-1', 'user-1')

      expect(isMember).toBe(true)
    })

    it('should return false if user is not a member', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      })
      const mockEq2 = vi.fn().mockReturnValue({ single: mockSingle })
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 })
      mockSupabase.from = vi.fn().mockReturnValue({
        select: mockSelect,
      })

      const isMember = await service.isMember('workspace-1', 'user-1')

      expect(isMember).toBe(false)
    })
  })

  describe('updateRole', () => {
    it('should update role for existing member', async () => {
      // Mock getRole
      const mockSingle = vi.fn().mockResolvedValue({
        data: { role: 'member' },
        error: null,
      })
      const mockEq1b = vi.fn().mockReturnValue({ single: mockSingle })
      const mockEq1a = vi.fn().mockReturnValue({ eq: mockEq1b })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1a })
      
      // Mock update
      const mockEq2b = vi.fn().mockResolvedValue({ error: null })
      const mockEq2a = vi.fn().mockReturnValue({ eq: mockEq2b })
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq2a })
      
      mockSupabase.from = vi.fn()
        .mockReturnValueOnce({ select: mockSelect })
        .mockReturnValueOnce({ update: mockUpdate })

      await service.updateRole('workspace-1', 'user-1', 'admin')

      expect(mockUpdate).toHaveBeenCalledWith({ role: 'admin' })
    })

    it('should throw error if user is not a member', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      })
      const mockEq2 = vi.fn().mockReturnValue({ single: mockSingle })
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 })
      mockSupabase.from = vi.fn().mockReturnValue({
        select: mockSelect,
      })

      await expect(
        service.updateRole('workspace-1', 'user-1', 'admin')
      ).rejects.toThrow('User is not a member')
    })

    it('should prevent removing last owner', async () => {
      // Mock getRole to return owner
      const mockSingle1 = vi.fn().mockResolvedValue({
        data: { role: 'owner' },
        error: null,
      })
      const mockEq1b = vi.fn().mockReturnValue({ single: mockSingle1 })
      const mockEq1a = vi.fn().mockReturnValue({ eq: mockEq1b })
      const mockSelect1 = vi.fn().mockReturnValue({ eq: mockEq1a })
      
      // Mock owner count check
      const mockEq2b = vi.fn().mockResolvedValue({
        data: [{ user_id: 'user-1' }],
        error: null,
      })
      const mockEq2a = vi.fn().mockReturnValue({ eq: mockEq2b })
      const mockSelect2 = vi.fn().mockReturnValue({ eq: mockEq2a })
      
      mockSupabase.from = vi.fn()
        .mockReturnValueOnce({ select: mockSelect1 })
        .mockReturnValueOnce({ select: mockSelect2 })

      await expect(
        service.updateRole('workspace-1', 'user-1', 'admin')
      ).rejects.toThrow('Cannot remove the last owner')
    })
  })

  describe('removeMember', () => {
    it('should prevent removing last owner', async () => {
      const mockEq2 = vi.fn().mockResolvedValue({
        data: [{ user_id: 'user-1' }],
        error: null,
      })
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 })
      mockSupabase.from = vi.fn().mockReturnValue({
        select: mockSelect,
      })

      await expect(
        service.removeMember('workspace-1', 'user-1')
      ).rejects.toThrow('Cannot remove the last owner')
    })

    it('should remove member and cascade to problem memberships', async () => {
      // Mock owner check (multiple owners)
      const mockEq1b = vi.fn().mockResolvedValue({
        data: [{ user_id: 'user-1' }, { user_id: 'user-2' }],
        error: null,
      })
      const mockEq1a = vi.fn().mockReturnValue({ eq: mockEq1b })
      const mockSelect1 = vi.fn().mockReturnValue({ eq: mockEq1a })
      
      // Mock problems query
      const mockEq2 = vi.fn().mockResolvedValue({
        data: [{ id: 'problem-1' }, { id: 'problem-2' }],
        error: null,
      })
      const mockSelect2 = vi.fn().mockReturnValue({ eq: mockEq2 })
      
      // Mock problem_members delete
      const mockIn = vi.fn().mockResolvedValue({ error: null })
      const mockEq3 = vi.fn().mockReturnValue({ in: mockIn })
      const mockDelete1 = vi.fn().mockReturnValue({ eq: mockEq3 })
      
      // Mock workspace_members delete
      const mockEq4b = vi.fn().mockResolvedValue({ error: null })
      const mockEq4a = vi.fn().mockReturnValue({ eq: mockEq4b })
      const mockDelete2 = vi.fn().mockReturnValue({ eq: mockEq4a })
      
      mockSupabase.from = vi.fn()
        .mockReturnValueOnce({ select: mockSelect1 })
        .mockReturnValueOnce({ select: mockSelect2 })
        .mockReturnValueOnce({ delete: mockDelete1 })
        .mockReturnValueOnce({ delete: mockDelete2 })

      await service.removeMember('workspace-1', 'user-1')

      expect(mockDelete1).toHaveBeenCalled()
      expect(mockDelete2).toHaveBeenCalled()
    })
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setVote, clearVote, getUserVote } from '@/lib/actions/votes.actions'

describe('Vote Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('setVote', () => {
    it('should set upvote successfully', async () => {
      // Should not throw with mocked Supabase
      await expect(setVote('prompt-123', 1)).resolves.toBeUndefined()
    })

    it('should set downvote successfully', async () => {
      await expect(setVote('prompt-123', -1)).resolves.toBeUndefined()
    })
  })

  describe('clearVote', () => {
    it('should clear vote successfully', async () => {
      await expect(clearVote('prompt-123')).resolves.toBeUndefined()
    })
  })

  describe('getUserVote', () => {
    it('should return null for non-existent vote', async () => {
      const result = await getUserVote('prompt-123')
      
      // Mock returns null for single() when no data
      expect(result).toBeNull()
    })
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getUser, signOut } from '@/lib/actions/auth.actions'

describe('Auth Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getUser', () => {
    it('should return authenticated user', async () => {
      const result = await getUser()

      // The mock in tests/setup.ts returns a test user
      expect(result).toBeDefined()
      expect(result?.id).toBe('test-user-id')
      expect(result?.email).toBe('test@example.com')
    })
  })

  describe('signOut', () => {
    it('should call signOut without errors', async () => {
      // Should not throw
      await expect(signOut()).resolves.toBeUndefined()
    })
  })
})

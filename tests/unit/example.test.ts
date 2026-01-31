import { describe, it, expect } from 'vitest'

describe('Example Test Suite', () => {
  it('should pass basic assertion', () => {
    expect(1 + 1).toBe(2)
  })

  it('should handle strings', () => {
    const greeting = 'Hello, World!'
    expect(greeting).toContain('World')
    expect(greeting).toHaveLength(13)
  })

  it('should handle arrays', () => {
    const numbers = [1, 2, 3, 4, 5]
    expect(numbers).toHaveLength(5)
    expect(numbers).toContain(3)
  })

  it('should handle objects', () => {
    const user = {
      name: 'Test User',
      email: 'test@example.com',
      age: 25
    }
    expect(user).toHaveProperty('name')
    expect(user.email).toBe('test@example.com')
  })

  it('should handle async operations', async () => {
    const promise = Promise.resolve('success')
    await expect(promise).resolves.toBe('success')
  })
})

// Example: Testing a utility function
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

describe('slugify utility', () => {
  it('should convert text to slug', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('should remove special characters', () => {
    expect(slugify('Hello @World!')).toBe('hello-world')
  })

  it('should handle multiple spaces', () => {
    expect(slugify('Hello    World')).toBe('hello-world')
  })

  it('should remove leading/trailing dashes', () => {
    expect(slugify('-Hello World-')).toBe('hello-world')
  })
})

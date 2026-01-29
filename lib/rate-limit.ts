// Simple in-memory rate limiter
// For production, replace with Upstash Redis or similar

interface RateLimitStore {
  [key: string]: {
    count: number
    resetAt: number
  }
}

const store: RateLimitStore = {}

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  Object.keys(store).forEach(key => {
    if (store[key].resetAt < now) {
      delete store[key]
    }
  })
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  interval: number // milliseconds
  maxRequests: number
}

export async function rateLimit(
  identifier: string,
  config: RateLimitConfig = { interval: 60000, maxRequests: 100 }
): Promise<{ success: boolean; remaining: number; resetAt: number }> {
  const now = Date.now()
  const key = identifier
  
  // Initialize or reset if expired
  if (!store[key] || store[key].resetAt < now) {
    store[key] = {
      count: 0,
      resetAt: now + config.interval
    }
  }
  
  // Increment count
  store[key].count++
  
  const remaining = Math.max(0, config.maxRequests - store[key].count)
  const success = store[key].count <= config.maxRequests
  
  return {
    success,
    remaining,
    resetAt: store[key].resetAt
  }
}

// Helper to get client IP from request
export function getClientIp(request: Request): string {
  // Check various headers for IP
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  
  if (cfConnectingIp) return cfConnectingIp
  if (realIp) return realIp
  if (forwarded) return forwarded.split(',')[0].trim()
  
  return 'unknown'
}

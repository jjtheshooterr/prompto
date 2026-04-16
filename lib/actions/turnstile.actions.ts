'use server'

interface TurnstileResult {
  success: boolean
  error?: string
}

export async function verifyTurnstileToken(token: string): Promise<TurnstileResult> {
  if (!token) {
    return { success: false, error: 'No Turnstile token provided' }
  }

  const secretKey = process.env.TURNSTILE_SECRET_KEY

  if (!secretKey) {
    console.warn('TURNSTILE_SECRET_KEY is not defined. Failing open or closed depending on environment. Failing closed for security.')
    return { success: false, error: 'Server misconfiguration: missing Turnstile secret' }
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    })

    const data = await response.json()

    if (data.success) {
      return { success: true }
    } else {
      return { 
        success: false, 
        error: data['error-codes'] ? `Turnstile verification failed: ${data['error-codes'].join(', ')}` : 'Turnstile verification failed' 
      }
    }
  } catch (error: any) {
    console.error('Turnstile verification error:', error)
    return { success: false, error: 'Internal server error during Turnstile verification' }
  }
}

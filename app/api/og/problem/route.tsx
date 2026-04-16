import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    
    // Fallback values
    const title = searchParams.get('title') || 'Solve this Problem with AI'
    const complexity = searchParams.get('complexity') || 'Intermediate'
    const category = searchParams.get('category') || 'Technology'
    
    // Background gradient logic based on complexity
    const bgGradient = complexity === 'Expert' 
      ? 'linear-gradient(to bottom right, #4c1d95, #000000)' // Purple to Black
      : complexity === 'Beginner'
      ? 'linear-gradient(to bottom right, #065f46, #000000)' // Green to Black
      : 'linear-gradient(to bottom right, #1e3a8a, #000000)' // Blue to Black

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '80px',
            background: bgGradient,
            color: 'white',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Top Row: Categories */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <span style={{ 
                fontSize: 32, 
                fontWeight: 600, 
                color: '#fff', 
                background: 'rgba(255,255,255,0.1)', 
                padding: '10px 24px', 
                borderRadius: '100px',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                {category}
              </span>
              <span style={{ 
                fontSize: 32, 
                fontWeight: 600, 
                color: complexity === 'Expert' ? '#f87171' : complexity === 'Beginner' ? '#4ade80' : '#60a5fa',
              }}>
                {complexity}
              </span>
            </div>
            {/* Branding */}
            <div style={{ display: 'flex', fontSize: 36, fontWeight: 800, letterSpacing: '-0.05em' }}>
              PROMPT<span style={{ color: '#a78bfa' }}>VEXITY</span>
            </div>
          </div>

          {/* Center: Title */}
          <div style={{ 
            display: 'flex', 
            fontSize: 72, 
            fontWeight: 800, 
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            paddingRight: '120px'
          }}>
            {title.length > 80 ? title.substring(0, 80) + '...' : title}
          </div>

          {/* Bottom: Call to action */}
          <div style={{ display: 'flex', fontSize: 36, color: '#9ca3af', fontWeight: 500 }}>
            Compare, fork, and evaluate AI prompts to solve this problem.
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (e: any) {
    console.error(e)
    return new Response('Failed to generate image', { status: 500 })
  }
}

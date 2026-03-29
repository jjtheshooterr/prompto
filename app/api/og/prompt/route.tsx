import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    
    // Fallback values
    const title = searchParams.get('title') || 'AI Prompt Submission'
    const author = searchParams.get('author') || 'Anonymous'
    const scoreStr = searchParams.get('score') || '0'
    const score = parseInt(scoreStr, 10)
    
    // Background gradient logic based on score
    const bgGradient = score >= 90 
      ? 'linear-gradient(to bottom right, #4c1d95, #000000)' // Purple to Black (Elite)
      : score >= 70
      ? 'linear-gradient(to bottom right, #065f46, #000000)' // Green to Black (Good)
      : 'linear-gradient(to bottom right, #1e3a8a, #000000)' // Blue to Black (Standard)

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
          {/* Top Row: Author & Branding */}
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
                By @{author}
              </span>
            </div>
            
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

          {/* Bottom: Score & Call to action */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', fontSize: 36, color: '#9ca3af', fontWeight: 500 }}>
              Read and fork this AI prompt architecture.
            </div>
            {score > 0 && (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'flex-end',
                background: 'rgba(0,0,0,0.4)',
                padding: '20px 40px',
                borderRadius: '24px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <span style={{ fontSize: 24, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
                  AI Quality Score
                </span>
                <span style={{ 
                  fontSize: 64, 
                  fontWeight: 900,
                  color: score >= 90 ? '#a78bfa' : score >= 70 ? '#4ade80' : '#fcd34d'
                }}>
                  {score}
                </span>
              </div>
            )}
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

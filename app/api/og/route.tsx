import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractDbSlug } from '@/lib/utils/prompt-url'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const type = searchParams.get('type') || 'default'
  const slug = searchParams.get('slug') || ''

  let title = 'Promptvexity'
  let subtitle = 'The problem-first prompt library'
  let stat1 = ''
  let stat2 = ''
  let stat3 = ''
  let accentColor = '#6366f1'

  try {
    if ((type === 'problem' || type === 'prompt') && slug) {
      const supabase = await createClient()
      const { dbSlug, shortId, isFullUuid } = extractDbSlug(slug)

      if (type === 'problem') {
        let problem: any = null
        if (isFullUuid) {
          const { data } = await supabase.from('problems').select('title, description, industry').eq('id', slug).single()
          problem = data
        } else {
          const { data } = await supabase.from('problems').select('id, title, description, industry').eq('slug', dbSlug)
          if (data && data.length > 0) {
            problem = shortId ? data.find((p: any) => p.id.startsWith(shortId)) || data[0] : data[0]
          }
        }

        if (problem) {
          title = problem.title
          subtitle = (problem.description || '').slice(0, 100)
          if (problem.industry) stat1 = problem.industry
          accentColor = '#3b82f6'
        }
      }

      if (type === 'prompt') {
        let prompt: any = null
        if (isFullUuid) {
          const { data } = await supabase.from('prompts').select('title, model, system_prompt').eq('id', slug).single()
          prompt = data
        } else {
          const { data } = await supabase.from('prompts').select('id, title, model, system_prompt').eq('slug', dbSlug)
          if (data && data.length > 0) {
            prompt = shortId ? data.find((p: any) => p.id.startsWith(shortId)) || data[0] : data[0]
          }
        }

        if (prompt) {
          title = prompt.title
          subtitle = (prompt.system_prompt || '').slice(0, 100)
          if (prompt.model) stat1 = prompt.model
          accentColor = '#8b5cf6'
        }
      }
    }

    if (type === 'profile') {
      const username = searchParams.get('username')
      if (username) {
        const supabase = await createClient()
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, username, bio')
          .eq('username', username)
          .single()

        if (profile) {
          title = profile.display_name || profile.username
          subtitle = profile.bio || 'Prompt Engineer on Promptvexity'
          accentColor = '#10b981'
        }
      }
    }
  } catch {
    // Fallback to defaults on any error
  }

  // Truncate for display
  if (title.length > 60) title = title.slice(0, 57) + '...'
  if (subtitle.length > 120) subtitle = subtitle.slice(0, 117) + '...'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px',
          background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #0f0f0f 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, ${accentColor}, ${accentColor}88, transparent)`,
          }}
        />

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Type badge */}
          {type !== 'default' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div
                style={{
                  background: `${accentColor}22`,
                  border: `1px solid ${accentColor}44`,
                  color: accentColor,
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {type === 'problem' ? 'Problem' : type === 'prompt' ? 'Prompt' : 'Creator'}
              </div>
              {stat1 && (
                <div
                  style={{
                    background: '#ffffff11',
                    border: '1px solid #ffffff22',
                    color: '#999',
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
                >
                  {stat1}
                </div>
              )}
            </div>
          )}

          {/* Title */}
          <div
            style={{
              fontSize: '48px',
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: '20px',
              color: '#888888',
              lineHeight: 1.5,
              maxWidth: '800px',
            }}
          >
            {subtitle}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: accentColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 700,
                color: '#fff',
              }}
            >
              P
            </div>
            <div style={{ fontSize: '20px', fontWeight: 600, color: '#ffffff' }}>
              promptvexity.com
            </div>
          </div>
          <div style={{ fontSize: '16px', color: '#666666' }}>
            Problem-first prompt library
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )
}

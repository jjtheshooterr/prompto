'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers'
import TourTooltip from './TourTooltip'

interface TourStep {
  id: string
  title: string
  description: string
  target: string | null
  placement?: 'right' | 'bottom' | 'top' | 'left'
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Promptvexity',
    description:
      "Real-world AI challenges, community-tested prompt solutions. Let us show you how it works.",
    target: null,
  },
  {
    id: 'filters',
    title: 'Filter & Discover',
    description:
      'Find problems that match your skills — filter by difficulty, industry, or search for a specific topic.',
    target: 'filters',
    placement: 'right',
  },
  {
    id: 'problem-card',
    title: 'Problems & Solutions',
    description:
      "Each card is a real challenge. Click Solve to submit your prompt, browse existing solutions, and vote on what works.",
    target: 'problem-card',
    placement: 'bottom',
  },
  {
    id: 'finish',
    title: "You're all set!",
    description:
      'Pick a problem, write your best prompt, and let the community rate and fork your work.',
    target: null,
  },
]

const TOOLTIP_W = 280
const GAP = 14

interface TooltipPosition {
  top: number
  left: number
  arrowDir: 'left' | 'top' | 'bottom' | 'right' | 'none'
}

function isInViewport(el: Element): boolean {
  const r = el.getBoundingClientRect()
  return r.top >= 0 && r.bottom <= window.innerHeight
}

function calcPosition(el: HTMLElement, placement: string): TooltipPosition {
  const r = el.getBoundingClientRect()

  switch (placement) {
    case 'right':
      return {
        // Anchor to the TOP of the element, not the center
        top: Math.max(8, r.top + 8),
        left: Math.min(window.innerWidth - TOOLTIP_W - 8, r.right + GAP),
        arrowDir: 'left',
      }
    case 'left':
      return {
        top: Math.max(8, r.top + 8),
        left: Math.max(8, r.left - TOOLTIP_W - GAP),
        arrowDir: 'right',
      }
    case 'bottom':
      return {
        top: Math.min(window.innerHeight - 210, r.bottom + GAP),
        left: Math.max(8, Math.min(window.innerWidth - TOOLTIP_W - 8, r.left + r.width / 2 - TOOLTIP_W / 2)),
        arrowDir: 'top',
      }
    case 'top':
      return {
        top: Math.max(8, r.top - 180 - GAP),
        left: Math.max(8, Math.min(window.innerWidth - TOOLTIP_W - 8, r.left + r.width / 2 - TOOLTIP_W / 2)),
        arrowDir: 'bottom',
      }
    default:
      return { top: 8, left: 8, arrowDir: 'none' }
  }
}

export default function TourProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const [active, setActive] = useState(false)
  const [step, setStep] = useState(0)
  const [position, setPosition] = useState<TooltipPosition>({ top: 0, left: 0, arrowDir: 'none' })
  const [checked, setChecked] = useState(false)

  // Track the currently spotlit element so we can restore its styles
  const spotlitEl = useRef<HTMLElement | null>(null)
  const savedStyles = useRef<{ position: string; zIndex: string } | null>(null)

  const isProblemsPage = pathname === '/problems'

  // ── Check onboarding status ──────────────────────────────────────────────
  useEffect(() => {
    if (loading || !user || !isProblemsPage || checked) return
    setChecked(true)

    const supabase = createClient()
    supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data && !data.onboarding_completed) setActive(true)
      })
  }, [user, loading, isProblemsPage, checked])

  // ── Restore spotlit element ──────────────────────────────────────────────
  const clearSpotlight = useCallback(() => {
    if (spotlitEl.current && savedStyles.current) {
      spotlitEl.current.style.position = savedStyles.current.position
      spotlitEl.current.style.zIndex = savedStyles.current.zIndex
      spotlitEl.current = null
      savedStyles.current = null
    }
  }, [])

  // ── Activate a step ──────────────────────────────────────────────────────
  const activateStep = useCallback(
    (stepIndex: number) => {
      clearSpotlight()

      const s = TOUR_STEPS[stepIndex]
      if (!s?.target) {
        setPosition({ top: 0, left: 0, arrowDir: 'none' })
        return
      }

      const el = document.querySelector(`[data-tour="${s.target}"]`) as HTMLElement | null
      if (!el) {
        setPosition({ top: 0, left: 0, arrowDir: 'none' })
        return
      }

      // Lift element above the overlay so it appears spotlit
      savedStyles.current = { position: el.style.position, zIndex: el.style.zIndex }
      el.style.position = 'relative'
      el.style.zIndex = '102'
      spotlitEl.current = el

      const go = () => setPosition(calcPosition(el, s.placement ?? 'right'))

      if (!isInViewport(el)) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        setTimeout(go, 400)
      } else {
        go()
      }
    },
    [clearSpotlight],
  )

  useEffect(() => {
    if (active) activateStep(step)
  }, [active, step, activateStep])

  // ── Mark complete in DB ──────────────────────────────────────────────────
  const markComplete = useCallback(async () => {
    if (!user) return
    const supabase = createClient()
    await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', user.id)
  }, [user])

  const endTour = useCallback(async () => {
    clearSpotlight()
    setActive(false)
    await markComplete()
  }, [clearSpotlight, markComplete])

  const next = useCallback(async () => {
    if (step < TOUR_STEPS.length - 1) {
      setStep((s) => s + 1)
    } else {
      await endTour()
    }
  }, [step, endTour])

  const skip = useCallback(async () => {
    await endTour()
  }, [endTour])

  // ── Cleanup on unmount ───────────────────────────────────────────────────
  useEffect(() => {
    return () => clearSpotlight()
  }, [clearSpotlight])

  const currentStep = TOUR_STEPS[step]
  const isCentered = !currentStep?.target

  return (
    <>
      {children}

      {active && currentStep && (
        <>
          {/* Dim overlay — z-[100], below spotlit element (z-102) */}
          <div className="fixed inset-0 z-[100] bg-black/55" onClick={skip} />

          {/* Tooltip — z-[103], above everything */}
          {isCentered ? (
            <div className="fixed inset-0 z-[103] flex items-center justify-center pointer-events-none">
              <div className="pointer-events-auto">
                <TourTooltip
                  title={currentStep.title}
                  description={currentStep.description}
                  step={step}
                  totalSteps={TOUR_STEPS.length}
                  onNext={next}
                  onSkip={skip}
                  arrowDir="none"
                />
              </div>
            </div>
          ) : (
            <div className="fixed z-[103]" style={{ top: position.top, left: position.left }}>
              <TourTooltip
                title={currentStep.title}
                description={currentStep.description}
                step={step}
                totalSteps={TOUR_STEPS.length}
                onNext={next}
                onSkip={skip}
                arrowDir={position.arrowDir}
              />
            </div>
          )}
        </>
      )}
    </>
  )
}

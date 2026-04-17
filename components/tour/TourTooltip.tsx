'use client'

import React from 'react'

interface TourTooltipProps {
  title: string
  description: string
  step: number
  totalSteps: number
  onNext: () => void
  onSkip: () => void
  arrowDir?: 'left' | 'top' | 'bottom' | 'right' | 'none'
  className?: string
}

export default function TourTooltip({
  title,
  description,
  step,
  totalSteps,
  onNext,
  onSkip,
  arrowDir = 'none',
  className = '',
}: TourTooltipProps) {
  const isLast = step === totalSteps - 1

  // Rotated-square arrow using border clipping
  const arrowEl = (() => {
    if (arrowDir === 'none') return null
    const base = 'absolute w-3 h-3 bg-popover border-border rotate-45'
    switch (arrowDir) {
      case 'left':
        return <div className={`${base} border-l border-b left-[-6px] top-1/2 -translate-y-1/2`} />
      case 'right':
        return <div className={`${base} border-r border-t right-[-6px] top-1/2 -translate-y-1/2`} />
      case 'top':
        return <div className={`${base} border-l border-t top-[-6px] left-1/2 -translate-x-1/2`} />
      case 'bottom':
        return <div className={`${base} border-r border-b bottom-[-6px] left-1/2 -translate-x-1/2`} />
    }
  })()

  return (
    <div
      className={`relative w-[280px] bg-popover border border-border rounded-xl shadow-xl p-4 ${className}`}
    >
      {arrowEl}

      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold text-foreground leading-tight">{title}</h3>
        <button
          onClick={onSkip}
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0 text-xs mt-0.5"
        >
          Skip
        </button>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed mb-4">{description}</p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {/* Progress dots */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-200"
              style={{
                width: i === step ? '16px' : '6px',
                height: '6px',
                backgroundColor:
                  i === step
                    ? 'hsl(var(--primary))'
                    : i < step
                    ? 'hsl(var(--primary) / 0.4)'
                    : 'hsl(var(--muted-foreground) / 0.3)',
              }}
            />
          ))}
        </div>

        <button
          onClick={onNext}
          className="text-xs font-semibold bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
        >
          {isLast ? 'Get Started' : 'Next →'}
        </button>
      </div>
    </div>
  )
}

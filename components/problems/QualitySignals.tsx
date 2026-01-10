'use client'

interface QualitySignalsProps {
    hasPinnedPrompt?: boolean
    activeForks?: number
    lastUpdated?: string
    promptCount: number
}

export default function QualitySignals({
    hasPinnedPrompt,
    activeForks = 0,
    lastUpdated,
    promptCount
}: QualitySignalsProps) {
    // Calculate if updated within last 14 days
    const isRecentlyUpdated = lastUpdated ?
        (new Date().getTime() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24) <= 14
        : false

    // Format relative time
    const getRelativeTime = (date: string) => {
        const days = Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
        if (days === 0) return 'today'
        if (days === 1) return '1d ago'
        return `${days}d ago`
    }

    // Show "No solutions yet" badge if no prompts
    if (promptCount === 0) {
        return (
            <div className="flex items-center justify-end mt-3">
                <span className="px-2 py-1 text-xs bg-slate-100 text-slate-500 rounded">
                    No solutions yet
                </span>
            </div>
        )
    }

    // Show quality signals
    return (
        <div className="flex items-center justify-end gap-3 mt-3 text-xs text-slate-500">
            {hasPinnedPrompt && (
                <div className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Pinned</span>
                </div>
            )}

            {activeForks > 0 && (
                <div className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    <span>{activeForks} {activeForks === 1 ? 'fork' : 'forks'}</span>
                </div>
            )}

            {isRecentlyUpdated && lastUpdated && !hasPinnedPrompt && activeForks === 0 && (
                <div className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Updated {getRelativeTime(lastUpdated)}</span>
                </div>
            )}
        </div>
    )
}

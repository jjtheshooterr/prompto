'use client'

interface QualitySignalsProps {
    hasPinnedPrompt?: boolean
    activeForks?: number
    lastUpdated?: string
    promptCount: number
    worksCount?: number
    failsCount?: number
}

export default function QualitySignals({
    hasPinnedPrompt,
    activeForks = 0,
    lastUpdated,
    promptCount,
    worksCount = 0,
    failsCount = 0
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

    const totalReviews = worksCount + failsCount
    const confidenceLevel = totalReviews >= 10 ? 'high' : totalReviews >= 3 ? 'medium' : 'low'

    // Show quality signals
    return (
        <div className="flex items-center justify-end gap-3 mt-3 text-xs text-slate-500">
            {/* Confidence / Evidence */}
            {totalReviews > 0 && (
                <div className="flex items-center gap-2">
                    {worksCount > 0 && (
                        <span className="px-1.5 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded text-[10px] font-medium">
                            {worksCount} Works
                        </span>
                    )}
                    {/* Only show failures if relevant */}
                    {failsCount > 0 && (
                        <span className="px-1.5 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded text-[10px] font-medium">
                            {failsCount} Fails
                        </span>
                    )}
                </div>
            )}

            {/* Needs Testing Badge */}
            {totalReviews < 3 && promptCount > 0 && (
                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded text-[10px]">
                    Needs Testing
                </span>
            )}

            {hasPinnedPrompt && (
                <div className="flex items-center gap-1">
                    <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-blue-600 font-medium">Pinned</span>
                </div>
            )}

            {activeForks > 0 && (
                <div className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    <span>{activeForks}</span>
                </div>
            )}
        </div>
    )
}

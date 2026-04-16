import { calculateTokenCount, estimateCost, type AIModel } from '@/lib/utils/tokenizer'
import { toDisplayString } from '@/lib/utils/prompt-url'

interface Props {
    prompts: any[];
}

export function CompareWinnerStrip({ prompts }: Props) {
    // 1. Calculate computed stats for each prompt
    const computedStats = prompts.map(p => {
        const s = p.prompt_stats?.[0] || {}
        const aiScore = s.quality_score || null
        const works = s.works_count || 0
        const fails = s.fails_count || 0
        const totalRuns = works + fails
        const successRate = totalRuns > 0 ? works / totalRuns : null

        // Tokens & Cost
        const totalText = toDisplayString(p.system_prompt) + '\n' + toDisplayString(p.user_prompt_template)
        const avgTokens = calculateTokenCount(totalText)
        const costPerRun = estimateCost(avgTokens, 0, p.model || '').totalCost // rough proxy
        const costPerSuccess = successRate && successRate > 0 ? costPerRun / successRate : null

        // Overall Score (Simple proxy)
        // AI Score (0-100) -> * 0.45
        // Success (0-1) -> * 0.3 * 100
        let overallScore = null
        if (aiScore !== null && successRate !== null) {
            overallScore = (aiScore * 0.6) + (successRate * 100 * 0.4)
        }

        return {
            prompt: p,
            aiScore,
            successRate,
            avgTokens,
            costPerRun,
            costPerSuccess,
            overallScore
        }
    })

    // 2. Find winners
    const validOverall = computedStats.filter(c => c.overallScore !== null)
    const bestOverall = validOverall.length > 0 ? validOverall.reduce((a, b) => a.overallScore! > b.overallScore! ? a : b) : null

    const validSuccess = computedStats.filter(c => c.successRate !== null)
    const bestSuccess = validSuccess.length > 0 ? validSuccess.reduce((a, b) => a.successRate! > b.successRate! ? a : b) : null

    const validTokens = computedStats.filter(c => c.avgTokens > 0)
    const lowestTokens = validTokens.length > 0 ? validTokens.reduce((a, b) => a.avgTokens < b.avgTokens ? a : b) : null

    const validCost = computedStats.filter(c => c.costPerSuccess !== null)
    const lowestCostPerSuccess = validCost.length > 0 ? validCost.reduce((a, b) => a.costPerSuccess! < b.costPerSuccess! ? a : b) : null

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <WinnerCard
                title="Best Overall"
                winner={bestOverall}
                metric={bestOverall ? `${bestOverall.overallScore!.toFixed(1)}/100 composite` : 'Not enough data'}
                icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />}
                color="yellow"
            />
            <WinnerCard
                title="Best Success Rate"
                winner={bestSuccess}
                metric={bestSuccess ? `${Math.round(bestSuccess.successRate! * 100)}% reliability` : 'No test runs yet'}
                icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />}
                color="green"
            />
            <WinnerCard
                title="Most Efficient"
                winner={lowestTokens}
                metric={lowestTokens ? `${lowestTokens.avgTokens.toLocaleString()} tokens/run` : 'No token data'}
                icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />}
                color="blue"
            />
            <WinnerCard
                title="Lowest Cost per Success"
                winner={lowestCostPerSuccess}
                metric={lowestCostPerSuccess ? `$${lowestCostPerSuccess.costPerSuccess!.toFixed(5)} per success` : 'Not enough data'}
                icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
                color="emerald"
            />
        </div>
    )
}

function WinnerCard({ title, winner, metric, icon, color }: any) {
    const bgColors: Record<string, string> = {
        yellow: 'bg-amber-500/10 text-amber-600',
        green: 'bg-emerald-500/10 text-emerald-600',
        blue: 'bg-primary/10 text-primary',
        emerald: 'bg-emerald-500/10 text-emerald-600'
    }

    return (
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bgColors[color]}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">{icon}</svg>
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</h3>
            </div>

            {winner ? (
                <>
                    <div className="font-bold text-foreground text-lg truncate mb-1">{toDisplayString(winner.prompt.title)}</div>
                    <p className="text-xs font-medium text-muted-foreground">{metric}</p>
                </>
            ) : (
                <div className="text-sm font-medium text-muted-foreground/60 italic mt-3">{metric}</div>
            )}
        </div>
    )
}

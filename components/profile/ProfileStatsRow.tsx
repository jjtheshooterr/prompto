export interface ProfileStatsData {
    total_prompts: number;
    total_score: number;
    total_views: number;
    total_copies: number;
    forks_received: number;
    forks_created: number;
    success_rate: number;
}

interface ProfileStatsRowProps {
    stats: ProfileStatsData;
}

export function ProfileStatCard({
    label,
    value,
    subtext
}: {
    label: string;
    value: string | number;
    subtext?: string;
}) {
    return (
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-2">
            <div className="text-sm font-medium text-slate-500">{label}</div>
            <div className="text-3xl font-bold text-slate-900">{value}</div>
            {subtext && (
                <div className="text-xs font-medium text-blue-600 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    {subtext}
                </div>
            )}
        </div>
    );
}

export function ProfileStatsRow({ stats }: ProfileStatsRowProps) {
    return (
        <div className="flex gap-4 w-full">
            <ProfileStatCard
                label="Total Upvotes"
                value={stats.total_score > 999 ? `${(stats.total_score / 1000).toFixed(1)}k` : stats.total_score}
                subtext="Across all prompts"
            />
            <ProfileStatCard
                label="Forks Received"
                value={stats.forks_received}
                subtext="Top 5% of creators" // Hardcoded for demo vibe, real implementation might calculate this 
            />
            <ProfileStatCard
                label="Success Rate"
                value={`${stats.success_rate}%`}
                subtext="Across all models"
            />
        </div>
    );
}

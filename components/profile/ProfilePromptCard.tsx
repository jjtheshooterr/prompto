import Link from 'next/link';
import { CompactTokenBadge } from '@/components/prompts/TokenCostBadge';

interface ProfilePromptCardProps {
    prompt: {
        id: string;
        title: string;
        slug: string;
        model: string;
        system_prompt: string;
        quality_score?: number;
        views_count?: number;
        copy_count?: number;
        works_count?: number;
        fails_count?: number;
    };
}

export function ProfilePromptCard({ prompt }: ProfilePromptCardProps) {
    // Calculate success rate based on works and fails
    const totalVotes = (prompt.works_count || 0) + (prompt.fails_count || 0);
    const successRate = totalVotes > 0
        ? Math.round(((prompt.works_count || 0) / totalVotes) * 100)
        : 0;

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-colors shadow-sm flex flex-col gap-3 group">

            {/* Header Row */}
            <div className="flex justify-between items-start gap-4">
                <Link
                    href={`/prompts/${prompt.slug}`}
                    className="font-semibold text-slate-900 hover:text-blue-600 transition-colors text-lg group-hover:underline line-clamp-1"
                >
                    {prompt.title}
                </Link>
                <div className="flex items-center gap-2 shrink-0">
                    <CompactTokenBadge 
                        systemPrompt={prompt.system_prompt} 
                        userPromptTemplate={undefined} 
                        exampleOutput={undefined} 
                        model={prompt.model}
                    />
                    <div className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-md uppercase tracking-wide border border-emerald-100">
                        {prompt.model}
                    </div>
                </div>
            </div>

            {/* Snippet Row */}
            <p className="text-sm text-slate-600 font-mono bg-slate-50 p-3 rounded-lg border border-slate-100 line-clamp-2 leading-relaxed">
                {prompt.system_prompt}
            </p>

            {/* Footer Stats Row */}
            <div className="flex items-center justify-between mt-auto pt-2 text-sm text-slate-500 font-medium">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5" title="Score">
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                        </svg>
                        {prompt.quality_score || 0}
                    </div>
                    <div className="flex items-center gap-1.5" title="Forks">
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                        </svg>
                        {prompt.copy_count || 0}
                    </div>
                </div>

                {totalVotes > 0 && (
                    <div className="text-slate-900 font-bold">
                        {successRate}% SUCCESS
                    </div>
                )}
            </div>

        </div>
    );
}

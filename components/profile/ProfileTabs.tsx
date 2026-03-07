export type ProfileTabId = 'prompts' | 'forks' | 'reviews' | 'activity';

interface ProfileTabsProps {
    activeTab: ProfileTabId;
    onChange: (tab: ProfileTabId) => void;
    counts?: {
        prompts?: number;
        forks?: number;
        reviews?: number;
    };
}

export function ProfileTabs({ activeTab, onChange, counts = {} }: ProfileTabsProps) {
    const tabs: { id: ProfileTabId; label: string; icon: React.ReactNode; count?: number }[] = [
        {
            id: 'prompts',
            label: 'Prompts',
            count: counts.prompts,
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            )
        },
        {
            id: 'forks',
            label: 'Forks',
            count: counts.forks,
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
            )
        },
        {
            id: 'reviews',
            label: 'Reviews',
            count: counts.reviews,
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
            )
        },
        {
            id: 'activity',
            label: 'Activity',
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        }
    ];

    return (
        <div className="flex gap-8 border-b border-slate-200 mt-8 mb-6">
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onChange(tab.id)}
                        className={`
              flex items-center gap-2 pb-4 pt-2 font-medium transition-colors border-b-2
              ${isActive
                                ? 'border-blue-600 text-slate-900'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }
            `}
                    >
                        <span className={isActive ? 'text-blue-600' : 'text-slate-400'}>
                            {tab.icon}
                        </span>
                        {tab.label}
                        {tab.count !== undefined && (
                            <span className={`
                ml-1 px-2 py-0.5 text-xs rounded-full font-semibold
                ${isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}
              `}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

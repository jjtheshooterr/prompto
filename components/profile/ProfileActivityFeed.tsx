import Link from 'next/link';

export type ActivityType =
    | 'prompt_created'
    | 'prompt_updated'
    | 'prompt_forked'
    | 'prompt_improved'
    | 'review_received'
    | 'score_increased';

export interface ActivityItemData {
    activity_id: string;
    type: ActivityType;
    entity_type: string;
    entity_id: string;
    entity_title: string;
    metadata: any;
    created_at: string;
}

interface ProfileActivityItemProps {
    activity: ActivityItemData;
    profileName: string;
}

export function ProfileActivityItem({ activity, profileName }: ProfileActivityItemProps) {
    const timeStr = new Date(activity.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: new Date(activity.created_at).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });

    const renderContent = () => {
        switch (activity.type) {
            case 'prompt_created':
                return (
                    <>
                        <span className="font-medium text-foreground">{profileName}</span> published a new prompt{' '}
                        <Link href={`/prompts/${activity.metadata?.slug || activity.entity_id}`} className="font-medium text-primary hover:underline">
                            {activity.entity_title}
                        </Link>
                    </>
                );
            case 'prompt_forked':
                return (
                    <>
                        <span className="font-medium text-foreground">{profileName}</span> forked prompt{' '}
                        <Link href={`/prompts/${activity.metadata?.slug || activity.entity_id}`} className="font-medium text-primary hover:underline">
                            {activity.entity_title}
                        </Link>
                    </>
                );
            case 'prompt_updated':
                return (
                    <>
                        <span className="font-medium text-foreground">{profileName}</span> updated their prompt{' '}
                        <Link href={`/prompts/${activity.metadata?.slug || activity.entity_id}`} className="font-medium text-primary hover:underline">
                            {activity.entity_title}
                        </Link>
                    </>
                );
            case 'review_received':
                return (
                    <>
                        <span className="font-medium text-foreground">{profileName}</span> received a review on{' '}
                        <Link href={`/prompts/${activity.metadata?.slug || activity.entity_id}`} className="font-medium text-primary hover:underline">
                            {activity.entity_title}
                        </Link>
                    </>
                );
            default:
                return (
                    <>
                        <span className="font-medium text-foreground">{profileName}</span> interacted with{' '}
                        <span className="font-medium text-muted-foreground">{activity.entity_title || activity.entity_type}</span>
                    </>
                );
        }
    };

    const Icon = () => {
        switch (activity.type) {
            case 'prompt_created':
                return (
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </div>
                );
            case 'prompt_forked':
                return (
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                        </svg>
                    </div>
                );
            case 'prompt_updated':
                return (
                    <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0 mt-0.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </div>
                );
            default:
                return (
                    <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0 mt-0.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                );
        }
    };

    return (
        <div className="flex gap-4">
            <Icon />
            <div className="flex flex-col gap-1">
                <div className="text-foreground/90 leading-snug">
                    {renderContent()}
                </div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {timeStr}
                </div>
            </div>
        </div>
    );
}

interface ProfileActivityFeedProps {
    activities: ActivityItemData[];
    profileName: string;
}

export function ProfileActivityFeed({ activities, profileName }: ProfileActivityFeedProps) {
    if (!activities || activities.length === 0) {
        return (
            <div className="py-12 text-center border border-dashed border-border rounded-xl bg-card">
                <p className="text-muted-foreground">No recent activity to show.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 max-w-3xl">
            <h3 className="text-xl font-bold text-foreground">Recent Activity</h3>
            <div className="flex flex-col gap-8 relative before:absolute before:inset-y-0 before:-left-[15px] before:w-[2px] before:bg-border ml-[15px]">
                {activities.map((activity) => (
                    <div key={activity.activity_id} className="relative z-10 -ml-[31px]">
                        <ProfileActivityItem activity={activity} profileName={profileName} />
                    </div>
                ))}
            </div>
        </div>
    );
}

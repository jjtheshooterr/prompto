import Link from 'next/link'
import { toast } from 'sonner';
import Image from 'next/image';

export interface ProfileSidebarData {
    id: string;
    username: string | null;
    display_name: string;
    avatar_url: string | null;
    bio: string | null;
    headline: string | null;
    location: string | null;
    website_url: string | null;
    reputation_score: number;
    created_at: string;
}

interface ProfileSidebarProps {
    profile: ProfileSidebarData;
}

export function ProfileSidebar({ profile }: ProfileSidebarProps) {
    return (
        <aside className="w-72 shrink-0 flex flex-col gap-6">
            {/* Avatar */}
            <div className="w-full aspect-square rounded-2xl border border-border overflow-hidden bg-muted relative">
                {profile.avatar_url ? (
                    <Image
                        src={profile.avatar_url}
                        alt={profile.display_name}
                        width={288}
                        height={288}
                        className="w-full h-full object-cover"
                        unoptimized
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl font-bold text-muted-foreground/30">
                        {profile.display_name.charAt(0).toUpperCase()}
                    </div>
                )}
            </div>

            {/* Basic Info */}
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-foreground leading-tight">
                    {profile.display_name}
                </h1>
                {profile.username && (
                    <p className="text-lg text-muted-foreground">@{profile.username}</p>
                )}
            </div>

            {/* Headline & Bio */}
            {(profile.headline || profile.bio) && (
                <div className="flex flex-col gap-3">
                    {profile.headline && (
                        <p className="font-medium text-foreground leading-snug">
                            {profile.headline}
                        </p>
                    )}
                    {profile.bio && (
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            {profile.bio}
                        </p>
                    )}
                </div>
            )}

            {/* Actions (Mock for now) */}
            <div className="flex gap-3">
                <button onClick={() => toast('Follow feature coming soon!', { position: 'top-center' })} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                    Follow
                </button>
                <button className="flex-1 bg-background hover:bg-accent text-foreground font-medium py-2 px-4 rounded-lg border border-border transition-colors shadow-sm">
                    Sponsor
                </button>
            </div>

            {/* Meta Info List */}
            <div className="flex flex-col gap-3 text-sm text-muted-foreground pt-4 border-t border-border">
                {profile.location && (
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{profile.location}</span>
                    </div>
                )}

                {profile.website_url && (
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        <a href={profile.website_url.startsWith('http') ? profile.website_url : `https://${profile.website_url}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline truncate">
                            {profile.website_url.replace(/^https?:\/\//, '')}
                        </a>
                    </div>
                )}

                {profile.reputation_score !== undefined && (
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        <span>Reputation: <strong className="text-foreground font-semibold">{profile.reputation_score.toLocaleString()}</strong></span>
                    </div>
                )}
            </div>

        </aside>
    );
}

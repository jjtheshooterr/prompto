import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PublicProfilePageClient } from '@/components/profile/PublicProfilePageClient';
import { ProfileSidebarData } from '@/components/profile/ProfileSidebar';
import { ProfileStatsData } from '@/components/profile/ProfileStatsRow';
import { getUserProfileByUsername } from '@/lib/actions/users.actions';
import { JsonLd } from '@/components/seo/JsonLd';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

// Enable ISR with 5-minute revalidation
export const revalidate = 300

export default async function ProfilePage({
  params
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params;
  const usernameDecoded = decodeURIComponent(username);
  
  const data = await getUserProfileByUsername(usernameDecoded);

  if (!data || !data.profile) {
    notFound();
  }

  // Check if this account is banned
  const supabase = await createClient();
  const { data: banRecord } = await supabase
    .from('user_bans')
    .select('reason, created_at')
    .eq('user_id', data.profile.id)
    .maybeSingle()

  if (banRecord) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <ShieldAlert className="w-9 h-9 text-red-500" />
            </div>
          </div>

          {/* Username */}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground font-mono">@{data.profile.username}</p>
            <h1 className="text-2xl font-bold text-foreground">{data.profile.display_name || data.profile.username}</h1>
          </div>

          {/* Suspended badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-semibold">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Account Suspended
          </div>

          {/* Message card */}
          <div className="bg-card border border-border rounded-xl p-6 text-left space-y-2">
            <p className="text-foreground font-medium text-sm">This account has been suspended.</p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              This user violated Promptvexity&apos;s community guidelines. Their content has been removed from the platform.
            </p>
          </div>

          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Promptvexity
          </Link>
        </div>
      </div>
    )
  }

  // data.stats from mv_user_leaderboard maps to ProfileStatsData mostly:
  const rawStats: any = data.stats || {};
  const stats: ProfileStatsData = {
    total_prompts: data.prompts.length,
    total_score: rawStats.total_quality_score || 0,
    forks_created: rawStats.total_forks || 0,
    forks_received: rawStats.total_forks || 0,
    total_copies: 0,
    total_views: 0,
    success_rate: 0
  };

  // Convert profile to SidebarData
  const profile: ProfileSidebarData = {
    id: data.profile.id,
    display_name: data.profile.display_name || data.profile.username || 'Anonymous',
    username: data.profile.username || 'unknown',
    avatar_url: data.profile.avatar_url,
    headline: rawStats.tier ? `${rawStats.tier} Tier Engineer` : 'Engineer',
    bio: data.profile.bio || null,
    location: data.profile.location || null,
    website_url: data.profile.website_url || null,
    reputation_score: rawStats.total_points || 0,
    created_at: data.profile.created_at || new Date().toISOString()
  };

  const personData = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name: profile.display_name,
      alternateName: profile.username,
      url: `https://promptvexity.com/u/${profile.username}`,
      ...(profile.bio ? { description: profile.bio } : {}),
      ...(profile.website_url ? { sameAs: [profile.website_url] } : {}),
      interactionStatistic: [
        { '@type': 'InteractionCounter', interactionType: 'https://schema.org/WriteAction', userInteractionCount: stats.total_prompts },
      ],
    },
  }

  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://promptvexity.com' },
      { '@type': 'ListItem', position: 2, name: profile.display_name, item: `https://promptvexity.com/u/${profile.username}` },
    ],
  }

  return (
    <div className="bg-background min-h-screen">
      <JsonLd data={[personData, breadcrumbData]} />
      <PublicProfilePageClient
        profile={profile}
        stats={stats}
        rawStats={data.stats || null}
        prompts={data.prompts}
        problems={data.problems}
      />
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();
  const { data: profileData } = await supabase
    .rpc('get_profile_by_username', { u: username })
    .single();

  if (!profileData) {
    return { title: 'User Not Found' };
  }

  const profile = profileData as unknown as ProfileSidebarData;

  return {
    title: `${profile.display_name} (@${profile.username}) - Prompto`,
    description: profile.headline || profile.bio || `View ${profile.display_name}'s prompts, forks, and problems on Prompto.`
  };
}

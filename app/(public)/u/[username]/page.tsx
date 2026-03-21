import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PublicProfilePageClient } from '@/components/profile/PublicProfilePageClient';
import { ProfileSidebarData } from '@/components/profile/ProfileSidebar';
import { ProfileStatsData } from '@/components/profile/ProfileStatsRow';
import { getUserProfileByUsername } from '@/lib/actions/users.actions';

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

  // data.stats from mv_user_leaderboard maps to ProfileStatsData mostly:
  const rawStats: any = data.stats || {};
  const stats: ProfileStatsData = {
    total_prompts: data.prompts.length, // local counts
    total_score: rawStats.total_quality_score || 0,
    forks_created: rawStats.total_forks || 0,
    forks_received: rawStats.total_forks || 0, // Fallback if needed
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

  return (
    <div className="bg-background min-h-screen">
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

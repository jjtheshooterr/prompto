import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProfilePageClient } from '@/components/profile/ProfilePageClient';
import { ProfileSidebarData } from '@/components/profile/ProfileSidebar';
import { ProfileStatsData } from '@/components/profile/ProfileStatsRow';
import { ActivityItemData } from '@/components/profile/ProfileActivityFeed';

// Enable ISR with 5-minute revalidation
export const revalidate = 300

export default async function ProfilePage({
  params
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params;
  const supabase = await createClient();

  // 1. Fetch Profile
  const { data: profileData, error } = await supabase
    .rpc('get_profile_by_username', { u: username })
    .single();

  if (error || !profileData) {
    notFound();
  }

  const profile = profileData as unknown as ProfileSidebarData;

  // 2. Fetch Stats & Activity in parallel
  const [statsRes, activityRes] = await Promise.all([
    supabase.rpc('get_profile_stats', { p_user_id: profile.id }).single(),
    supabase.rpc('get_user_activity', { p_user_id: profile.id, p_limit: 20 })
  ]);

  const stats = statsRes.data as unknown as ProfileStatsData;
  const activities = (activityRes.data || []) as unknown as ActivityItemData[];

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <ProfilePageClient
        profile={profile}
        stats={stats}
        initialActivities={activities}
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

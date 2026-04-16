import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProfilePageClient } from '@/components/profile/ProfilePageClient';
import { ProfileSidebarData } from '@/components/profile/ProfileSidebar';
import { ProfileStatsData } from '@/components/profile/ProfileStatsRow';
import { ActivityItemData } from '@/components/profile/ProfileActivityFeed';

// Enable ISR with 5-minute revalidation
export const revalidate = 300

export default async function ProfileByIdPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profileData, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !profileData) {
    notFound();
  }

  const profile = profileData as unknown as ProfileSidebarData;

  // Redirect to username URL if available
  if (profile.username) {
    redirect(`/u/${profile.username}`);
  }

  // 2. Fetch Stats & Activity in parallel
  const [statsRes, activityRes] = await Promise.all([
    supabase.rpc('get_profile_stats', { p_user_id: profile.id }).single(),
    supabase.rpc('get_user_activity', { p_user_id: profile.id, p_limit: 20 })
  ]);

  const stats = statsRes.data as unknown as ProfileStatsData;
  const activities = (activityRes.data || []) as unknown as ActivityItemData[];

  return (
    <div className="bg-background min-h-screen py-8">
      <ProfilePageClient
        profile={profile}
        stats={stats}
        initialActivities={activities}
      />
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (!profileData) {
    return { title: 'User Not Found' };
  }

  const profile = profileData as unknown as ProfileSidebarData;

  return {
    title: `${profile.display_name} - Prompto`,
    description: profile.headline || profile.bio || `View ${profile.display_name}'s prompts, forks, and problems on Prompto.`
  };
}

import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProfilePageClient } from '@/components/profile/ProfilePageClient';

// Enable ISR with 5-minute revalidation
export const revalidate = 300

export default async function ProfilePage({ 
  params 
}: { 
  params: { username: string } 
}) {
  const supabase = await createClient();
  
  const { data: profile, error } = await supabase
    .rpc('get_profile_by_username', { u: params.username })
    .single();
    
  if (error || !profile) {
    notFound();
  }
  
  return <ProfilePageClient profile={profile} />;
}

export async function generateMetadata({ params }: { params: { username: string } }) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .rpc('get_profile_by_username', { u: params.username })
    .single();
    
  if (!profile) {
    return { title: 'User Not Found' };
  }
  
  return {
    title: `${profile.display_name} (@${profile.username}) - Prompto`,
    description: `View ${profile.display_name}'s prompts, forks, and problems on Prompto.`
  };
}

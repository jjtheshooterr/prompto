import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProfilePageClient } from '@/components/profile/ProfilePageClient';

// Enable ISR with 5-minute revalidation
export const revalidate = 300

interface Profile {
  id: string;
  username: string | null;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  reputation: number;
  upvotes_received: number;
  forks_received: number;
}

export default async function ProfileByIdPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const supabase = await createClient();
  
  const { data: profile, error } = await supabase
    .from('public_profiles')
    .select('*')
    .eq('id', params.id)
    .single();
    
  if (error || !profile) {
    notFound();
  }
  
  // Redirect to username URL if available
  if (profile.username) {
    redirect(`/u/${profile.username}`);
  }
  
  return <ProfilePageClient profile={profile as Profile} />;
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('public_profiles')
    .select('*')
    .eq('id', params.id)
    .single();
    
  if (!profile) {
    return { title: 'User Not Found' };
  }
  
  return {
    title: `${profile.display_name} - Prompto`,
    description: `View ${profile.display_name}'s prompts, forks, and problems on Prompto.`
  };
}

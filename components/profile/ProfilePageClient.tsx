'use client';

import { useState } from 'react';
import { UserPromptsList } from './UserPromptsList';
import { UserForksList } from './UserForksList';
import { UserProblemsList } from './UserProblemsList';
import { ProfileSidebar, ProfileSidebarData } from './ProfileSidebar';
import { ProfileStatsRow, ProfileStatsData } from './ProfileStatsRow';
import { ProfileTabs, ProfileTabId } from './ProfileTabs';
import { ProfileActivityFeed, ActivityItemData } from './ProfileActivityFeed';

interface ProfilePageClientProps {
  profile: ProfileSidebarData;
  stats: ProfileStatsData;
  initialActivities: ActivityItemData[];
}

export function ProfilePageClient({ profile, stats, initialActivities }: ProfilePageClientProps) {
  const [tab, setTab] = useState<ProfileTabId>('prompts');

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8">
      <div className="flex flex-col md:flex-row gap-10">

        {/* Left Sidebar */}
        <ProfileSidebar profile={profile} />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          <ProfileStatsRow stats={stats} />

          <ProfileTabs
            activeTab={tab}
            onChange={setTab}
            counts={{
              prompts: stats.total_prompts,
              forks: stats.forks_created,
            }}
          />

          <div className="min-h-[500px]">
            {tab === 'prompts' && <UserPromptsList userId={profile.id} />}
            {tab === 'forks' && <UserForksList userId={profile.id} />}
            {tab === 'reviews' && (
              <div className="py-12 text-center border border-dashed border-border rounded-xl bg-card">
                <p className="text-muted-foreground">Reviews feature coming soon.</p>
              </div>
            )}
            {tab === 'activity' && (
              <ProfileActivityFeed
                activities={initialActivities}
                profileName={profile.display_name}
              />
            )}
            {/* Keeping Problems list around just in case, though it was removed from tabs */}
          </div>
        </main>

      </div>
    </div>
  );
}


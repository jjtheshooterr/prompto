'use client';

import { useState } from 'react';
import { ProfileSidebar, ProfileSidebarData } from './ProfileSidebar';
import { ProfileStatsRow, ProfileStatsData } from './ProfileStatsRow';
import { ProfileTabs, ProfileTabId } from './ProfileTabs';
import { ProfilePromptCard } from './ProfilePromptCard';

// Use a simplified card for problems since UserProblemsList uses problem components
import Link from 'next/link';
import { problemUrl } from '@/lib/utils/prompt-url';

interface PublicProfilePageClientProps {
  profile: ProfileSidebarData;
  stats: ProfileStatsData;
  prompts: any[];
  problems: any[];
}

export function PublicProfilePageClient({ profile, stats, prompts, problems }: PublicProfilePageClientProps) {
  const [tab, setTab] = useState<ProfileTabId>('prompts');

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8">
      <div className="flex flex-col md:flex-row gap-10">

        {/* Left Sidebar */}
        <ProfileSidebar profile={profile} />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          <ProfileStatsRow stats={stats} />

          {/* Reusing ProfileTabs but overriding 'forks' or 'reviews' if we want */}
          <ProfileTabs
            activeTab={tab}
            onChange={setTab}
            counts={{
              prompts: prompts.length,
              forks: stats.forks_created || 0, // We could add a 'problems' tab conceptually
            }}
          />

          <div className="min-h-[500px] mt-6">
            {tab === 'prompts' && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-6">Public Prompts ({prompts.length})</h2>
                {prompts.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-lg font-medium">No public prompts</p>
                    <p className="text-sm mt-1">This user hasn't published any prompts yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {prompts.map((p) => {
                      const stats = p.prompt_stats?.[0] || p.prompt_stats || {};
                      return (
                        <ProfilePromptCard
                          key={p.id}
                          prompt={{
                            id: p.id,
                            title: p.title || 'Untitled Prompt',
                            slug: p.slug,
                            model: p.model || 'AI Model',
                            system_prompt: p.system_prompt || p.description || 'Click to view prompt details...',
                            quality_score: stats.score || 0,
                            copy_count: stats.fork_count || 0,
                            works_count: stats.works_count || 0,
                            fails_count: stats.fails_count || 0,
                          }}
                        />
                      )
                    })}
                  </div>
                )}
              </div>
            )}
            {tab === 'forks' && (
              <div className="py-12 text-center border border-dashed border-slate-300 rounded-xl bg-white">
                <p className="text-slate-500">User's forks and models will appear here.</p>
              </div>
            )}
            {tab === 'activity' && (
              <div className="py-12 text-center border border-dashed border-slate-300 rounded-xl bg-white">
                <p className="text-slate-500">Recent activity feed coming soon.</p>
              </div>
            )}
            {tab === 'reviews' && (
              <div>
                 <h2 className="text-xl font-bold text-slate-900 mb-6">Public Problems ({problems.length})</h2>
                 {problems.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-lg font-medium">No public problems</p>
                    <p className="text-sm mt-1">This user hasn't created any public problems yet.</p>
                  </div>
                 ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {problems.map((p) => {
                         const pStats = p.problem_stats?.[0] || p.problem_stats || {};
                         return (
                          <Link href={problemUrl({id: p.id, slug: p.slug})} key={p.id} className="block group">
                            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all h-full">
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">{p.title}</h3>
                                {p.difficulty && (
                                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded-full uppercase tracking-wider">
                                    {p.difficulty}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-slate-500 line-clamp-2 mb-4">{p.goal || p.industry || 'No description available'}</p>
                              <div className="flex gap-4 text-xs font-medium text-slate-500">
                                <span className="flex items-center gap-1.5"><svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> {pStats.total_works || 0}</span>
                                <span className="flex items-center gap-1.5"><svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg> {pStats.total_prompts || 0}</span>
                              </div>
                            </div>
                          </Link>
                         )
                      })}
                    </div>
                 )}
              </div>
            )}
          </div>
        </main>

      </div>
    </div>
  );
}

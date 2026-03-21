'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link'
import { toast } from 'sonner';
import { problemUrl } from '@/lib/utils/prompt-url';
import { TierBadge } from '@/components/badges/TierBadge';
import { ProfilePromptCard } from './ProfilePromptCard';
import { LeaderboardUser } from '@/lib/actions/leaderboard.actions';
import { ProfileSidebarData } from './ProfileSidebar';
import { ProfileStatsData } from './ProfileStatsRow';

interface PublicProfilePageClientProps {
  profile: ProfileSidebarData;
  stats: ProfileStatsData;
  rawStats: LeaderboardUser | null;
  prompts: any[];
  problems: any[];
}

export function PublicProfilePageClient({ profile, stats, rawStats, prompts, problems }: PublicProfilePageClientProps) {
  const [tab, setTab] = useState<'prompts' | 'problems'>('prompts');
  
  // Pagination State
  const [promptsPage, setPromptsPage] = useState(1);
  const [problemsPage, setProblemsPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const currentPrompts = prompts.slice((promptsPage - 1) * ITEMS_PER_PAGE, promptsPage * ITEMS_PER_PAGE);
  const totalPromptsPages = Math.ceil(prompts.length / ITEMS_PER_PAGE);

  const currentProblems = problems.slice((problemsPage - 1) * ITEMS_PER_PAGE, problemsPage * ITEMS_PER_PAGE);
  const totalProblemsPages = Math.ceil(problems.length / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-slate-50 pb-12 w-full">      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        {/* Avatar & Info Row */}
        <div className="relative mb-10 z-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
             {/* Avatar Box */}
             <div className="relative shrink-0">
                <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full border-4 border-slate-50 overflow-hidden bg-white shadow-2xl relative z-10 ring-1 ring-slate-900/5">
                   {profile.avatar_url ? (
                       <img src={profile.avatar_url || undefined} alt={profile.display_name} className="w-full h-full object-cover" />
                   ) : (
                       <div className="w-full h-full flex items-center justify-center text-6xl font-black text-slate-300 bg-gradient-to-br from-slate-50 to-slate-100">
                           {profile.display_name.charAt(0).toUpperCase()}
                       </div>
                   )}
                </div>
                {/* Grandmaster Badge overlapping the circle */}
                {rawStats?.tier && (
                   <div className="absolute bottom-2 right-2 bg-white rounded-full p-1.5 shadow-xl border border-slate-100 z-20 hover:scale-105 transition-transform duration-300">
                      <TierBadge tier={rawStats.tier} size="lg" />
                   </div>
                )}
             </div>
             
             {/* Text Information Flow */}
             <div className="flex-1 mt-3 sm:mt-6 text-center sm:text-left min-w-0">
                <div className="flex flex-col gap-1.5">
                   <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight break-words">
                       {profile.display_name}
                   </h1>
                   <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                       {profile.username && (
                         <span className="text-lg sm:text-xl text-slate-500 font-medium truncate">
                            @{profile.username}
                         </span>
                       )}
                       {rawStats?.tier && (
                           <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-slate-900 text-white shadow-sm ring-1 ring-slate-900/10">
                              {rawStats.tier}
                           </span>
                       )}
                   </div>
                </div>
                
                {profile.headline && (
                   <p className="text-slate-700 mt-4 font-semibold text-lg sm:text-xl max-w-2xl leading-snug">
                       {profile.headline}
                   </p>
                )}
                
                {/* Metadata Row */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-4 text-sm font-medium text-slate-500">
                    {profile.location && (
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        <span>{profile.location}</span>
                      </div>
                    )}
                    {profile.website_url && (
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                        <a href={profile.website_url.startsWith('http') ? profile.website_url : `https://${profile.website_url}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 hover:underline truncate max-w-[200px]">{profile.website_url.replace(/^https?:\/\//, '')}</a>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                       <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                       Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </div>
                </div>
             </div>
             
             {/* Action Buttons */}
             <div className="mt-6 sm:mt-6 w-full sm:w-auto flex shrink-0">
                 <button onClick={() => toast('Follow feature coming soon!', { position: 'top-center' })} className="w-full sm:w-auto px-8 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl shadow-sm hover:shadow transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    Follow
                 </button>
             </div>
          </div>
          
          {profile.bio && (
             <div className="mt-8 text-slate-600 max-w-3xl leading-relaxed text-center sm:text-left text-base sm:text-lg">
                {profile.bio}
             </div>
          )}
        </div>

        {/* Premium Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {/* Total Points Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-yellow-50 rounded-full blur-2xl opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 relative z-10">
                   <div className="p-3 bg-yellow-100/50 text-yellow-600 rounded-xl shrink-0">
                      <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                   </div>
                   <div className="min-w-0">
                      <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 truncate">Total Points</p>
                      <h3 className="text-2xl sm:text-3xl font-black text-slate-900 leading-none truncate">{(rawStats?.total_points || 0).toLocaleString()}</h3>
                   </div>
                </div>
            </div>

            {/* Solved Problems Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-50 rounded-full blur-2xl opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 relative z-10">
                   <div className="p-3 bg-blue-100/50 text-blue-600 rounded-xl shrink-0">
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                   </div>
                   <div className="min-w-0">
                      <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 truncate">Solved</p>
                      <h3 className="text-2xl sm:text-3xl font-black text-slate-900 leading-none truncate">{(rawStats?.problems_solved || 0).toLocaleString()}</h3>
                   </div>
                </div>
            </div>

            {/* Prompts Created Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-purple-50 rounded-full blur-2xl opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 relative z-10">
                   <div className="p-3 bg-purple-100/50 text-purple-600 rounded-xl shrink-0">
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                   </div>
                   <div className="min-w-0">
                      <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 truncate">Prompts</p>
                      <h3 className="text-2xl sm:text-3xl font-black text-slate-900 leading-none truncate">{prompts.length.toLocaleString()}</h3>
                   </div>
                </div>
            </div>

            {/* Avg Quality Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-50 rounded-full blur-2xl opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 relative z-10">
                   <div className="p-3 bg-emerald-100/50 text-emerald-600 rounded-xl shrink-0">
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   </div>
                   <div className="min-w-0">
                      <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 truncate">Avg Quality</p>
                      <h3 className="text-2xl sm:text-3xl font-black text-slate-900 leading-none truncate">
                          {(rawStats?.problems_solved || 0) > 0 ? (rawStats!.total_quality_score / rawStats!.problems_solved).toFixed(1) : '0.0'}
                      </h3>
                   </div>
                </div>
            </div>
        </div>

        {/* Tabs and Content Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
           <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto">
               <button 
                 onClick={() => { setTab('prompts'); setPromptsPage(1); }} 
                 className={`px-6 py-4 text-sm font-bold whitespace-nowrap transition-colors ${tab === 'prompts' ? 'text-blue-700 bg-white border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
               >
                 Public Prompts ({prompts.length})
               </button>
               <button 
                 onClick={() => { setTab('problems'); setProblemsPage(1); }} 
                 className={`px-6 py-4 text-sm font-bold whitespace-nowrap transition-colors ${tab === 'problems' ? 'text-blue-700 bg-white border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
               >
                 Public Problems ({problems.length})
               </button>
           </div>
           
           <div className="p-6">
               {tab === 'prompts' && (
                 <div>
                   {prompts.length === 0 ? (
                      <div className="text-center py-16 text-slate-400">
                         <svg className="w-12 h-12 mx-auto text-slate-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                         <p className="text-lg font-medium text-slate-600">No public prompts</p>
                         <p className="text-sm mt-1">This user hasn&apos;t published any prompts yet.</p>
                      </div>
                   ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {currentPrompts.map((p) => {
                            const pStats = p.prompt_stats?.[0] || p.prompt_stats || {};
                            return (
                              <ProfilePromptCard
                                key={p.id}
                                prompt={{
                                  id: p.id,
                                  title: p.title || 'Untitled Prompt',
                                  slug: p.slug,
                                  model: p.model || 'AI Model',
                                  system_prompt: p.system_prompt || p.description || 'Click to view prompt details...',
                                  quality_score: pStats.score || pStats.quality_score || 0,
                                  copy_count: pStats.fork_count || 0,
                                  works_count: pStats.works_count || 0,
                                  fails_count: pStats.fails_count || 0,
                                }}
                              />
                            )
                          })}
                        </div>
                        {totalPromptsPages > 1 && (
                          <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
                            <button 
                              onClick={() => setPromptsPage(p => Math.max(1, p - 1))}
                              disabled={promptsPage === 1}
                              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                            >
                              ← Previous
                            </button>
                            <span className="text-sm font-medium text-slate-500">
                              Page {promptsPage} of {totalPromptsPages}
                            </span>
                            <button 
                              onClick={() => setPromptsPage(p => Math.min(totalPromptsPages, p + 1))}
                              disabled={promptsPage === totalPromptsPages}
                              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                            >
                              Next →
                            </button>
                          </div>
                        )}
                      </>
                   )}
                 </div>
               )}
               {tab === 'problems' && (
                 <div>
                   {problems.length === 0 ? (
                      <div className="text-center py-16 text-slate-400">
                         <svg className="w-12 h-12 mx-auto text-slate-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                         <p className="text-lg font-medium text-slate-600">No public problems</p>
                         <p className="text-sm mt-1">This user hasn&apos;t created any public problems yet.</p>
                      </div>
                   ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {currentProblems.map((p) => {
                            const pStats = p.problem_stats?.[0] || p.problem_stats || {};
                            return (
                              <Link href={problemUrl({id: p.id, slug: p.slug})} key={p.id} className="block group h-full">
                                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-blue-300 hover:shadow-md transition-all h-full flex flex-col">
                                  <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">{p.title}</h3>
                                    {p.difficulty && (
                                      <span className="shrink-0 px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full uppercase tracking-wider ml-2">
                                        {p.difficulty}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-grow">{p.goal || p.industry || 'No description available'}</p>
                                  <div className="flex justify-between text-xs font-semibold text-slate-500 mt-auto pt-4 border-t border-slate-100">
                                    <span className="flex items-center gap-1.5"><svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> {pStats.total_works || 0} Works</span>
                                    <span className="flex items-center gap-1.5"><svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg> {pStats.total_prompts || 0} Submissions</span>
                                  </div>
                                </div>
                              </Link>
                            )
                          })}
                        </div>
                        {totalProblemsPages > 1 && (
                          <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
                            <button 
                              onClick={() => setProblemsPage(p => Math.max(1, p - 1))}
                              disabled={problemsPage === 1}
                              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                            >
                              ← Previous
                            </button>
                            <span className="text-sm font-medium text-slate-500">
                              Page {problemsPage} of {totalProblemsPages}
                            </span>
                            <button 
                              onClick={() => setProblemsPage(p => Math.min(totalProblemsPages, p + 1))}
                              disabled={problemsPage === totalProblemsPages}
                              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                            >
                              Next →
                            </button>
                          </div>
                        )}
                      </>
                   )}
                 </div>
               )}
           </div>
        </div>
      </div>
    </div>
  );
}

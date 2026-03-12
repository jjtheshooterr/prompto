'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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
      {/* Banner */}
      <div className="h-48 md:h-64 bg-gradient-to-tr from-blue-700 via-indigo-600 to-purple-600 w-full relative">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20 bg-center"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-16 sm:-mt-20 mb-8 z-10">
          <div className="flex flex-col sm:flex-row sm:items-end gap-6">
             {/* Avatar */}
             <div className="relative shrink-0">
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white overflow-hidden bg-slate-100 shadow-lg relative z-10">
                   {profile.avatar_url ? (
                       <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
                   ) : (
                       <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-slate-300">
                           {profile.display_name.charAt(0).toUpperCase()}
                       </div>
                   )}
                </div>
                {/* Floating Badge */}
                {rawStats?.tier && (
                   <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md border border-slate-100 z-20">
                      <TierBadge tier={rawStats.tier} size="md" />
                   </div>
                )}
             </div>
             
             {/* Name and Basic Info */}
             <div className="flex-1 pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                   <h1 className="text-3xl font-bold text-slate-900">{profile.display_name}</h1>
                   {profile.username && <span className="text-lg text-slate-500 font-medium">@{profile.username}</span>}
                   {rawStats?.tier && (
                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-200 shadow-sm">
                          {rawStats.tier}
                       </span>
                   )}
                </div>
                {profile.headline && <p className="text-slate-700 mt-2 font-medium text-lg">{profile.headline}</p>}
                
                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-600">
                    {profile.location && (
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        <span>{profile.location}</span>
                      </div>
                    )}
                    {profile.website_url && (
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                        <a href={profile.website_url.startsWith('http') ? profile.website_url : `https://${profile.website_url}`} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 hover:underline truncate max-w-[200px]">{profile.website_url.replace(/^https?:\/\//, '')}</a>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 font-medium">
                       <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                       Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </div>
                </div>
             </div>
             
             {/* Action Buttons */}
             <div className="flex gap-3 pb-2 w-full sm:w-auto mt-4 sm:mt-0">
                 <button onClick={() => window.alert('Follow feature coming soon!')} className="flex-1 sm:flex-none px-8 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors shadow-sm">
                    Follow 
                 </button>
             </div>
          </div>
          {profile.bio && (
             <div className="mt-6 text-slate-600 max-w-3xl leading-relaxed">
                {profile.bio}
             </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-yellow-50 text-yellow-500 p-3 rounded-full group-hover:scale-110 transition-transform">
                   <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Points</p>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">{(rawStats?.total_points || 0).toLocaleString()}</h3>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-blue-50 text-blue-500 p-3 rounded-full group-hover:scale-110 transition-transform">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Solved</p>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">{(rawStats?.problems_solved || 0).toLocaleString()}</h3>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-purple-50 text-purple-500 p-3 rounded-full group-hover:scale-110 transition-transform">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Prompts</p>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">{prompts.length.toLocaleString()}</h3>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-green-50 text-green-500 p-3 rounded-full group-hover:scale-110 transition-transform">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Quality</p>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">
                    {(rawStats?.problems_solved || 0) > 0 ? (rawStats!.total_quality_score / rawStats!.problems_solved).toFixed(1) : '0.0'}
                </h3>
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
                         <p className="text-sm mt-1">This user hasn't published any prompts yet.</p>
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
                         <p className="text-sm mt-1">This user hasn't created any public problems yet.</p>
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

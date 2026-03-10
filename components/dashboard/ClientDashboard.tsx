'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/app/providers'
import { promptUrl } from '@/lib/utils/prompt-url'
import {
  User,
  Settings,
  Bell,
  Shield,
  Paintbrush,
  Edit3,
  Eye,
  GitCompare,
  FolderOpen,
  Terminal,
  GitBranch,
  ThumbsUp,
  Activity,
  ArrowRight,
  Plus,
  Play,
  FileText,
  MessageSquare
} from 'lucide-react'

interface UserProfile {
  username: string
  avatar_url: string | null
  created_at: string
}

interface UserStats {
  problemsCreated: number
  promptsSubmitted: number
  votesCast: number
  promptsForked: number
}

interface ActivityItem {
  id: string
  type: 'problem' | 'prompt' | 'vote' | 'fork'
  title: string
  subtitle?: string
  date: string
  link?: string
}

interface ActiveProblem {
  id: string;
  title: string;
  slug: string;
  created_by: string;
}

export default function ClientDashboard() {
  const { user, loading } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<UserStats>({
    problemsCreated: 0,
    promptsSubmitted: 0,
    votesCast: 0,
    promptsForked: 0,
  })
  const [draftPrompts, setDraftPrompts] = useState<any[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [activeProblems, setActiveProblems] = useState<ActiveProblem[]>([])

  useEffect(() => {
    if (loading) return
    const loadDashboardData = async () => {
      const supabase = createClient()

      if (!user) return

      // Load User Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username, avatar_url, created_at')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
      }

      // Fetch precise counts for top stats
      const [probCount, promptCount, voteCount, forkCount] = await Promise.all([
        supabase.from('problems').select('id', { count: 'exact', head: true }).eq('created_by', user.id),
        supabase.from('prompts').select('id', { count: 'exact', head: true }).eq('created_by', user.id),
        supabase.from('votes').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('prompts').select('id', { count: 'exact', head: true }).eq('created_by', user.id).not('parent_prompt_id', 'is', null)
      ])

      setStats({
        problemsCreated: probCount.count || 0,
        promptsSubmitted: promptCount.count || 0,
        votesCast: voteCount.count || 0,
        promptsForked: forkCount.count || 0,
      })

      // Fetch limited recent data for Activity Feed
      const [problemsResult, promptsResult, votesResult] = await Promise.all([
        supabase.from('problems').select('id, title, created_at, slug').eq('created_by', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('prompts').select('id, title, created_at, slug, problem_id, updated_at, parent_prompt_id').eq('created_by', user.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('votes').select('id, created_at, prompt_id').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
      ])

      // Process Draft Prompts for "Continue Working"
      const { data: recentDrafts } = await supabase
        .from('prompts')
        .select('*, problems(title)')
        .eq('created_by', user.id)
        .eq('is_deleted', false)
        .eq('status', 'draft')
        .order('updated_at', { ascending: false })
        .limit(4)

      setDraftPrompts(recentDrafts || [])

      // Process Active Problems
      // First find problem IDs the user has submitted prompts to
      if (promptsResult.data && promptsResult.data.length > 0) {
        const problemIds = [...new Set(promptsResult.data.filter(p => p.problem_id).map(p => p.problem_id))]
        if (problemIds.length > 0) {
          const { data: problemsData } = await supabase
            .from('problems')
            .select('id, title, slug, created_by')
            .in('id', problemIds.slice(0, 5))
          setActiveProblems(problemsData || [])
        }
      }

      // Generate Activity Feed by merging recent items
      const feedItems: ActivityItem[] = []

      problemsResult.data?.forEach(p => {
        feedItems.push({
          id: `prob-${p.id}`,
          type: 'problem',
          title: `Created Problem`,
          subtitle: p.title,
          date: p.created_at,
          link: `/problems/${p.slug}`
        })
      })

      // Fetch problem titles for the prompts
      const probIdsForPrompts = [...new Set(promptsResult.data?.filter(p => p.problem_id).map(p => p.problem_id))]
      let promptProblems: Record<string, string> = {}
      if (probIdsForPrompts.length > 0) {
        const { data: promptProbsData } = await supabase.from('problems').select('id, title').in('id', probIdsForPrompts)
        promptProbsData?.forEach(p => promptProblems[p.id] = p.title)
      }

      promptsResult.data?.forEach(p => {
        const isFork = p.parent_prompt_id !== null
        feedItems.push({
          id: `pmpt-${p.id}`,
          type: isFork ? 'fork' : 'prompt',
          title: isFork ? `Forked Prompt` : `Submitted Prompt`,
          subtitle: p.title + (p.problem_id && promptProblems[p.problem_id] ? ` for ${promptProblems[p.problem_id]}` : ''),
          date: p.created_at,
          link: promptUrl(p)
        })
      })

      if (votesResult.data && votesResult.data.length > 0) {
        const promptIds = [...new Set(votesResult.data.map(v => v.prompt_id))]
        const { data: votedPrompts } = await supabase.from('prompts').select('id, title, slug, short_id').in('id', promptIds)

        votesResult.data.forEach(v => {
          const prompt = votedPrompts?.find(p => p.id === v.prompt_id)
          if (prompt) {
            feedItems.push({
              id: `vote-${v.id}`,
              type: 'vote',
              title: `Voted on Prompt`,
              subtitle: prompt.title,
              date: v.created_at,
              link: promptUrl(prompt)
            })
          }
        })
      }

      // Sort combined feed descending
      feedItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setActivities(feedItems.slice(0, 5))
    }

    loadDashboardData()
  }, [user, loading])

  // Helper to get time ago
  const timeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    let interval = seconds / 31536000
    if (interval > 1) return Math.floor(interval) + " years ago"
    interval = seconds / 2592000
    if (interval > 1) return Math.floor(interval) + " months ago"
    interval = seconds / 86400
    if (interval > 1) {
      if (Math.floor(interval) === 1) return "Yesterday"
      return Math.floor(interval) + " days ago"
    }
    interval = seconds / 3600
    if (interval > 1) return Math.floor(interval) + " hours ago"
    interval = seconds / 60
    if (interval > 1) return Math.floor(interval) + " mins ago"
    return "Just now"
  }

  // Calculate Reputation and Rank
  // Formula: Votes Cast (1pt) + Prompts Submitted (10pts) + Problems Created (25pts) + Prompts Forked (5pts)
  const reputationScore = (stats.votesCast * 1) + (stats.promptsSubmitted * 10) + (stats.problemsCreated * 25) + (stats.promptsForked * 5)

  let rankIcon = "🥉"
  let rankText = "Bronze"
  if (reputationScore >= 500) { rankIcon = "🥇"; rankText = "Gold" }
  else if (reputationScore >= 200) { rankIcon = "🥈"; rankText = "Silver" }

  const joinDate = profile?.created_at
    ? new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date(profile.created_at))
    : 'Recently'

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center text-slate-500">Loading your command center...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-slate-900">Access Denied</h1>
          <p className="text-slate-600 mb-4">Please log in to view your dashboard.</p>
          <Link href="/login" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
            Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">

        {/* 1. Profile Overview (Top Section) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-6 flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden">
          <div className="w-24 h-24 rounded-full bg-blue-100 border-4 border-white shadow-md flex items-center justify-center flex-shrink-0 z-10 overflow-hidden">
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-blue-600" />
            )}
          </div>

          <div className="flex-1 text-center sm:text-left z-10 flex flex-col sm:flex-row justify-between w-full">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                {profile?.username || user.email?.split('@')[0] || 'User'}
              </h1>
              <p className="text-slate-500 mt-1">Member since {joinDate}</p>
            </div>

            <div className="mt-4 sm:mt-0 bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 flex flex-col items-center justify-center self-center sm:self-start min-w-[140px]">
              <div className="text-2xl font-bold text-slate-900">{reputationScore}</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1 mt-0.5">
                <span>{rankIcon}</span> {rankText} Rep
              </div>
            </div>
          </div>

          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full opacity-60 z-0 pointer-events-none"></div>
        </div>

        {/* 2. Activity Stats / Participation */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
              <FolderOpen className="w-5 h-5" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">{stats.problemsCreated}</h3>
            <p className="text-xs text-slate-500 font-medium tracking-wide">Problems Created</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center mb-2">
              <Terminal className="w-5 h-5" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">{stats.promptsSubmitted}</h3>
            <p className="text-xs text-slate-500 font-medium tracking-wide">Prompts Submitted</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mb-2">
              <GitBranch className="w-5 h-5" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">{stats.promptsForked}</h3>
            <p className="text-xs text-slate-500 font-medium tracking-wide">Prompts Forked</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
              <ThumbsUp className="w-5 h-5" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">{stats.votesCast}</h3>
            <p className="text-xs text-slate-500 font-medium tracking-wide">Votes Cast</p>
          </div>
        </div>

        {/* PRIMARY ACTIONS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <Link href="/problems" className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl shadow-sm text-center font-bold text-lg flex items-center justify-center gap-2 transition-colors">
            <Play className="w-5 h-5" />
            Solve a Problem
          </Link>
          <Link href="/create/prompt" className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 p-4 rounded-xl shadow-sm text-center font-bold text-lg flex items-center justify-center gap-2 transition-colors">
            <Plus className="w-5 h-5" />
            Create Prompt
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8">

          {/* Main Column */}
          <div className="md:col-span-2 space-y-10">

            {/* YOUR ACTIVE PROBLEMS */}
            <section>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                <FolderOpen className="w-5 h-5 text-blue-600 border border-blue-200 rounded p-0.5 bg-blue-50" />
                Your Active Problems
              </h2>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {activeProblems.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {activeProblems.map(prob => (
                      <div key={prob.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                        <div className="flex gap-3 items-center">
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-slate-600" />
                          </div>
                          <div>
                            <Link href={`/problems/${prob.slug}`} className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {prob.title}
                            </Link>
                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                              {prob.created_by === user.id ? (
                                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider">Owner</span>
                              ) : (
                                <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider">Participant</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors mr-2" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50/50">
                    <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-slate-900 mb-1">No active problems</h3>
                    <p className="text-xs text-slate-500 mb-4">Jump into a problem and submit a prompt.</p>
                    <Link href="/problems" className="inline-flex items-center justify-center rounded-lg bg-white border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
                      Browse Problems
                    </Link>
                  </div>
                )}
              </div>
            </section>

            {/* CONTINUE WORKING (DRAFTS) */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-slate-700 border border-slate-200 rounded p-0.5 bg-slate-50" />
                  Draft Prompts
                </h2>
                {draftPrompts.length > 0 && (
                  <Link href="/workspace" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center">
                    All Prompts <ArrowRight className="w-3 h-3 ml-1" />
                  </Link>
                )}
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {draftPrompts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 bg-slate-50/50">
                    {draftPrompts.map((prompt, i) => (
                      <div key={prompt.id} className={`p-5 hover:bg-white transition-colors cursor-pointer border-b ${i > 1 ? 'sm:border-b-0 sm:border-t border-slate-100' : ''}`} onClick={() => window.location.href = `/prompts/${prompt.id}/edit`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-slate-900 truncate pr-4 text-[15px]">{prompt.title}</h3>
                            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                              Last edited: {timeAgo(prompt.updated_at || prompt.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50/50">
                    <Edit3 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-slate-900 mb-1">No drafts in progress</h3>
                    <p className="text-xs text-slate-500 mb-0">You&apos;ve published all your recent work!</p>
                  </div>
                )}
              </div>
            </section>

          </div>

          {/* Right Column: Feed & Account Tools */}
          <div className="md:col-span-1 space-y-10">

            {/* Visual Activity Feed */}
            <section>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-slate-700" />
                Recent Activity
              </h2>

              <div className="space-y-3">
                {activities.length > 0 ? (
                  activities.map((item) => (
                    <div key={item.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex gap-3 hover:border-slate-300 transition-colors cursor-pointer" onClick={() => { if (item.link) window.location.href = item.link }}>
                      <div className={`mt-0.5 rounded-full w-8 h-8 flex items-center justify-center shrink-0 ${item.type === 'problem' ? 'bg-blue-100 text-blue-600' :
                        item.type === 'prompt' ? 'bg-green-100 text-green-600' :
                          item.type === 'fork' ? 'bg-orange-100 text-orange-600' : 'bg-purple-100 text-purple-600'
                        }`}>
                        {item.type === 'problem' && <FolderOpen className="w-4 h-4" />}
                        {item.type === 'prompt' && <FileText className="w-4 h-4" />}
                        {item.type === 'fork' && <GitBranch className="w-4 h-4" />}
                        {item.type === 'vote' && <ThumbsUp className="w-4 h-4" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">{item.title}</p>
                        {item.link ? (
                          <Link href={item.link} className="text-sm font-bold text-slate-900 hover:text-blue-600 block line-clamp-2 leading-tight">
                            {item.subtitle}
                          </Link>
                        ) : (
                          <p className="text-sm font-bold text-slate-900 line-clamp-2 leading-tight">{item.subtitle}</p>
                        )}
                        <p className="text-[11px] text-slate-400 mt-1.5">{timeAgo(item.date)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white rounded-xl border border-slate-200 p-6 text-center shadow-sm">
                    <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No activity yet. Start building your reputation!</p>
                  </div>
                )}
              </div>
            </section>

            {/* Account & Settings */}
            <section>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-slate-700" />
                Account & Settings
              </h2>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
                <Link href="/settings" className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors group">
                  <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Profile</h4>
                    <p className="text-xs text-slate-500">Username, bio, avatar</p>
                  </div>
                </Link>

                <Link href="/settings?tab=account" className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors group">
                  <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Security</h4>
                    <p className="text-xs text-slate-500">Password & email</p>
                  </div>
                </Link>

                <button disabled className="flex items-center gap-3 p-4 text-left w-full opacity-60 cursor-not-allowed">
                  <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-500 flex items-center justify-center">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Notifications</h4>
                    <p className="text-xs text-slate-500">Alerts & emails</p>
                  </div>
                </button>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/app/providers'
import { promptUrl, toDisplayString } from '@/lib/utils/prompt-url'
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
          subtitle: toDisplayString(p.title),
          date: p.created_at,
          link: `/problems/${p.slug}`
        })
      })

      // Fetch problem titles for the prompts
      const probIdsForPrompts = [...new Set(promptsResult.data?.filter(p => p.problem_id).map(p => p.problem_id))]
      let promptProblems: Record<string, string> = {}
      if (probIdsForPrompts.length > 0) {
        const { data: promptProbsData } = await supabase.from('problems').select('id, title').in('id', probIdsForPrompts)
        promptProbsData?.forEach(p => promptProblems[p.id] = toDisplayString(p.title))
      }

      promptsResult.data?.forEach(p => {
        const isFork = p.parent_prompt_id !== null
        feedItems.push({
          id: `pmpt-${p.id}`,
          type: isFork ? 'fork' : 'prompt',
          title: isFork ? `Forked Prompt` : `Submitted Prompt`,
          subtitle: toDisplayString(p.title) + (p.problem_id && promptProblems[p.problem_id] ? ` for ${promptProblems[p.problem_id]}` : ''),
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
              subtitle: toDisplayString(prompt.title),
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
      <div className="min-h-screen bg-background flex items-center justify-center font-sans">
        <div className="text-center text-muted-foreground">Loading your command center...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center font-sans">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-foreground">Access Denied</h1>
          <p className="text-muted-foreground mb-4">Please log in to view your dashboard.</p>
          <Link href="/login" className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors">
            Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background font-sans pb-12">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">

        {/* 1. Profile Overview (Top Section) */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 sm:p-8 mb-6 flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden">
          <div className="w-24 h-24 rounded-full bg-primary/10 border-4 border-background shadow-md flex items-center justify-center flex-shrink-0 z-10 overflow-hidden">
            {profile?.avatar_url ? (
              <Image src={profile.avatar_url} alt="Avatar" width={96} height={96} className="w-full h-full object-cover" unoptimized />
            ) : (
              <User className="w-10 h-10 text-primary" />
            )}
          </div>

          <div className="flex-1 text-center sm:text-left z-10 flex flex-col sm:flex-row justify-between w-full">
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                {profile?.username || user.email?.split('@')[0] || 'User'}
              </h1>
              <p className="text-muted-foreground mt-1">Member since {joinDate}</p>
            </div>

            <div className="mt-4 sm:mt-0 bg-muted border border-border rounded-xl px-5 py-3 flex flex-col items-center justify-center self-center sm:self-start min-w-[140px]">
              <div className="text-2xl font-bold text-foreground">{reputationScore}</div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mt-0.5">
                <span>{rankIcon}</span> {rankText} Rep
              </div>
            </div>
          </div>

          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/10 dark:from-primary/5 to-transparent rounded-bl-full opacity-60 z-0 pointer-events-none"></div>
        </div>

        {/* 2. Activity Stats / Participation */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-card p-5 rounded-xl border border-border shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 flex items-center justify-center mb-2 mt-0.5">
              <FolderOpen className="w-5 h-5" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">{stats.problemsCreated}</h3>
            <p className="text-xs text-muted-foreground font-medium tracking-wide">Problems Created</p>
          </div>
          <div className="bg-card p-5 rounded-xl border border-border shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 flex items-center justify-center mb-2 mt-0.5">
              <Terminal className="w-5 h-5" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">{stats.promptsSubmitted}</h3>
            <p className="text-xs text-muted-foreground font-medium tracking-wide">Prompts Submitted</p>
          </div>
          <div className="bg-card p-5 rounded-xl border border-border shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400 flex items-center justify-center mb-2 mt-0.5">
              <GitBranch className="w-5 h-5" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">{stats.promptsForked}</h3>
            <p className="text-xs text-muted-foreground font-medium tracking-wide">Prompts Forked</p>
          </div>
          <div className="bg-card p-5 rounded-xl border border-border shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400 flex items-center justify-center mb-2 mt-0.5">
              <ThumbsUp className="w-5 h-5" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">{stats.votesCast}</h3>
            <p className="text-xs text-muted-foreground font-medium tracking-wide">Votes Cast</p>
          </div>
        </div>

        {/* PRIMARY ACTIONS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <Link href="/problems" className="bg-primary hover:bg-primary/90 text-primary-foreground p-4 rounded-xl shadow-sm text-center font-bold text-lg flex items-center justify-center gap-2 transition-colors">
            <Play className="w-5 h-5" />
            Solve a Problem
          </Link>
          <Link href="/create/prompt" className="bg-card hover:bg-muted text-foreground border border-border p-4 rounded-xl shadow-sm text-center font-bold text-lg flex items-center justify-center gap-2 transition-colors">
            <Plus className="w-5 h-5" />
            Create Prompt
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8">

          {/* Main Column */}
          <div className="md:col-span-2 space-y-10">

            {/* YOUR ACTIVE PROBLEMS */}
            <section>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
                <FolderOpen className="w-5 h-5 text-primary border border-primary/20 rounded p-0.5 bg-primary/10" />
                Your Active Problems
              </h2>

              <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                {activeProblems.length > 0 ? (
                  <div className="divide-y divide-border">
                    {activeProblems.map(prob => (
                      <div key={prob.id} className="p-4 hover:bg-muted transition-colors flex items-center justify-between group">
                        <div className="flex gap-3 items-center">
                          <div className="w-10 h-10 bg-muted/50 rounded-lg flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <Link href={`/problems/${prob.slug}`} className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {toDisplayString(prob.title)}
                            </Link>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                              {prob.created_by === user.id ? (
                                <span className="bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider">Owner</span>
                              ) : (
                                <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider">Participant</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-primary transition-colors mr-2" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-muted/20">
                    <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-foreground mb-1">No active problems</h3>
                    <p className="text-xs text-muted-foreground mb-4">Jump into a problem and submit a prompt.</p>
                    <Link href="/problems" className="inline-flex items-center justify-center rounded-lg bg-card border border-border px-4 py-2 text-xs font-semibold text-foreground shadow-sm hover:bg-muted">
                      Browse Problems
                    </Link>
                  </div>
                )}
              </div>
            </section>

            {/* CONTINUE WORKING (DRAFTS) */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-muted-foreground border border-border rounded p-0.5 bg-muted" />
                  Draft Prompts
                </h2>
                {draftPrompts.length > 0 && (
                  <Link href="/workspace" className="text-sm text-primary hover:text-primary/80 font-medium flex items-center">
                    All Prompts <ArrowRight className="w-3 h-3 ml-1" />
                  </Link>
                )}
              </div>

              <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                {draftPrompts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border bg-muted/20">
                    {draftPrompts.map((prompt, i) => (
                      <div key={prompt.id} className={`p-5 hover:bg-card transition-colors cursor-pointer border-b ${i > 1 ? 'sm:border-b-0 sm:border-t border-border' : ''}`} onClick={() => window.location.href = `/prompts/${prompt.id}/edit`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-foreground truncate pr-4 text-[15px]">{toDisplayString(prompt.title)}</h3>
                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                              Last edited: {timeAgo(prompt.updated_at || prompt.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-muted/20">
                    <Edit3 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-foreground mb-1">No drafts in progress</h3>
                    <p className="text-xs text-muted-foreground mb-0">You&apos;ve published all your recent work!</p>
                  </div>
                )}
              </div>
            </section>

          </div>

          {/* Right Column: Feed & Account Tools */}
          <div className="md:col-span-1 space-y-10">

            {/* Visual Activity Feed */}
            <section>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-muted-foreground" />
                Recent Activity
              </h2>

              <div className="space-y-3">
                {activities.length > 0 ? (
                  activities.map((item) => (
                    <div key={item.id} className="bg-card rounded-xl border border-border shadow-sm p-4 flex gap-3 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => { if (item.link) window.location.href = item.link }}>
                      <div className={`mt-0.5 rounded-full w-8 h-8 flex items-center justify-center shrink-0 ${item.type === 'problem' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' :
                        item.type === 'prompt' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400' :
                          item.type === 'fork' ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400' : 'bg-purple-50 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400'
                        }`}>
                        {item.type === 'problem' && <FolderOpen className="w-4 h-4" />}
                        {item.type === 'prompt' && <FileText className="w-4 h-4" />}
                        {item.type === 'fork' && <GitBranch className="w-4 h-4" />}
                        {item.type === 'vote' && <ThumbsUp className="w-4 h-4" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">{item.title}</p>
                        {item.link ? (
                          <Link href={item.link} className="text-sm font-bold text-foreground hover:text-primary block line-clamp-2 leading-tight">
                            {item.subtitle}
                          </Link>
                        ) : (
                          <p className="text-sm font-bold text-foreground line-clamp-2 leading-tight">{item.subtitle}</p>
                        )}
                        <p className="text-[11px] text-muted-foreground/70 mt-1.5">{timeAgo(item.date)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-card rounded-xl border border-border p-6 text-center shadow-sm">
                    <MessageSquare className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No activity yet. Start building your reputation!</p>
                  </div>
                )}
              </div>
            </section>

            {/* Account & Settings */}
            <section>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-muted-foreground" />
                Account & Settings
              </h2>

              <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden divide-y divide-border">
                <Link href="/settings" className="flex items-center gap-3 p-4 hover:bg-muted transition-colors group">
                  <div className="w-8 h-8 rounded-md bg-muted/50 text-muted-foreground flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Profile</h4>
                    <p className="text-xs text-muted-foreground">Username, bio, avatar</p>
                  </div>
                </Link>

                <Link href="/settings?tab=account" className="flex items-center gap-3 p-4 hover:bg-muted transition-colors group">
                  <div className="w-8 h-8 rounded-md bg-muted/50 text-muted-foreground flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Security</h4>
                    <p className="text-xs text-muted-foreground">Password & email</p>
                  </div>
                </Link>

                <button disabled className="flex items-center gap-3 p-4 text-left w-full opacity-50 cursor-not-allowed">
                  <div className="w-8 h-8 rounded-md bg-muted/50 text-muted-foreground flex items-center justify-center">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Notifications</h4>
                    <p className="text-xs text-muted-foreground">Alerts & emails</p>
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

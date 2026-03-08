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
  ArrowRight
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
  date: string
  link?: string
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
  const [recentPrompts, setRecentPrompts] = useState<any[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])

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

      // Load user statistics
      const [problemsResult, promptsResult, votesResult, forksResult] = await Promise.all([
        supabase.from('problems').select('id, title, created_at, slug').eq('created_by', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('prompts').select('id, title, created_at, slug, problem_id, updated_at, parent_prompt_id').eq('created_by', user.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('votes').select('id, created_at, prompt_id').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('prompts').select('id').eq('created_by', user.id).not('parent_prompt_id', 'is', null)
      ])

      // The top-level counts are fetched below precisely with count: exact

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

      // Process Recent Prompts for "Continue Working"
      // We sort by updated_at to get recently edited ones
      const { data: recentEdits } = await supabase
        .from('prompts')
        .select('*, problems(title)')
        .eq('created_by', user.id)
        .eq('is_deleted', false)
        .order('updated_at', { ascending: false })
        .limit(3)

      setRecentPrompts(recentEdits || [])

      // Generate Activity Feed by merging recent items
      const feedItems: ActivityItem[] = []

      problemsResult.data?.forEach(p => {
        feedItems.push({
          id: `prob-${p.id}`,
          type: 'problem',
          title: `You created a new problem: "${p.title}"`,
          date: p.created_at,
          link: `/problems/${p.slug}`
        })
      })

      promptsResult.data?.forEach(p => {
        const isFork = p.parent_prompt_id !== null
        feedItems.push({
          id: `pmpt-${p.id}`,
          type: isFork ? 'fork' : 'prompt',
          title: isFork ? `You forked a prompt: "${p.title}"` : `You submitted a prompt: "${p.title}"`,
          date: p.created_at,
          link: promptUrl(p)
        })
      })

      // To get vote details we'd need to join prompts, skipping for simplicity or running a quick fetch
      if (votesResult.data && votesResult.data.length > 0) {
        const promptIds = [...new Set(votesResult.data.map(v => v.prompt_id))]
        const { data: votedPrompts } = await supabase.from('prompts').select('id, title, slug, short_id').in('id', promptIds)

        votesResult.data.forEach(v => {
          const prompt = votedPrompts?.find(p => p.id === v.prompt_id)
          if (prompt) {
            feedItems.push({
              id: `vote-${v.id}`,
              type: 'vote',
              title: `You voted on "${prompt.title}"`,
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
    if (interval > 1) return Math.floor(interval) + " minutes ago"
    return "Just now"
  }

  // Profile date format
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

          <div className="flex-1 text-center sm:text-left z-10">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              {profile?.username || user.email?.split('@')[0] || 'User'}
            </h1>
            <p className="text-slate-500 mt-1">Member since {joinDate}</p>

            <div className="mt-6 flex flex-wrap justify-center sm:justify-start gap-x-8 gap-y-4">
              <div className="text-center sm:text-left">
                <p className="text-sm font-medium text-slate-500">Problems Created</p>
                <p className="text-lg font-bold text-slate-900">{stats.problemsCreated}</p>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-sm font-medium text-slate-500">Prompts</p>
                <p className="text-lg font-bold text-slate-900">{stats.promptsSubmitted}</p>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-sm font-medium text-slate-500">Forks</p>
                <p className="text-lg font-bold text-slate-900">{stats.promptsForked}</p>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-sm font-medium text-slate-500">Votes Cast</p>
                <p className="text-lg font-bold text-slate-900">{stats.votesCast}</p>
              </div>
            </div>
          </div>

          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full opacity-60 z-0 pointer-events-none"></div>
        </div>

        {/* 2. Activity Stats / Participation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
              <FolderOpen className="w-5 h-5" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">{stats.problemsCreated}</h3>
            <p className="text-xs text-slate-500 font-medium">Problems Created</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center mb-2">
              <Terminal className="w-5 h-5" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">{stats.promptsSubmitted}</h3>
            <p className="text-xs text-slate-500 font-medium">Prompts Submitted</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mb-2">
              <GitBranch className="w-5 h-5" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">{stats.promptsForked}</h3>
            <p className="text-xs text-slate-500 font-medium">Prompts Forked</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
              <ThumbsUp className="w-5 h-5" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">{stats.votesCast}</h3>
            <p className="text-xs text-slate-500 font-medium">Votes Cast</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">

          {/* Main Column */}
          <div className="md:col-span-2 space-y-8">

            {/* 3. Continue Working */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-blue-600" />
                  Continue Working
                </h2>
                {recentPrompts.length > 0 && (
                  <Link href="/workspace" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center">
                    All Prompts <ArrowRight className="w-3 h-3 ml-1" />
                  </Link>
                )}
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {recentPrompts.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {recentPrompts.map(prompt => (
                      <div key={prompt.id} className="p-5 hover:bg-slate-50 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <Link href={promptUrl(prompt)} className="font-semibold text-slate-900 hover:text-blue-600 truncate block text-lg">
                              {prompt.title}
                            </Link>
                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                              {prompt.problems?.title && (
                                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">{prompt.problems.title}</span>
                              )}
                              <span>Last edited: {timeAgo(prompt.updated_at || prompt.created_at)}</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Link
                              href={`/prompts/${prompt.id}/edit`}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                              title="Edit Prompt"
                            >
                              <Edit3 className="w-4 h-4" />
                            </Link>
                            <Link
                              href={promptUrl(prompt)}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
                              title="View Prompt"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <Link
                              href={`/compare?p1=${prompt.id}`}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
                              title="Compare"
                            >
                              <GitCompare className="w-4 h-4" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50/50">
                    <Terminal className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-slate-900 mb-1">No recent prompts</h3>
                    <p className="text-xs text-slate-500 mb-4">Start solving problems to see your work here.</p>
                    <Link href="/problems" className="inline-flex items-center justify-center rounded-lg bg-white border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
                      Browse Problems
                    </Link>
                  </div>
                )}
              </div>
            </section>

            {/* 4. Activity Feed */}
            <section>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-blue-600" />
                Recent Activity
              </h2>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                {activities.length > 0 ? (
                  <div className="relative border-l border-slate-200 ml-3 space-y-6 pb-2">
                    {activities.map((item, index) => (
                      <div key={item.id} className="relative pl-6">
                        <div className={`absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-white ${item.type === 'problem' ? 'bg-blue-500' :
                          item.type === 'prompt' ? 'bg-green-500' :
                            item.type === 'fork' ? 'bg-orange-500' : 'bg-purple-500'
                          }`}></div>
                        <div>
                          {item.link ? (
                            <Link href={item.link} className="text-sm font-medium text-slate-900 hover:text-blue-600 hover:underline">
                              {item.title}
                            </Link>
                          ) : (
                            <p className="text-sm font-medium text-slate-900">{item.title}</p>
                          )}
                          <p className="text-xs text-slate-500 mt-1">{timeAgo(item.date)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-slate-500">No recent activity found. Jump into a problem and start contributing!</p>
                  </div>
                )}
              </div>
            </section>

          </div>

          {/* Right Column: Account & Tools */}
          <div className="md:col-span-1 border-t md:border-t-0 pt-8 md:pt-0 border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-slate-600" />
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
                  <p className="text-xs text-slate-500">Coming soon</p>
                </div>
              </button>

              <button disabled className="flex items-center gap-3 p-4 text-left w-full opacity-60 cursor-not-allowed">
                <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-500 flex items-center justify-center">
                  <Paintbrush className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Appearance</h4>
                  <p className="text-xs text-slate-500">Coming soon</p>
                </div>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

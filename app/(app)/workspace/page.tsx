'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  FolderOpen,
  Zap,
  Globe,
  Lock,
  Compass,
  Plus,
  LayoutGrid,
  List,
  Eye,
  Terminal,
  Link as LinkIcon
} from 'lucide-react'

// Helper function to format dates
function formatDate(dateString: string) {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

// Helper to format large numbers
function formatNumber(num: number) {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
}

interface Problem {
  id: string
  slug: string
  title: string
  description: string
  visibility: 'public' | 'unlisted' | 'private'
  created_at: string
  prompts?: any[]
  member_role?: string
}

export default function WorkspacePage() {
  const [user, setUser] = useState<any>(null)
  const [ownedProblems, setOwnedProblems] = useState<Problem[]>([])
  const [memberProblems, setMemberProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProblem, setSelectedProblem] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filter, setFilter] = useState<'all' | 'public' | 'unlisted' | 'private'>('all')

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()

      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) {
        setLoading(false)
        return
      }

      setUser(currentUser)

      try {
        // Get all problems owned by the user (including private/unlisted)
        const { data: ownedProblems, error: ownedError } = await supabase
          .from('problems')
          .select('*')
          .eq('owner_id', currentUser.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })

        if (ownedError) {
          console.error('Error fetching owned problems:', ownedError)
        } else {
          // Get prompt counts for owned problems
          const ownedWithCounts = await Promise.all(
            (ownedProblems || []).map(async (problem) => {
              const { count } = await supabase
                .from('prompts')
                .select('id', { count: 'exact' })
                .eq('problem_id', problem.id)
                .eq('is_deleted', false)

              return {
                ...problem,
                prompts: Array(count || 0).fill(null)
              }
            })
          )
          setOwnedProblems(ownedWithCounts)
        }

        // Get problems where user is a member - simplified approach
        const { data: membershipData, error: memberError } = await supabase
          .from('problem_members')
          .select('problem_id, role')
          .eq('user_id', currentUser.id)

        if (memberError) {
          console.error('Error fetching member problems:', memberError)
        } else if (membershipData && membershipData.length > 0) {
          // Get the actual problems for these memberships
          const problemIds = membershipData.map(m => m.problem_id)
          const { data: memberProblemsData, error: problemsError } = await supabase
            .from('problems')
            .select('*')
            .in('id', problemIds)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false })

          if (problemsError) {
            console.error('Error fetching member problem details:', problemsError)
          } else {
            // Get prompt counts and combine with membership roles
            const memberWithCounts = await Promise.all(
              (memberProblemsData || []).map(async (problem: any) => {
                const { count } = await supabase
                  .from('prompts')
                  .select('id', { count: 'exact' })
                  .eq('problem_id', problem.id)
                  .eq('is_deleted', false)

                const membership = membershipData.find(m => m.problem_id === problem.id)

                return {
                  ...problem,
                  member_role: membership?.role,
                  prompts: Array(count || 0).fill(null)
                } as Problem
              })
            )
            setMemberProblems(memberWithCounts)
          }
        }
      } catch (error) {
        console.error('Error loading workspace data:', error)
      }

      setLoading(false)
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center text-slate-500">Loading workspace...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-slate-900">Access Denied</h1>
          <p className="text-slate-600 mb-4">You must be logged in to access your workspace.</p>
          <Link href="/login" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Login
          </Link>
        </div>
      </div>
    )
  }

  // Combine and deduplicate problems (in case owner is also listed as a member)
  const allProblemsMap = new Map<string, Problem>()

  ownedProblems.forEach(p => allProblemsMap.set(p.id, p))
  memberProblems.forEach(p => {
    if (!allProblemsMap.has(p.id)) {
      allProblemsMap.set(p.id, p)
    }
  })

  const allProblems = Array.from(allProblemsMap.values())
  const totalProblems = allProblems.length

  // Need to safely handle cases where prompts array might not exist or might contain empty objects
  const totalPrompts = allProblems.reduce((sum, problem) => {
    return sum + (problem.prompts ? problem.prompts.length : 0);
  }, 0)

  const publicProblems = allProblems.filter(p => p.visibility === 'public').length
  const privateProblems = allProblems.filter(p => p.visibility === 'private').length
  const unlistedProblems = allProblems.filter(p => p.visibility === 'unlisted').length

  // Apply filters
  const displayedProblems = allProblems.filter(p => {
    if (filter === 'all') return true
    return p.visibility === filter
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 font-sans">
      {/* Workspace Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Workspace</h1>
          <p className="text-slate-500">Manage your problems and prompt solutions in one place.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/problems"
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <Compass className="w-4 h-4 mr-2" />
            Browse Problems
          </Link>
          <Link
            href="/create/problem"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Problem
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Problems</p>
              <h3 className="text-2xl font-bold text-slate-900">{totalProblems}</h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FolderOpen className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Prompts</p>
              <h3 className="text-2xl font-bold text-slate-900">{totalPrompts}</h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
              <Zap className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Public Problems</p>
              <h3 className="text-2xl font-bold text-slate-900">{publicProblems}</h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
              <Globe className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Private Problems</p>
              <h3 className="text-2xl font-bold text-slate-900">{privateProblems}</h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              <Lock className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="flex flex-wrap items-center gap-2 mb-8 border-b border-slate-200 pb-6">
        <button
          onClick={() => setFilter('all')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === 'all' ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          All <span className={`text-xs ${filter === 'all' ? 'opacity-90 font-medium' : 'opacity-60 font-normal'}`}>{totalProblems}</span>
        </button>
        <button
          onClick={() => setFilter('public')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === 'public' ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          <Globe className="w-4 h-4" />
          Public <span className={`text-xs ${filter === 'public' ? 'opacity-90 font-medium' : 'opacity-60 font-normal'}`}>{publicProblems}</span>
        </button>
        <button
          onClick={() => setFilter('unlisted')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === 'unlisted' ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          <LinkIcon className="w-4 h-4" />
          Unlisted <span className={`text-xs ${filter === 'unlisted' ? 'opacity-90 font-medium' : 'opacity-60 font-normal'}`}>{unlistedProblems}</span>
        </button>
        <button
          onClick={() => setFilter('private')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === 'private' ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          <Lock className="w-4 h-4" />
          Private <span className={`text-xs ${filter === 'private' ? 'opacity-90 font-medium' : 'opacity-60 font-normal'}`}>{privateProblems}</span>
        </button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900">Recent Problems</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md ${viewMode === 'grid' ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md ${viewMode === 'list' ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Problem Grid Section */}
      <div className={viewMode === 'grid'
        ? "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        : "flex flex-col gap-4"}>

        {displayedProblems.map((problem) => (
          <div key={problem.id} className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                {problem.visibility === 'public' && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                    <Globe className="w-3.5 h-3.5" />
                    Public
                  </span>
                )}
                {problem.visibility === 'private' && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-500/20">
                    <Lock className="w-3.5 h-3.5" />
                    Private
                  </span>
                )}
                {problem.visibility === 'unlisted' && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
                    <LinkIcon className="w-3.5 h-3.5" />
                    Unlisted
                  </span>
                )}
                <span className="text-xs text-slate-400">{formatDate(problem.created_at)}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                <Link href={`/problems/${problem.slug}`} className="hover:text-blue-600 transition-colors">
                  {problem.title}
                </Link>
              </h3>
              <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                {problem.description || "No description provided."}
              </p>
              <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                <span className="flex items-center gap-1">
                  <Terminal className="w-4 h-4" />
                  {problem.prompts ? problem.prompts.length : 0} Prompts
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {/* View count is mocked here since it's not readily available in the problems query without joined stats */}
                  0 views
                </span>
              </div>
            </div>

            <div className="mt-auto border-t border-slate-100 p-4 flex gap-2">
              <Link
                href={`/problems/${problem.slug}`}
                className="flex flex-1 items-center justify-center rounded-lg bg-slate-50 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                View Problem
              </Link>
              <Link
                href={`/prompts/new?problemId=${problem.id}`}
                className="flex flex-1 items-center justify-center rounded-lg bg-blue-50 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
              >
                Add Prompt
              </Link>
            </div>
          </div>
        ))}

        {/* Create New Placeholder (only in grid view) */}
        {viewMode === 'grid' && (
          <Link
            href="/create/problem"
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 transition-colors hover:border-blue-500/50 hover:bg-blue-50"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
              <Plus className="w-8 h-8" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-slate-900">Create new problem</h3>
            <p className="mt-1 text-xs text-slate-500 text-center">Start a new project or category for your prompts</p>
            <span className="mt-4 text-xs font-bold text-blue-600">Get started</span>
          </Link>
        )}
      </div>

      {displayedProblems.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">No problems match the current filter.</p>
        </div>
      )}

      {/* Footer Pagination Placeholder - Logic can be added later if needed */}
      <div className="mt-12 flex items-center justify-between border-t border-slate-200 pt-6">
        <p className="text-sm text-slate-500">Showing {displayedProblems.length} of {totalProblems} problems</p>
        <div className="flex gap-2">
          <button className="rounded-lg border border-slate-200 px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50" disabled>Previous</button>
          <button className="rounded-lg border border-slate-200 px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50" disabled>Next</button>
        </div>
      </div>
    </div>
  )
}

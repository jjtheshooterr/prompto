'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { toDisplayString } from '@/lib/utils/prompt-url'
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
  visibility: 'public' | 'private'
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
  const [filter, setFilter] = useState<'all' | 'public' | 'private'>('all')

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
        <div className="text-center text-muted-foreground">Loading workspace...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-foreground">Access Denied</h1>
          <p className="text-muted-foreground mb-4">You must be logged in to access your workspace.</p>
          <Link href="/login" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">My Workspace</h1>
          <p className="text-muted-foreground">Manage your problems and prompt solutions in one place.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/problems"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm hover:bg-muted"
          >
            <Compass className="w-4 h-4 mr-2" />
            Browse Problems
          </Link>
          <Link
            href="/create/problem"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Problem
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Problems</p>
              <h3 className="text-2xl font-bold text-foreground">{totalProblems}</h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FolderOpen className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Prompts</p>
              <h3 className="text-2xl font-bold text-foreground">{totalPrompts}</h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <Zap className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Public Problems</p>
              <h3 className="text-2xl font-bold text-foreground">{publicProblems}</h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <Globe className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Private Problems</p>
              <h3 className="text-2xl font-bold text-foreground">{privateProblems}</h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Lock className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="flex flex-wrap items-center gap-2 mb-8 border-b border-border pb-6">
        <button
          onClick={() => setFilter('all')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === 'all' ? 'bg-primary text-primary-foreground font-semibold shadow-sm' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
        >
          All <span className={`text-xs ${filter === 'all' ? 'opacity-90 font-medium' : 'opacity-60 font-normal'}`}>{totalProblems}</span>
        </button>
        <button
          onClick={() => setFilter('public')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === 'public' ? 'bg-primary text-primary-foreground font-semibold shadow-sm' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
        >
          <Globe className="w-4 h-4" />
          Public <span className={`text-xs ${filter === 'public' ? 'opacity-90 font-medium' : 'opacity-60 font-normal'}`}>{publicProblems}</span>
        </button>
        <button
          onClick={() => setFilter('private')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === 'private' ? 'bg-primary text-primary-foreground font-semibold shadow-sm' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
        >
          <Lock className="w-4 h-4" />
          Private <span className={`text-xs ${filter === 'private' ? 'opacity-90 font-medium' : 'opacity-60 font-normal'}`}>{privateProblems}</span>
        </button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">Recent Problems</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md ${viewMode === 'grid' ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md ${viewMode === 'list' ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'}`}
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
          <div key={problem.id} className="flex flex-col rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                {problem.visibility === 'public' && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 ring-1 ring-inset ring-emerald-500/20">
                    <Globe className="w-3.5 h-3.5" />
                    Public
                  </span>
                )}
                {problem.visibility === 'private' && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground ring-1 ring-inset ring-border">
                    <Lock className="w-3.5 h-3.5" />
                    Private
                  </span>
                )}
                <span className="text-xs text-muted-foreground">{formatDate(problem.created_at)}</span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                <Link href={`/problems/${problem.slug}`} className="hover:text-primary transition-colors">
                  {toDisplayString(problem.title)}
                </Link>
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                {toDisplayString(problem.description) || "No description provided."}
              </p>
              <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
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

            <div className="mt-auto border-t border-border p-4 flex gap-2">
              <Link
                href={`/problems/${problem.slug}`}
                className="flex flex-1 items-center justify-center rounded-lg bg-muted py-2 text-xs font-semibold text-foreground hover:bg-muted/80 transition-colors"
              >
                View Problem
              </Link>
              <Link
                href={`/create/prompt?problem=${problem.id}`}
                className="flex flex-1 items-center justify-center rounded-lg bg-primary/10 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
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
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/50 p-6 transition-colors hover:border-primary/50 hover:bg-primary/10"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-card text-muted-foreground shadow-sm">
              <Plus className="w-8 h-8" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-foreground">Create new problem</h3>
            <p className="mt-1 text-xs text-muted-foreground text-center">Start a new project or category for your prompts</p>
            <span className="mt-4 text-xs font-bold text-primary">Get started</span>
          </Link>
        )}
      </div>

      {displayedProblems.length === 0 && (
        <div className="text-center py-12 bg-muted rounded-lg">
          <p className="text-muted-foreground mb-4">No problems match the current filter.</p>
        </div>
      )}

      {/* Footer Pagination Placeholder - Logic can be added later if needed */}
      <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
        <p className="text-sm text-muted-foreground">Showing {displayedProblems.length} of {totalProblems} problems</p>
        <div className="flex gap-2">
          <button className="rounded-lg border border-border px-3 py-1 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50" disabled>Previous</button>
          <button className="rounded-lg border border-border px-3 py-1 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50" disabled>Next</button>
        </div>
      </div>
    </div>
  )
}

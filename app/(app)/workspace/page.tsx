'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import ProblemCard from '@/components/workspace/ProblemCard'
import MemberManagement from '@/components/workspace/MemberManagement'

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
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading workspace...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You must be logged in to access your workspace.</p>
          <Link href="/login" className="text-blue-600 hover:underline">
            Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">My Workspace</h1>
        <p className="text-gray-600">
          Manage your problems, collaborate with team members, and control visibility settings.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mb-8 flex gap-4">
        <Link
          href="/create/problem"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create New Problem
        </Link>
        <Link
          href="/problems"
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Browse Public Problems
        </Link>
      </div>

      {/* Owned Problems */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">My Problems</h2>
          <span className="text-sm text-gray-500">
            {ownedProblems.length} problem{ownedProblems.length !== 1 ? 's' : ''}
          </span>
        </div>

        {ownedProblems.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-4">You haven't created any problems yet.</p>
            <Link
              href="/create/problem"
              className="text-blue-600 hover:underline font-medium"
            >
              Create your first problem
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {ownedProblems.map((problem) => (
              <ProblemCard
                key={problem.id}
                problem={problem}
                isOwner={true}
                onManageMembers={() => setSelectedProblem(problem.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Member Problems */}
      {memberProblems.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Collaborative Problems</h2>
            <span className="text-sm text-gray-500">
              {memberProblems.length} problem{memberProblems.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {memberProblems.map((problem) => (
              <ProblemCard
                key={problem.id}
                problem={problem}
                isOwner={false}
                memberRole={problem.member_role}
              />
            ))}
          </div>
        </div>
      )}

      {/* Member Management Modal */}
      {selectedProblem && (
        <MemberManagement
          problemId={selectedProblem}
          onClose={() => setSelectedProblem(null)}
          onUpdate={() => {
            // Refresh data
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}
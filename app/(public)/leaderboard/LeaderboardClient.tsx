'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LeaderboardUser, LeaderboardPrompt } from '@/lib/actions/leaderboard.actions'
import { problemUrl, promptUrl, toDisplayString } from '@/lib/utils/prompt-url'
import { TierBadge } from '@/components/badges/TierBadge'

interface LeaderboardClientProps {
  initialUsers: LeaderboardUser[]
  initialPrompts: LeaderboardPrompt[]
}

export default function LeaderboardClient({ initialUsers, initialPrompts }: LeaderboardClientProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'prompts'>('users')

  return (
    <div className="flex flex-col gap-6">
      {/* Custom Tabs */}
      <div className="flex justify-center">
        <div className="inline-flex bg-muted p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
              activeTab === 'users'
                ? 'bg-card text-primary shadow-sm ring-1 ring-border'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
            }`}
          >
            Top Engineers
          </button>
          <button
            onClick={() => setActiveTab('prompts')}
            className={`px-6 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
              activeTab === 'prompts'
                ? 'bg-card text-primary shadow-sm ring-1 ring-border'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
            }`}
          >
            Highest Rated Prompts
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex-grow">
        
        {/* Table Content */}
        <div className="overflow-x-auto">
          {activeTab === 'users' ? (
            <UserTable users={initialUsers} />
          ) : (
            <PromptTable prompts={initialPrompts} />
          )}
        </div>
      </div>
    </div>
  )
}

const RANK_MEDALS = ['🥇', '🥈', '🥉']
const RANK_ROW_STYLES = [
  'bg-yellow-500/5 dark:bg-yellow-500/10',
  'bg-slate-400/5 dark:bg-slate-400/10',
  'bg-amber-600/5 dark:bg-amber-600/10',
]

function UserTable({ users }: { users: LeaderboardUser[] }) {
  if (!users || users.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        No engineers found yet. Be the first to solve a problem!
      </div>
    )
  }

  return (
    <table className="w-full text-sm text-left">
      <thead className="bg-muted border-b border-border text-xs uppercase font-semibold text-muted-foreground tracking-wider">
        <tr>
          <th className="px-4 py-4 w-14 text-center">Rank</th>
          <th className="px-4 py-4">Engineer</th>
          <th className="px-4 py-4 text-center">Tier</th>
          <th className="px-4 py-4 text-right">Points</th>
          <th className="px-4 py-4 text-right">Solved</th>
          <th className="px-4 py-4 text-right">Avg Quality</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border text-foreground">
        {users.map((user, index) => {
          const rank = index + 1
          const isTop3 = rank <= 3
          const medal = isTop3 ? RANK_MEDALS[rank - 1] : null
          const rowStyle = isTop3 ? RANK_ROW_STYLES[rank - 1] : ''

          return (
            <tr key={user.user_id} className={`hover:bg-muted/60 transition-colors group ${rowStyle}`}>
              <td className="px-4 py-4 text-center">
                {medal ? (
                  <span className="text-xl leading-none">{medal}</span>
                ) : (
                  <span className="text-sm font-semibold text-muted-foreground">#{rank}</span>
                )}
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  {user.username ? (
                    <Link href={`/u/${user.username}`}>
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="avatar" className="w-8 h-8 rounded-full border border-border object-cover hover:ring-2 hover:ring-primary transition-all" />
                      ) : (
                        <div className="w-8 h-8 bg-primary/10 text-primary font-bold flex items-center justify-center rounded-full text-xs hover:ring-2 hover:ring-primary transition-all">
                          {(user.display_name || user.username || 'U')[0].toUpperCase()}
                        </div>
                      )}
                    </Link>
                  ) : (
                    <>
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="avatar" className="w-8 h-8 rounded-full border border-border object-cover" />
                      ) : (
                        <div className="w-8 h-8 bg-primary/10 text-primary font-bold flex items-center justify-center rounded-full text-xs">
                          {(user.display_name || user.user_id.split('-')[0])[0].toUpperCase()}
                        </div>
                      )}
                    </>
                  )}
                  <div className="flex flex-col min-w-0">
                    {user.username ? (
                      <Link href={`/u/${user.username}`} className="font-semibold text-foreground hover:text-primary transition-colors truncate">
                        {user.display_name || 'Anonymous Engineer'}
                        {rank === 1 && <span className="ml-1.5 text-[10px] font-bold text-yellow-500 uppercase tracking-wider">👑 Leader</span>}
                      </Link>
                    ) : (
                      <span className="font-semibold text-foreground truncate">
                        {user.display_name || 'Anonymous Engineer'}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground truncate">
                      @{user.username || user.user_id.split('-')[0]}
                    </span>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 text-center">
                <div className="flex flex-col items-center justify-center gap-1">
                  <TierBadge tier={user.tier} size="md" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {user.tier}
                  </span>
                </div>
              </td>
              <td className="px-4 py-4 text-right font-bold text-foreground tabular-nums">
                {user.total_points.toLocaleString()}
              </td>
              <td className="px-4 py-4 text-right font-medium tabular-nums">
                {user.problems_solved}
              </td>
              <td className="px-4 py-4 text-right font-medium tabular-nums">
                {user.problems_solved > 0 ? (user.total_quality_score / user.problems_solved).toFixed(1) : '0.0'}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function PromptTable({ prompts }: { prompts: LeaderboardPrompt[] }) {
  if (!prompts || prompts.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        No high-quality prompts found yet.
      </div>
    )
  }

  return (
    <table className="w-full text-sm text-left">
      <thead className="bg-muted border-b border-border text-xs uppercase font-semibold text-muted-foreground tracking-wider">
        <tr>
          <th className="px-4 py-4 w-14 text-center">Rank</th>
          <th className="px-4 py-4">Prompt Solution</th>
          <th className="px-4 py-4">Problem</th>
          <th className="px-4 py-4">Author</th>
          <th className="px-4 py-4 text-right">Score</th>
          <th className="px-4 py-4 text-right">Forks</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border text-foreground">
        {prompts.map((prompt, index) => {
          const rank = index + 1
          const isTop3 = rank <= 3
          const medal = isTop3 ? RANK_MEDALS[rank - 1] : null
          const rowStyle = isTop3 ? RANK_ROW_STYLES[rank - 1] : ''

          return (
            <tr key={prompt.prompt_id} className={`hover:bg-muted/60 transition-colors group ${rowStyle}`}>
              <td className="px-4 py-4 text-center">
                {medal ? (
                  <span className="text-xl leading-none">{medal}</span>
                ) : (
                  <span className="text-sm font-semibold text-muted-foreground">#{rank}</span>
                )}
              </td>
              <td className="px-4 py-4 max-w-[180px]">
                <Link
                  href={promptUrl({ id: prompt.prompt_id, slug: prompt.slug })}
                  className="font-semibold text-foreground group-hover:text-primary transition-colors block truncate"
                >
                  {toDisplayString(prompt.title)}
                </Link>
              </td>
              <td className="px-4 py-4 max-w-[160px]">
                <Link
                   href={`/problems/${prompt.problem_slug}`}
                   className="text-muted-foreground hover:text-foreground transition-colors text-xs bg-muted px-2 py-1 rounded inline-block truncate max-w-full"
                >
                  {toDisplayString(prompt.problem_title)}
                </Link>
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  {prompt.author_username ? (
                    <>
                      <Link href={`/u/${prompt.author_username}`}>
                        {prompt.author_avatar ? (
                          <img src={prompt.author_avatar} alt="avatar" className="w-6 h-6 rounded-full object-cover hover:ring-2 hover:ring-primary transition-all shrink-0" />
                        ) : (
                          <div className="w-6 h-6 bg-primary/10 text-primary font-bold flex items-center justify-center rounded-full text-[10px] hover:ring-2 hover:ring-primary transition-all shrink-0">
                            {(prompt.author_name || prompt.author_username || 'U')[0].toUpperCase()}
                          </div>
                        )}
                      </Link>
                      <Link href={`/u/${prompt.author_username}`} className="text-xs font-medium text-foreground hover:text-primary transition-colors truncate">
                        {prompt.author_name || 'Anonymous'}
                      </Link>
                    </>
                  ) : (
                    <>
                      {prompt.author_avatar ? (
                        <img src={prompt.author_avatar} alt="avatar" className="w-6 h-6 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-6 h-6 bg-primary/10 text-primary font-bold flex items-center justify-center rounded-full text-[10px] shrink-0">
                          {(prompt.author_name || 'U')[0].toUpperCase()}
                        </div>
                      )}
                      <span className="text-xs font-medium text-foreground truncate">
                        {prompt.author_name || 'Anonymous'}
                      </span>
                    </>
                  )}
                </div>
              </td>
              <td className="px-4 py-4 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                     <div
                       className={`h-full rounded-full ${prompt.quality_score >= 80 ? 'bg-green-500' : prompt.quality_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                       style={{ width: `${Math.min(100, prompt.quality_score)}%` }}
                     />
                  </div>
                  <span className="font-bold text-foreground tabular-nums w-7 text-right">
                    {prompt.quality_score}
                  </span>
                </div>
              </td>
              <td className="px-4 py-4 text-right">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 text-primary tabular-nums">
                  <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
                  {prompt.forks}
                </span>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

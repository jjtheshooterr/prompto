import { getTopUsers, getTopPrompts } from '@/lib/actions/leaderboard.actions'
import LeaderboardClient from './LeaderboardClient'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Leaderboard | PromptVexity',
  description: 'Top prompt engineers and highest-rated AI prompts on PromptVexity.',
}

// Revalidate every 24 hours (86400 seconds) since the MV updates on that schedule
export const revalidate = 86400

export default async function LeaderboardPage() {
  // Fetch both leaderboards in parallel
  const [topUsers, topPrompts] = await Promise.all([
    getTopUsers(100),
    getTopPrompts(100)
  ])

  return (
    <div className="bg-background min-h-screen text-foreground flex flex-col pt-8">
      <main className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 w-full">
        {/* Header Section */}
        <div className="mb-8 text-center max-w-2xl mx-auto">
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            The Leaderboard
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            Showcasing the top prompt engineers and the highest-rated solutions in the community.
            Rankings are updated every 24 hours based on AI evaluations and community forks.
          </p>
        </div>

        {/* Client Component for Tabs & Table */}
        <LeaderboardClient initialUsers={topUsers} initialPrompts={topPrompts} />
      </main>
    </div>
  )
}

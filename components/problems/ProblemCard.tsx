import Link from 'next/link'
import { AuthorChip } from '@/components/common/AuthorChip'
import { toDisplayString } from '@/lib/utils/prompt-url'

interface ProblemCardProps {
  problem: {
    id: string
    slug: string
    title: string
    description: string | null
    tags: string[]
    industry: string | null
    created_at: string
    created_by?: string
    prompts?: { count: number }[]
    author?: {
      id: string
      username: string | null
      display_name: string
      avatar_url: string | null
    }
  }
}

export default function ProblemCard({ problem }: ProblemCardProps) {
  const promptCount = problem.prompts?.length || 0

  return (
    <Link href={`/problems/${problem.slug}`} className="block">
      <div className="bg-card text-card-foreground border border-border rounded-lg p-6 hover:border-primary/50 hover:bg-primary/5 transition-all">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-foreground line-clamp-2">
            {toDisplayString(problem.title)}
          </h3>
          {problem.industry && (
            <span className="ml-2 px-2 py-1 text-xs bg-primary/10 text-primary border border-primary/20 rounded-full whitespace-nowrap">
              {problem.industry}
            </span>
          )}
        </div>
        
        {problem.description && (
          <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
            {toDisplayString(problem.description)}
          </p>
        )}
        
        {problem.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {problem.tags.slice(0, 3).map((tag, index) => (
              <span
                key={`${tag}-${index}`}
                className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded"
              >
                {tag}
              </span>
            ))}
            {problem.tags.length > 3 && (
              <span className="px-2 py-1 text-xs text-muted-foreground">
                +{problem.tags.length - 3} more
              </span>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>{new Date(problem.created_at).toLocaleDateString()}</span>
            {problem.author && (
              <>
                <span>•</span>
                <span className="text-muted-foreground">
                  by <AuthorChip 
                    userId={problem.created_by || problem.author.id}
                    username={problem.author.username}
                    displayName={problem.author.display_name}
                    avatarUrl={problem.author.avatar_url}
                    showAvatar={false}
                  />
                </span>
              </>
            )}
          </div>
          <span>{promptCount} prompt{promptCount !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </Link>
  )
}
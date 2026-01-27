import Link from 'next/link'
import { AuthorChip } from '@/components/common/AuthorChip'

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
      <div className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 hover:shadow-sm transition-all">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {problem.title}
          </h3>
          {problem.industry && (
            <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full whitespace-nowrap">
              {problem.industry}
            </span>
          )}
        </div>
        
        {problem.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
            {problem.description}
          </p>
        )}
        
        {problem.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {problem.tags.slice(0, 3).map((tag, index) => (
              <span
                key={`${tag}-${index}`}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
              >
                {tag}
              </span>
            ))}
            {problem.tags.length > 3 && (
              <span className="px-2 py-1 text-xs text-gray-500">
                +{problem.tags.length - 3} more
              </span>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <span>{new Date(problem.created_at).toLocaleDateString()}</span>
            {problem.author && (
              <>
                <span>•</span>
                <span className="text-gray-600">
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
'use client'

import Link from 'next/link'

interface PromptsFilterClientProps {
  filter: 'all' | 'originals' | 'forks'
  sort: 'newest' | 'top' | 'most_forked'
}

export default function PromptsFilterClient({ filter, sort }: PromptsFilterClientProps) {
  return (
    <div className="mb-8 bg-white p-6 rounded-lg shadow">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex gap-2">
          <span className="text-sm font-medium text-gray-700">Show:</span>
          <Link
            href={`/prompts?filter=all&sort=${sort}`}
            className={`px-3 py-1 text-sm rounded transition-colors ${filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            All Prompts
          </Link>
          <Link
            href={`/prompts?filter=originals&sort=${sort}`}
            className={`px-3 py-1 text-sm rounded transition-colors ${filter === 'originals'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Originals Only
          </Link>
          <Link
            href={`/prompts?filter=forks&sort=${sort}`}
            className={`px-3 py-1 text-sm rounded transition-colors flex items-center gap-1 ${filter === 'forks'
              ? 'bg-orange-600 text-white'
              : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
              }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            Forks Only
          </Link>
        </div>

        <div className="flex gap-2">
          <span className="text-sm font-medium text-gray-700">Sort:</span>
          <Link
            href={`/prompts?filter=${filter}&sort=newest`}
            className={`px-3 py-1 text-sm rounded transition-colors ${sort === 'newest'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Newest
          </Link>
          <Link
            href={`/prompts?filter=${filter}&sort=top`}
            className={`px-3 py-1 text-sm rounded transition-colors ${sort === 'top'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Top Rated
          </Link>
          <Link
            href={`/prompts?filter=${filter}&sort=most_forked`}
            className={`px-3 py-1 text-sm rounded transition-colors flex items-center gap-1 ${sort === 'most_forked'
              ? 'bg-orange-600 text-white'
              : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
              }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            Most Forked
          </Link>
        </div>
      </div>
    </div>
  )
}

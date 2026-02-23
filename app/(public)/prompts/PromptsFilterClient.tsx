'use client'

import Link from 'next/link'

interface PromptsFilterClientProps {
  filter: 'all' | 'originals' | 'forks'
  sort: 'newest' | 'top' | 'most_forked' | 'best'
  search?: string
}

export default function PromptsFilterClient({ filter, sort, search }: PromptsFilterClientProps) {
  return (
    <div className="mb-8 bg-white p-6 rounded-lg shadow">
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex flex-wrap gap-8 items-center">
          {/* Filter Group */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Show:</span>
            <div className="flex gap-1">
              <Link
                href={`/prompts?filter=all&sort=${sort}${search ? `&search=${search}` : ''}`}
                className={`px-3 py-1 text-sm rounded transition-colors ${filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                All
              </Link>
              <Link
                href={`/prompts?filter=originals&sort=${sort}${search ? `&search=${search}` : ''}`}
                className={`px-3 py-1 text-sm rounded transition-colors ${filter === 'originals'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Originals
              </Link>
              <Link
                href={`/prompts?filter=forks&sort=${sort}${search ? `&search=${search}` : ''}`}
                className={`px-3 py-1 text-sm rounded transition-colors flex items-center gap-1 ${filter === 'forks'
                  ? 'bg-orange-600 text-white'
                  : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                  }`}
              >
                Forks
              </Link>
            </div>
          </div>

          {/* Sort Group */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Sort:</span>
            <div className="flex gap-1">
              <Link
                href={`/prompts?filter=${filter}&sort=newest${search ? `&search=${search}` : ''}`}
                className={`px-3 py-1 text-sm rounded transition-colors ${sort === 'newest'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Newest
              </Link>
              <Link
                href={`/prompts?filter=${filter}&sort=best${search ? `&search=${search}` : ''}`}
                className={`px-3 py-1 text-sm rounded transition-colors ${sort === 'best'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                ⭐ Best
              </Link>
              <Link
                href={`/prompts?filter=${filter}&sort=top${search ? `&search=${search}` : ''}`}
                className={`px-3 py-1 text-sm rounded transition-colors ${sort === 'top'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Top
              </Link>
              <Link
                href={`/prompts?filter=${filter}&sort=most_forked${search ? `&search=${search}` : ''}`}
                className={`px-3 py-1 text-sm rounded transition-colors flex items-center gap-1 ${sort === 'most_forked'
                  ? 'bg-orange-600 text-white'
                  : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                  }`}
              >
                Forks
              </Link>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="w-full md:w-72">
          <form method="get" action="/prompts" className="relative">
            <input type="hidden" name="filter" value={filter} />
            <input type="hidden" name="sort" value={sort} />
            <input
              type="text"
              name="search"
              placeholder="Search prompts..."
              defaultValue={search}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <svg
              className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </form>
        </div>
      </div>
    </div>
  )
}


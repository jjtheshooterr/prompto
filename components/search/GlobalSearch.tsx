'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface SearchResult {
  id: string
  type: 'problem' | 'prompt'
  title: string
  description?: string
  industry?: string
  slug?: string
  problem_title?: string
}

export default function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([])
        setIsOpen(false)
        return
      }

      setLoading(true)
      const supabase = createClient()

      try {
        // Search problems
        const { data: problems } = await supabase
          .from('problems')
          .select('id, title, description, industry, slug')
          .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
          .limit(5)

        // Search prompts
        const { data: prompts } = await supabase
          .from('prompts')
          .select(`
            id,
            title,
            system_prompt,
            problems!inner (
              title,
              slug
            )
          `)
          .or(`title.ilike.%${query}%,system_prompt.ilike.%${query}%`)
          .eq('is_listed', true)
          .eq('is_hidden', false)
          .limit(5)

        const searchResults: SearchResult[] = [
          ...(problems || []).map(p => ({
            id: p.id,
            type: 'problem' as const,
            title: p.title,
            description: p.description,
            industry: p.industry,
            slug: p.slug
          })),
          ...(prompts || []).map(p => ({
            id: p.id,
            type: 'prompt' as const,
            title: p.title,
            problem_title: p.problems?.title,
            slug: p.problems?.slug
          }))
        ]

        setResults(searchResults)
        setIsOpen(searchResults.length > 0)
      } catch (error) {
        console.error('Search failed:', error)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [query])

  const handleResultClick = () => {
    setIsOpen(false)
    setQuery('')
  }

  return (
    <div ref={searchRef} className="relative">
      <div className="relative">
        <input
          type="text"
          placeholder="Search problems and prompts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {results.length > 0 ? (
            <div className="py-2">
              {results.map((result) => (
                <Link
                  key={`${result.type}-${result.id}`}
                  href={
                    result.type === 'problem' 
                      ? `/problems/${result.slug}` 
                      : `/prompts/${result.id}`
                  }
                  onClick={handleResultClick}
                  className="block px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded ${
                          result.type === 'problem' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {result.type}
                        </span>
                        {result.industry && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                            {result.industry}
                          </span>
                        )}
                      </div>
                      <h3 className="font-medium text-gray-900 mt-1">
                        {result.title}
                      </h3>
                      {result.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {result.description}
                        </p>
                      )}
                      {result.problem_title && (
                        <p className="text-sm text-gray-500 mt-1">
                          in {result.problem_title}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : query.length >= 2 && !loading ? (
            <div className="px-4 py-6 text-center text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p>No results found for "{query}"</p>
              <p className="text-sm mt-1">Try different keywords or browse problems</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
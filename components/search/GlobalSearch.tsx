'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface SearchResult {
  id: string
  kind: 'prompt' | 'problem'
  title: string
  problem_title?: string
  problem_slug?: string
  problem_id?: string
  tags?: string[]
  score?: number
}

function debounce(fn: (q: string) => void, ms: number): (q: string) => void {
  let timer: ReturnType<typeof setTimeout>
  return (q: string) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(q), ms)
  }
}

export default function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
        inputRef.current?.blur()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([])
      setIsOpen(false)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()

      // ── Prompt fuzzy search via RPC ──────────────────────────────────
      const [
        { data: promptHits, error: rpcError },
        { data: problemHits },
      ] = await Promise.all([
        supabase.rpc('global_search_prompts', { q: q.trim(), workspace: null, lim: 15 }),
        supabase.rpc('global_search_problems', { q: q.trim(), workspace: null, lim: 5 }),
      ])

      if (rpcError) {
        console.error('Search RPC error:', rpcError)
        setResults([])
        setIsOpen(false)
        return
      }

      const combined: SearchResult[] = [
        ...(promptHits ?? []).map((h: {
          id: string
          title: string
          problem_id: string
          problem_title: string
          problem_slug: string
          tags: string[]
          score: number
        }) => ({
          id: h.id,
          kind: 'prompt' as const,
          title: h.title,
          problem_id: h.problem_id,
          problem_title: h.problem_title || undefined,
          problem_slug: h.problem_slug || undefined,
          tags: h.tags?.length ? h.tags : undefined,
          score: h.score,
        })),
        ...(problemHits ?? []).map((p: {
          id: string
          title: string
          slug: string
          tags: string[]
          score: number
        }) => ({
          id: p.id,
          kind: 'problem' as const,
          title: p.title,
          problem_slug: p.slug,
          tags: p.tags?.length ? p.tags : undefined,
          score: p.score,
        })),
      ].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))

      setResults(combined)
      setIsOpen(combined.length > 0)
    } catch (err) {
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const doSearch = useMemo(() => debounce(runSearch, 280), [runSearch])

  useEffect(() => {
    doSearch(query)
  }, [query, doSearch])

  const clear = () => {
    setIsOpen(false)
    setQuery('')
  }

  return (
    <div ref={searchRef} className="relative w-full max-w-sm">
      {/* Input */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {loading ? (
            <svg
              className="h-4 w-4 animate-spin text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12" cy="12" r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
          ) : (
            <svg
              className="h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          )}
        </span>

        <input
          ref={inputRef}
          type="text"
          placeholder="Search prompts… (⌘K)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setFocused(true)
            if (results.length > 0) setIsOpen(true)
          }}
          onBlur={() => setFocused(false)}
          className={[
            'w-full py-2 pl-9 pr-8 text-sm',
            'border border-gray-300 rounded-lg bg-white',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'transition-shadow duration-150',
            focused && 'shadow-md',
          ]
            .filter(Boolean)
            .join(' ')}
        />

        {query && (
          <button
            onClick={clear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-[28rem] overflow-y-auto">
          {results.length > 0 ? (
            <ul className="py-1" role="listbox">
              {results.map((r) => (
                <li key={`${r.kind}-${r.id}`}>
                  <Link
                    href={
                      r.kind === 'problem'
                        ? `/problems/${r.problem_slug}`
                        : `/prompts/${r.id}`
                    }
                    onClick={clear}
                    className="flex flex-col gap-1 px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    {/* Type badge + title row */}
                    <div className="flex items-center gap-2">
                      <span
                        className={[
                          'shrink-0 px-1.5 py-0.5 text-xs font-medium rounded',
                          r.kind === 'problem'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-emerald-100 text-emerald-700',
                        ].join(' ')}
                      >
                        {r.kind}
                      </span>
                      <span className="font-medium text-gray-900 text-sm truncate">
                        {r.title}
                      </span>
                    </div>

                    {/* Problem context for prompt results */}
                    {r.kind === 'prompt' && r.problem_title && (
                      <p className="text-xs text-gray-500 pl-0.5 truncate">
                        in {r.problem_title}
                      </p>
                    )}

                    {/* Tags */}
                    {r.tags && r.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {r.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {r.tags.length > 4 && (
                          <span className="text-xs text-gray-400">
                            +{r.tags.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          ) : query.length >= 2 && !loading ? (
            <div className="px-4 py-8 text-center text-gray-500">
              <svg
                className="mx-auto h-8 w-8 text-gray-300 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <p className="text-sm">No results for &ldquo;{query}&rdquo;</p>
              <p className="text-xs mt-1 text-gray-400">Try different keywords or browse problems</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
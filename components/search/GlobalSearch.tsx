'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Link from 'next/link'

interface SearchResult {
  id: string
  kind: 'prompt' | 'problem'
  title: string
  href: string
  subtitle?: string | null
}

interface SearchResponse {
  results: SearchResult[]
  isTrending: boolean
  isAnon: boolean
}

function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>
  return ((...args: any[]) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }) as T
}

export default function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)
  const [isTrending, setIsTrending] = useState(false)
  const [isAnon, setIsAnon] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  // Cache trending so we don't re-fetch on every clear
  const trendingCache = useRef<SearchResponse | null>(null)

  // ── Outside click ──────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setFocused(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
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

  // ── Apply a search response to state ──────────────────────────────────────
  const applyResponse = useCallback((data: SearchResponse) => {
    setResults(data.results)
    setIsTrending(data.isTrending)
    setIsAnon(data.isAnon)
    setIsOpen(data.results.length > 0)
    setLoading(false)
  }, [])

  // ── Fetch trending (cached after first load) ──────────────────────────────
  const fetchTrending = useCallback(async () => {
    if (trendingCache.current) {
      applyResponse(trendingCache.current)
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/search?q=')
      if (!res.ok) { setLoading(false); return }
      const data: SearchResponse = await res.json()
      trendingCache.current = data
      applyResponse(data)
    } catch {
      setLoading(false)
    }
  }, [applyResponse])

  // ── Live search ────────────────────────────────────────────────────────────
  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) return
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`)
      if (!res.ok) { setLoading(false); return }
      const data: SearchResponse = await res.json()
      applyResponse(data)
    } catch {
      setLoading(false)
    }
  }, [applyResponse])

  const doSearch = useMemo(() => debounce(runSearch, 350), [runSearch])

  // ── React to query + focus changes ────────────────────────────────────────
  useEffect(() => {
    if (!query) {
      if (focused) fetchTrending()
      else setIsOpen(false)
    } else if (query.length === 1) {
      // Too short — close without loading
      setIsOpen(false)
    } else {
      doSearch(query)
    }
  }, [query, focused, fetchTrending, doSearch])

  const clear = () => {
    setQuery('')
    setIsOpen(false)
  }

  return (
    <div ref={searchRef} className="relative w-full max-w-sm">
      {/* ── Input ── */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {loading ? (
            <svg className="h-4 w-4 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
            if (!query) fetchTrending()
            else if (results.length > 0) setIsOpen(true)
          }}
          onBlur={() => setFocused(false)}
          className="w-full py-2 pl-9 pr-8 text-sm rounded-full bg-muted/50 border border-border/50 text-foreground placeholder:text-muted-foreground hover:bg-muted focus:outline-none focus:bg-background focus:border-primary/30 focus:ring-4 focus:ring-primary/10 focus:shadow-sm transition-all duration-200"
        />

        {query && (
          <button
            onClick={clear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Dropdown ── */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden">

          {/* Section label */}
          <div className="px-3 pt-2.5 pb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {isTrending ? 'Trending' : `Results`}
            </span>
          </div>

          {results.length > 0 ? (
            <>
              <ul role="listbox">
                {results.map((r) => (
                  <li key={`${r.kind}-${r.id}`}>
                    <Link
                      href={r.href}
                      onClick={clear}
                      className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-accent/60 transition-colors"
                    >
                      {/* Icon */}
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        r.kind === 'problem'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-emerald-500/10 text-emerald-500'
                      }`}>
                        {r.kind === 'problem' ? (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3-3-3z" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                          </svg>
                        )}
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                        {r.subtitle && (
                          <p className="text-xs text-muted-foreground truncate">
                            {r.kind === 'prompt' ? `in ${r.subtitle}` : r.subtitle}
                          </p>
                        )}
                      </div>

                      <svg className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </li>
                ))}
              </ul>

              {/* ── Anon CTA ── */}
              {isAnon && (
                <Link
                  href="/signup"
                  onClick={clear}
                  className="flex items-center justify-between gap-2 px-3 py-2.5 bg-primary/5 hover:bg-primary/10 border-t border-border/50 transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                      <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">Create a free account</p>
                      <p className="text-[11px] text-muted-foreground">Submit prompts &amp; track your ranking</p>
                    </div>
                  </div>
                  <svg className="w-3.5 h-3.5 text-primary group-hover:translate-x-0.5 transition-transform shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}
            </>
          ) : !loading ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-muted-foreground">No results for &ldquo;{query}&rdquo;</p>
              <p className="text-xs mt-1 text-muted-foreground/60">Try different keywords or browse problems</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

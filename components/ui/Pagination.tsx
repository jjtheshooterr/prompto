'use client'

import Link from 'next/link'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { useCallback, useState, useRef } from 'react'

interface PaginationProps {
  currentPage: number
  totalPages: number
}

export default function Pagination({ currentPage, totalPages }: PaginationProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [inputVal, setInputVal] = useState('')
  const [editing, setEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const createPageURL = useCallback(
    (pageNumber: number) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('page', pageNumber.toString())
      return `${pathname}?${params.toString()}`
    },
    [searchParams, pathname],
  )

  if (totalPages <= 1) return null

  const goToPage = (raw: string) => {
    const n = parseInt(raw, 10)
    if (!isNaN(n) && n >= 1 && n <= totalPages && n !== currentPage) {
      router.push(createPageURL(n))
    }
    setEditing(false)
    setInputVal('')
  }

  return (
    <div className="flex items-center gap-2">
      {/* Previous */}
      <Link
        href={createPageURL(currentPage - 1)}
        className={`px-3.5 py-2 text-sm border border-border bg-card text-foreground rounded-lg hover:bg-accent transition-colors ${
          currentPage <= 1 ? 'pointer-events-none opacity-40' : ''
        }`}
        aria-disabled={currentPage <= 1}
      >
        Previous
      </Link>

      {/* Page indicator — click to jump */}
      {editing ? (
        <input
          ref={inputRef}
          type="number"
          min={1}
          max={totalPages}
          value={inputVal}
          autoFocus
          onChange={(e) => setInputVal(e.target.value)}
          onBlur={() => goToPage(inputVal)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') goToPage(inputVal)
            if (e.key === 'Escape') { setEditing(false); setInputVal('') }
          }}
          className="w-20 text-center text-sm px-2 py-2 border border-primary rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          placeholder={String(currentPage)}
        />
      ) : (
        <button
          onClick={() => { setEditing(true); setInputVal('') }}
          className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors whitespace-nowrap"
          title="Click to jump to a page"
        >
          Page {currentPage} of {totalPages}
        </button>
      )}

      {/* Next */}
      <Link
        href={createPageURL(currentPage + 1)}
        className={`px-3.5 py-2 text-sm border border-border bg-card text-foreground rounded-lg hover:bg-accent transition-colors ${
          currentPage >= totalPages ? 'pointer-events-none opacity-40' : ''
        }`}
        aria-disabled={currentPage >= totalPages}
      >
        Next
      </Link>
    </div>
  )
}

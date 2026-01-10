'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

interface PaginationProps {
    currentPage: number
    totalPages: number
}

export default function Pagination({ currentPage, totalPages }: PaginationProps) {
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const createPageURL = useCallback(
        (pageNumber: number) => {
            const params = new URLSearchParams(searchParams.toString())
            params.set('page', pageNumber.toString())
            return `${pathname}?${params.toString()}`
        },
        [searchParams, pathname]
    )

    if (totalPages <= 1) return null

    return (
        <div className="flex justify-center items-center gap-2 mt-8">
            <Link
                href={createPageURL(currentPage - 1)}
                className={`px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors ${currentPage <= 1 ? 'pointer-events-none opacity-50' : ''
                    }`}
                aria-disabled={currentPage <= 1}
            >
                Previous
            </Link>

            <span className="text-sm text-gray-600 px-2">
                Page {currentPage} of {totalPages}
            </span>

            <Link
                href={createPageURL(currentPage + 1)}
                className={`px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors ${currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''
                    }`}
                aria-disabled={currentPage >= totalPages}
            >
                Next
            </Link>
        </div>
    )
}

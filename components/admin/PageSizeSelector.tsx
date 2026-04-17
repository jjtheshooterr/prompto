'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

interface PageSizeSelectorProps {
  currentSize: number
  options?: number[]
}

export default function PageSizeSelector({ 
  currentSize, 
  options = [10, 20, 50] 
}: PageSizeSelectorProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleSizeChange = (size: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('pageSize', size.toString())
    params.set('page', '1') // Reset to first page when changing size
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Show:</span>
      <div className="flex gap-1">
        {options.map((size) => (
          <button
            key={size}
            onClick={() => handleSizeChange(size)}
            className={`px-2 py-1 rounded transition-colors ${
              currentSize === size
                ? 'bg-primary text-primary-foreground font-bold'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            }`}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { toggleFeatured } from '@/lib/actions/admin.actions'
import { toast } from 'sonner'
import { Star } from 'lucide-react'

interface AdminFeatureToggleProps {
  contentType: 'prompt' | 'problem'
  contentId: string
  initialIsFeatured: boolean
}

export function AdminFeatureToggle({ contentType, contentId, initialIsFeatured }: AdminFeatureToggleProps) {
  const [isFeatured, setIsFeatured] = useState(initialIsFeatured)
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = async () => {
    setIsLoading(true)
    // Optimistic UI update
    const newFeaturedState = !isFeatured
    setIsFeatured(newFeaturedState)
    
    try {
      await toggleFeatured(contentType, contentId, newFeaturedState)
      toast.success(newFeaturedState ? `${contentType} featured on front page!` : `${contentType} removed from featured.`)
    } catch (error) {
      // Revert on failure
      setIsFeatured(!newFeaturedState)
      toast.error(`Failed to toggle feature: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
        isFeatured 
          ? 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/30 hover:bg-yellow-500/20' 
          : 'bg-muted text-muted-foreground border border-border hover:bg-muted/80'
      }`}
      title={isFeatured ? "Unfeature this content from the front page" : "Feature this content on the front page (Admin)"}
    >
      <Star className={`w-4 h-4 ${isFeatured ? 'fill-yellow-600 outline-yellow-600' : ''}`} />
      {isFeatured ? 'Featured' : 'Feature+'}
    </button>
  )
}

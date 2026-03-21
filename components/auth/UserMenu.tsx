'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import Link from 'next/link'

interface UserMenuProps {
  user: {
    email?: string
    user_metadata?: {
      display_name?: string
    }
  }
}

export default function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'User'

  async function handleSignOut() {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
      >
        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium shadow-sm">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <span className="hidden md:block font-medium">{displayName}</span>
        <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-popover rounded-md shadow-lg py-1 z-50 border border-border animate-in fade-in slide-in-from-top-2 duration-200">
          <Link
            href="/dashboard"
            className="block px-4 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Dashboard
          </Link>
          <Link
            href="/workspace"
            className="block px-4 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Workspace
          </Link>
          <Link
            href="/settings"
            className="block px-4 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Settings
          </Link>
          <div className="h-px bg-border my-1" />
          <Link
            href="/problems/new"
            className="block px-4 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Create Problem
          </Link>
          <Link
            href="/prompts/new"
            className="block px-4 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Create Prompt
          </Link>
          <div className="h-px bg-border my-1" />
          <button
            onClick={handleSignOut}
            className="block w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
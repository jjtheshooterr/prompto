'use client'

import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, useRef } from 'react'
import GlobalSearch from '@/components/search/GlobalSearch'
import { useAuth } from '@/app/providers'
import { ThemeToggle } from '@/components/theme-toggle'
import { LayoutDashboard, Briefcase, PlusCircle, Shield, LogOut, ChevronDown } from 'lucide-react'

const NAV_LINKS = [
  { href: '/problems', label: 'Browse' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/compare', label: 'Compare' },
  { href: '/guide', label: 'Guide' },
]

export default function Header() {
  const { user, loading } = useAuth()
  const [userProfile, setUserProfile] = useState<{ role: string; username: string | null; display_name: string | null; avatar_url: string | null } | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) {
      setUserProfile(null)
      return
    }
    const supabase = createClient()
    supabase
      .from('profiles')
      .select('role, username, display_name, avatar_url')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setUserProfile(data ?? null))
  }, [user])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const isAdminOrOwner = userProfile?.role === 'admin' || userProfile?.role === 'owner'

  const avatarFallback = (userProfile?.display_name || user?.email || 'U')[0].toUpperCase()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 h-14">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <Image
              src="/logo.svg"
              alt="Promptvexity"
              width={28}
              height={28}
              className="w-7 h-7 transition-transform group-hover:scale-105"
            />
            <span className="text-lg font-bold tracking-tight text-foreground hidden sm:block">
              Promptvexity
            </span>
          </Link>

          {/* Search — center */}
          <div className="flex-1 max-w-sm hidden md:block mx-4">
            <GlobalSearch />
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5 ml-auto">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm text-muted-foreground hover:text-foreground hover:bg-accent px-3 py-1.5 rounded-md transition-all font-medium"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Desktop right — theme + auth */}
          <div className="hidden md:flex items-center gap-2 shrink-0 ml-2">
            <ThemeToggle />

            {loading ? (
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
            ) : user ? (
              /* Avatar dropdown */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-1 p-0.5 rounded-full hover:ring-2 hover:ring-primary/30 transition-all"
                  aria-label="Open user menu"
                >
                  {userProfile?.avatar_url ? (
                    <img
                      src={userProfile.avatar_url}
                      alt="avatar"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm select-none">
                      {avatarFallback}
                    </div>
                  )}
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                    {/* User info */}
                    <div className="px-3 py-2.5 border-b border-border">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {userProfile?.display_name || userProfile?.username || 'My Account'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{user.email}</p>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-muted-foreground shrink-0" />
                        Dashboard
                      </Link>
                      <Link
                        href="/workspace"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                      >
                        <Briefcase className="w-4 h-4 text-muted-foreground shrink-0" />
                        Workspace
                      </Link>
                      <Link
                        href="/create/problem"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                      >
                        <PlusCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                        Create Problem
                      </Link>

                      {isAdminOrOwner && (
                        <Link
                          href="/admin/reports"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Shield className="w-4 h-4 shrink-0" />
                          Admin Panel
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-border py-1">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      >
                        <LogOut className="w-4 h-4 shrink-0" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-accent transition-all font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="text-sm bg-primary text-primary-foreground px-4 py-1.5 rounded-lg hover:bg-primary/90 transition-all font-semibold shadow-sm"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile right */}
          <div className="md:hidden flex items-center gap-2 ml-auto">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="md:hidden pb-3">
          <GlobalSearch />
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border py-2">
            <nav className="flex flex-col gap-0.5">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm text-muted-foreground hover:text-foreground hover:bg-accent px-3 py-2 rounded-md transition-colors font-medium"
                >
                  {label}
                </Link>
              ))}

              <div className="my-1.5 border-t border-border" />

              {user ? (
                <>
                  {/* User info strip */}
                  <div className="flex items-center gap-2.5 px-3 py-2 mb-0.5">
                    {userProfile?.avatar_url ? (
                      <img src={userProfile.avatar_url} alt="avatar" className="w-7 h-7 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0 select-none">
                        {avatarFallback}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {userProfile?.display_name || userProfile?.username || 'My Account'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>

                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors">
                    <LayoutDashboard className="w-4 h-4 text-muted-foreground shrink-0" /> Dashboard
                  </Link>
                  <Link href="/workspace" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors">
                    <Briefcase className="w-4 h-4 text-muted-foreground shrink-0" /> Workspace
                  </Link>
                  <Link href="/create/problem" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors">
                    <PlusCircle className="w-4 h-4 text-muted-foreground shrink-0" /> Create Problem
                  </Link>
                  {isAdminOrOwner && (
                    <Link href="/admin/reports" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors">
                      <Shield className="w-4 h-4 shrink-0" /> Admin Panel
                    </Link>
                  )}

                  <div className="my-1.5 border-t border-border" />

                  <button
                    onClick={() => { handleSignOut(); setMobileMenuOpen(false) }}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors w-full text-left"
                  >
                    <LogOut className="w-4 h-4 shrink-0" /> Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors font-medium">
                    Sign In
                  </Link>
                  <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-center font-semibold mt-1">
                    Sign Up
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

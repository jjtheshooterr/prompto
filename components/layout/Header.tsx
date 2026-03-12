'use client'

import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import GlobalSearch from '@/components/search/GlobalSearch'
import { useAuth } from '@/app/providers'

export default function Header() {
  const { user, loading } = useAuth()
  const [userProfile, setUserProfile] = useState<any>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Fetch profile whenever the user changes
  useEffect(() => {
    if (!user) {
      setUserProfile(null)
      return
    }
    const supabase = createClient()
    supabase
      .from('profiles')
      .select('role, username')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setUserProfile(data ?? null))
  }, [user])


  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <Image
              src="/logo.svg"
              alt="Promptvexity Logo"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className="text-2xl font-bold text-blue-600">Promptvexity</span>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:block flex-1 max-w-md mx-8">
            <GlobalSearch />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-3 lg:space-x-5 text-sm font-medium">
            <Link href="/guide" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-3 py-1.5 rounded-md transition-all font-semibold flex items-center gap-1.5 border border-transparent hover:border-slate-200">
              <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              Guide
            </Link>

            <Link href="/problems" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-3 py-1.5 rounded-md transition-all">
              Browse Problems
            </Link>
            <Link href="/compare" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-3 py-1.5 rounded-md transition-all">
              Compare
            </Link>
<<<<<<< HEAD


=======
            <Link href="/leaderboard" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-3 py-1.5 rounded-md transition-all flex items-center gap-1">
              <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              Leaderboard
            </Link>
>>>>>>> 39adfa5c424009df1d9747e2560576e0548b13a7
            {user && (
              <>
                <Link href="/create/problem" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-3 py-1.5 rounded-md transition-all">
                  Create Problem
                </Link>
                <Link href="/workspace" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-3 py-1.5 rounded-md transition-all">
                  Workspace
                </Link>
                <Link href="/dashboard" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-3 py-1.5 rounded-md transition-all">
                  Dashboard
                </Link>
                {userProfile?.role === 'admin' && (
                  <Link href="/admin/reports" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-md transition-all font-semibold">
                    Admin
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center space-x-3 text-sm font-medium">
            {loading ? (
              <div className="text-slate-400">Loading...</div>
            ) : user ? (
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleSignOut}
                  className="text-slate-500 hover:text-slate-900 px-3 py-1.5 rounded-md hover:bg-slate-100 transition-all"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-4 py-2 rounded-lg transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 shadow-sm hover:shadow-md transition-all font-semibold"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle mobile menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Search Bar - Mobile */}
        <div className="md:hidden mt-4">
          <GlobalSearch />
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-4">
              <Link
                href="/problems"
                className="text-gray-600 hover:text-gray-900 transition-colors py-2"
                onClick={closeMobileMenu}
              >
                Browse Problems
              </Link>
              <Link
                href="/compare"
                className="text-gray-600 hover:text-gray-900 transition-colors py-2"
                onClick={closeMobileMenu}
              >
                Compare
              </Link>
              <Link
                href="/leaderboard"
                className="text-gray-600 hover:text-gray-900 transition-colors py-2 flex items-center gap-2"
                onClick={closeMobileMenu}
              >
                <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                Leaderboard
              </Link>



              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="text-gray-600 hover:text-gray-900 transition-colors py-2"
                    onClick={closeMobileMenu}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/workspace"
                    className="text-gray-600 hover:text-gray-900 transition-colors py-2"
                    onClick={closeMobileMenu}
                  >
                    Workspace
                  </Link>
                  <Link
                    href="/create/problem"
                    className="text-gray-600 hover:text-gray-900 transition-colors py-2"
                    onClick={closeMobileMenu}
                  >
                    Create Problem
                  </Link>
                  {userProfile?.role === 'admin' && (
                    <Link
                      href="/admin/reports"
                      className="text-red-600 hover:text-red-700 transition-colors py-2 font-medium"
                      onClick={closeMobileMenu}
                    >
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleSignOut()
                      closeMobileMenu()
                    }}
                    className="text-left text-gray-600 hover:text-gray-900 transition-colors py-2"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-gray-600 hover:text-gray-900 transition-colors py-2"
                    onClick={closeMobileMenu}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center"
                    onClick={closeMobileMenu}
                  >
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
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import GlobalSearch from '@/components/search/GlobalSearch'

export default function Header() {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [compareCount, setCompareCount] = useState(0)

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      // Get user profile to check role
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, username')
          .eq('id', user.id)
          .single()
        setUserProfile(profile)
      }
      
      setLoading(false)
    }

    getUser()

    // Listen for auth changes
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) {
        setUserProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Track compare items count
  useEffect(() => {
    const updateCompareCount = () => {
      const compareItems = JSON.parse(localStorage.getItem('comparePrompts') || '[]')
      setCompareCount(compareItems.length)
    }

    // Initial count
    updateCompareCount()

    // Listen for storage changes
    window.addEventListener('storage', updateCompareCount)
    
    // Listen for custom events when items are added
    window.addEventListener('compareUpdated', updateCompareCount)

    return () => {
      window.removeEventListener('storage', updateCompareCount)
      window.removeEventListener('compareUpdated', updateCompareCount)
    }
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    window.location.href = '/'
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="container mx-auto px-4 py-4">
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
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/problems" className="text-gray-600 hover:text-gray-900 transition-colors">
              Browse Problems
            </Link>
            <Link href="/prompts" className="text-gray-600 hover:text-gray-900 transition-colors">
              All Prompts
            </Link>
            <Link 
              href="/compare" 
              className={`transition-colors relative ${
                compareCount > 0 
                  ? 'text-blue-600 hover:text-blue-700 font-medium' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Compare
              {compareCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {compareCount}
                </span>
              )}
            </Link>
            {user && (
              <>
                <Link href="/create/problem" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Create Problem
                </Link>
                <Link href="/workspace" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Workspace
                </Link>
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Dashboard
                </Link>
                {userProfile?.role === 'admin' && (
                  <Link href="/admin/reports" className="text-red-600 hover:text-red-700 transition-colors font-medium">
                    Admin
                  </Link>
                )}
              </>
            )}
          </nav>
          
          {/* Desktop Auth */}
          <div className="hidden md:flex items-center space-x-4">
            {loading ? (
              <div className="text-gray-400">Loading...</div>
            ) : user ? (
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleSignOut}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link 
                  href="/signup" 
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
                href="/prompts" 
                className="text-gray-600 hover:text-gray-900 transition-colors py-2"
                onClick={closeMobileMenu}
              >
                All Prompts
              </Link>
              <Link 
                href="/compare" 
                className={`transition-colors py-2 relative inline-block ${
                  compareCount > 0 
                    ? 'text-blue-600 hover:text-blue-700 font-medium' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={closeMobileMenu}
              >
                Compare
                {compareCount > 0 && (
                  <span className="absolute -top-1 -right-6 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {compareCount}
                  </span>
                )}
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
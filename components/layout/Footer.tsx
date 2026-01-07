import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center space-x-3 mb-4">
              <Image 
                src="/logo.svg" 
                alt="Promptvexity Logo" 
                width={32} 
                height={32}
                className="w-8 h-8"
              />
              <span className="text-xl font-bold text-blue-600">Promptvexity</span>
            </Link>
            <p className="text-gray-600 mb-4">
              The problem-first prompt library. Browse, compare, and fork prompts organized by real-world problems.
            </p>
            <p className="text-sm text-gray-500">
              Built for the prompt engineering community.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/problems" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Browse Problems
                </Link>
              </li>
              <li>
                <Link href="/prompts" className="text-gray-600 hover:text-gray-900 transition-colors">
                  All Prompts
                </Link>
              </li>
              <li>
                <Link href="/compare" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Compare Prompts
                </Link>
              </li>
              <li>
                <Link href="/create/problem" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Create Problem
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Community</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/workspace" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Workspace
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/signup" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-8 text-center">
          <p className="text-gray-600">
            &copy; 2026 Promptvexity. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
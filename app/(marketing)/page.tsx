import Link from 'next/link'
import { getUser } from '@/lib/actions/auth.actions'

export default async function HomePage() {
  const user = await getUser()

  return (
    <div className="container mx-auto px-4 py-16">
      {/* Debug info */}
      {user && (
        <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">
            ✅ Logged in as: {user.email} 
            <Link href="/dashboard" className="ml-4 text-blue-600 hover:underline">
              Go to Dashboard
            </Link>
          </p>
        </div>
      )}
      
      <div className="text-center max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold mb-6">
          Problem-First Prompt Library
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Browse, compare, and fork prompts organized by real-world problems. 
          Find tested solutions, not just random prompts.
        </p>
        <div className="flex gap-4 justify-center">
          <Link 
            href="/problems" 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Problems
          </Link>
          {user ? (
            <Link 
              href="/dashboard" 
              className="border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Go to Dashboard
            </Link>
          ) : (
            <Link 
              href="/signup" 
              className="border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Sign Up Free
            </Link>
          )}
        </div>
      </div>
      
      <div className="mt-16 grid md:grid-cols-3 gap-8">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-4">Problem-Focused</h3>
          <p className="text-gray-600">
            Prompts organized by real problems, not random categories. 
            Find solutions that actually work.
          </p>
        </div>
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-4">Compare & Fork</h3>
          <p className="text-gray-600">
            Side-by-side comparison of different approaches. 
            Fork and improve existing prompts.
          </p>
        </div>
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-4">Community Tested</h3>
          <p className="text-gray-600">
            Vote on prompts, see what works, learn from failures. 
            Trust through transparency.
          </p>
        </div>
      </div>
    </div>
  )
}
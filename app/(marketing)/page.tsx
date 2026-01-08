import Link from 'next/link'
import TopRatedPrompts from '@/components/home/TopRatedPrompts'

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-16">
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
          <Link 
            href="/login" 
            className="border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Sign Up Free
          </Link>
        </div>
      </div>
      
      {/* Top Rated Prompts Section */}
      <div className="mt-16">
        <TopRatedPrompts />
      </div>

      {/* New User Guide Section */}
      <div className="mt-16 bg-blue-50 rounded-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-4">New here? Start with these popular problems</h2>
          <p className="text-gray-600">Jump right in with problems that have proven, tested prompts</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/problems/generate-sql-queries" className="bg-white p-6 rounded-lg hover:shadow-md transition-shadow">
            <h3 className="font-semibold mb-2">Generate SQL Queries</h3>
            <p className="text-sm text-gray-600 mb-3">Convert natural language to SQL with 5+ tested prompts</p>
            <span className="text-blue-600 text-sm font-medium">View Prompts →</span>
          </Link>
          <Link href="/problems/code-review" className="bg-white p-6 rounded-lg hover:shadow-md transition-shadow">
            <h3 className="font-semibold mb-2">Code Review Assistant</h3>
            <p className="text-sm text-gray-600 mb-3">Automated code review with bug detection</p>
            <span className="text-blue-600 text-sm font-medium">View Prompts →</span>
          </Link>
          <Link href="/problems/email-personalization" className="bg-white p-6 rounded-lg hover:shadow-md transition-shadow">
            <h3 className="font-semibold mb-2">Email Personalization</h3>
            <p className="text-sm text-gray-600 mb-3">Sales outreach that converts better</p>
            <span className="text-blue-600 text-sm font-medium">View Prompts →</span>
          </Link>
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
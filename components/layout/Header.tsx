import Link from 'next/link'

export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            PromptBench
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/problems" className="text-gray-600 hover:text-gray-900">
              Problems
            </Link>
            <Link href="/compare" className="text-gray-600 hover:text-gray-900">
              Compare
            </Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            <Link 
              href="/login" 
              className="text-gray-600 hover:text-gray-900"
            >
              Sign In
            </Link>
            <Link 
              href="/dashboard" 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
import Link from 'next/link'

export default function AuthCodeError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-red-600">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Authentication Error
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sorry, we couldn't sign you in. The authentication link may have expired or been used already.
          </p>
        </div>
        
        <div className="mt-8 bg-white py-8 px-6 shadow rounded-lg text-center">
          <p className="text-gray-600 mb-6">
            Please try signing in again or contact support if the problem persists.
          </p>
          
          <div className="space-y-3">
            <Link 
              href="/login"
              className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Sign In
            </Link>
            <Link 
              href="/signup"
              className="block w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Create New Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
import SignInForm from '@/components/auth/SignInForm'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to Promptvexity
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
              create a new account
            </Link>
          </p>
        </div>
        
        <div className="mt-8 bg-white py-8 px-6 shadow rounded-lg">
          <SignInForm />
        </div>
        
        <div className="text-center">
          <Link 
            href="/problems"
            className="text-blue-600 hover:text-blue-500 text-sm"
          >
            Continue browsing without signing in
          </Link>
        </div>
      </div>
    </div>
  )
}
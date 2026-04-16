import Link from 'next/link'

export default function AuthCodeError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-red-600">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            Authentication Error
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Sorry, we couldn&apos;t sign you in. The authentication link may have expired or been used already.
          </p>
        </div>

        <div className="mt-8 bg-card py-8 px-6 shadow rounded-lg text-center">
          <p className="text-muted-foreground mb-6">
            Please try signing in again or contact support if the problem persists.
          </p>

          <div className="space-y-3">
            <Link
              href="/login"
              className="block w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Back to Sign In
            </Link>
            <Link
              href="/signup"
              className="block w-full px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
            >
              Create New Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
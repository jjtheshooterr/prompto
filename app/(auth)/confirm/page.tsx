import Link from 'next/link'

interface SearchParams {
  message?: string
}

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const message = params.message || 'Check your email to confirm your account'

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-primary">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            Check your email
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {message}
          </p>
        </div>

        <div className="mt-8 bg-card py-8 px-6 shadow rounded-lg text-center">
          <p className="text-muted-foreground mb-4">
            We&apos;ve sent you a confirmation link. Click the link in your email to activate your account.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Didn&apos;t receive an email? Check your spam folder or try signing up again.
          </p>

          <div className="space-y-3">
            <Link
              href="/signup"
              className="block w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Try Again
            </Link>
            <Link
              href="/login"
              className="block w-full px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
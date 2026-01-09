import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Promptvexity - Problem-First Prompt Library',
  description: 'Browse, compare, and fork prompts organized by real-world problems',
  keywords: 'prompts, AI, machine learning, prompt engineering, prompt library, LLM, GPT',
  authors: [{ name: 'Promptvexity Team' }],
  creator: 'Promptvexity',
  publisher: 'Promptvexity',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://promptvexity.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Promptvexity - Problem-First Prompt Library',
    description: 'Browse, compare, and fork prompts organized by real-world problems',
    url: 'https://promptvexity.vercel.app',
    siteName: 'Promptvexity',
    images: [
      {
        url: '/logo.svg',
        width: 1200,
        height: 630,
        alt: 'Promptvexity Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Promptvexity - Problem-First Prompt Library',
    description: 'Browse, compare, and fork prompts organized by real-world problems',
    images: ['/logo.svg'],
    creator: '@promptvexity',
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/logo.svg', sizes: '32x32', type: 'image/svg+xml' },
      { url: '/logo.svg', sizes: '16x16', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/logo-large.svg' },
      { url: '/logo.svg', sizes: '180x180', type: 'image/svg+xml' },
    ],
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster
          position="bottom-right"
          duration={4000}
          visibleToasts={3}
          closeButton={false}
          richColors={false}
        />
      </body>
    </html>
  )
}
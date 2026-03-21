import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { Analytics } from '@vercel/analytics/next'
import { Providers } from './providers'
import { ThemeProvider } from '@/components/theme-provider'
import { JsonLd } from '@/components/seo/JsonLd'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

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
  metadataBase: new URL('https://promptvexity.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Promptvexity - Problem-First Prompt Library',
    description: 'Browse, compare, and fork prompts organized by real-world problems',
    url: 'https://promptvexity.com',
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <JsonLd data={[
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Promptvexity',
            url: 'https://promptvexity.com',
            description: 'The problem-first prompt library. Browse, compare, and fork AI prompts organized by real-world problems.',
            potentialAction: {
              '@type': 'SearchAction',
              target: {
                '@type': 'EntryPoint',
                urlTemplate: 'https://promptvexity.com/problems?q={search_term_string}',
              },
              'query-input': 'required name=search_term_string',
            },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Promptvexity',
            url: 'https://promptvexity.com',
            logo: 'https://promptvexity.com/logo.svg',
            description: 'Community-driven prompt library organized by real-world problems. Browse solutions, compare approaches, fork and improve prompts.',
            sameAs: [
              'https://www.linkedin.com/company/marketintegrators',
            ],
          },
        ]} />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased text-foreground bg-background`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            {children}
            <Toaster
              position="bottom-right"
              duration={4000}
              visibleToasts={3}
              closeButton={false}
              richColors={false}
            />
            <Analytics />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
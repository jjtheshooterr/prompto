/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimized for Vercel deployment
  serverExternalPackages: ['@supabase/supabase-js'],
  images: {
    formats: ['image/webp', 'image/avif'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'yknsbonffoaxxcwvxrls.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      }
    ]
  },
  async headers() {
    return [
      {
        // Apply these headers to all routes in your application.
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://yknsbonffoaxxcwvxrls.supabase.co; font-src 'self'; connect-src 'self' https://yknsbonffoaxxcwvxrls.supabase.co wss://yknsbonffoaxxcwvxrls.supabase.co; frame-ancestors 'none';"
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig
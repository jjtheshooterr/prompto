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
  }
}

module.exports = nextConfig
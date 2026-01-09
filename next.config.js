/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimized for Vercel deployment
  serverExternalPackages: ['@supabase/supabase-js'],
  images: {
    formats: ['image/webp', 'image/avif']
  }
}

module.exports = nextConfig
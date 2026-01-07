/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Pages optimization
  experimental: {
    // Reduce bundle size
    optimizePackageImports: ['@supabase/supabase-js']
  },
  // Optimize for edge runtime
  webpack: (config, { isServer }) => {
    // Reduce bundle size
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  },
  // Disable source maps in production to reduce size
  productionBrowserSourceMaps: false,
  // Optimize images
  images: {
    formats: ['image/webp'],
    minimumCacheTTL: 60,
  }
}

module.exports = nextConfig
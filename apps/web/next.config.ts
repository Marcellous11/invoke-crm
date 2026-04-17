import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@invoke/types'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
}

export default nextConfig

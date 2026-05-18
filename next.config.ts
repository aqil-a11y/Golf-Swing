import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['@google/generative-ai'],
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
}

export default nextConfig

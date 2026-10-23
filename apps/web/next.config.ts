import type { NextConfig } from 'next'

const config: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    qualities: [75, 85],
  },
  experimental: {
    agentUpgrade: 'security',
  },
}

export default config

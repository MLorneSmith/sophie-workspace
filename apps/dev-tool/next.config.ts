import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@kit/ui', '@kit/shared'],
  experimental: {
    reactCompiler: true,
  },
  devIndicators: {
    position: 'bottom-right',
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;

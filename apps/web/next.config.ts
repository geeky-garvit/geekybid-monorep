import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // Point to the root of the Turborepo monorepo (up two directories from apps/web)
  outputFileTracingRoot: path.resolve(__dirname, '../../'),
  
  // Explicitly transpile packages that might be shared across workspaces
  transpilePackages: ['lucide-react'],

  // Mark Prisma as external so Turbopack doesn't attempt to transpile native C++ binaries
  serverExternalPackages: ['@prisma/client', '.prisma/client'],

  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.dummyjson.com',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
  },
};

export default nextConfig;
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // build portabil, ideal pentru producție (ex: Vercel, Docker)
  output: 'standalone',

  images: {
    domains: [
      'localhost',
      'cdn.example.com',
      'randari3d.ro',
      'media.sketchfab.com',
      'static.sketchfab.com',
      'sketchfab.com',
      'sketchfab-prod-media.s3.amazonaws.com',
    ],
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  // (opțional) dacă folosești fetch extern și vrei să permiți anumite surse
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
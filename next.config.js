/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '130.210.13.242',
        port: '3000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'novix-messenger-next-js.onrender.com',
        pathname: '/uploads/**',
      },
    ],
  },
  async headers() {
    const corsHeaders = [
      { key: 'Access-Control-Allow-Origin', value: '*' },
      { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,PATCH,DELETE,OPTIONS' },
      {
        key: 'Access-Control-Allow-Headers',
        value: 'Content-Type, Authorization, Accept, x-device-id, x-device-name, x-device-type, x-device-os, x-device-browser',
      },
      { key: 'Access-Control-Max-Age', value: '86400' },
    ];
    return [
      {
        source: '/uploads/:path*',
        headers: [
          ...corsHeaders,
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/transit_uploads/:path*',
        headers: [
          ...corsHeaders,
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/api/:path*',
        headers: corsHeaders,
      },
    ];
  },
  serverExternalPackages: ['better-sqlite3', 'ioredis'],
  typescript: {
    // Prevents Next.js OOM during the memory-heavy typecheck phase on 1GB VPS
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;

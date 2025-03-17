/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  i18n: {
    locales: ['en', 'ja'],
    defaultLocale: 'en',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.opensourceavatars.com',
      },
      {
        protocol: 'https',
        hostname: 'assetsdev.opensourceavatars.com',
      }
    ],
    unoptimized: process.env.NODE_ENV === 'development'
  },
  // Set output to 'standalone' for better handling of server components
  output: 'standalone',
  
  // Configure dynamic route handling
  experimental: {
    // Don't attempt to static generation for API routes
    serverComponentsExternalPackages: ['@prisma/client']
  },
  
  // Mark API routes as dynamic to prevent static generation attempts
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*'
      }
    ]
  },
  
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  }
};

module.exports = nextConfig;
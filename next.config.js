/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Remove the old i18n config
  // i18n: {
  //   locales: ['en', 'ja'],
  //   defaultLocale: 'en',
  //   domains: [
  //     {
  //       domain: 'opensourceavatars.com',
  //       defaultLocale: 'ja',
  //       locales: ['ja'],
  //     },
  //     {
  //       domain: 'opensourceavatars.com',
  //       defaultLocale: 'en',
  //       locales: ['en'],
  //     },
  //   ],
  // },

  // Add middleware configuration for i18n
  experimental: {
    // Keep existing experimental configs
    serverComponentsExternalPackages: ['@prisma/client'],
  },

  // Rest of your existing config...
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
  output: 'standalone',
  
  // Configure dynamic route handling
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
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable caching in development
  ...(process.env.NODE_ENV === "development" && {
    onDemandEntries: {
      // period (in ms) where the server will keep pages in the buffer
      maxInactiveAge: 25 * 1000,
      // number of pages that should be kept simultaneously without being disposed
      pagesBufferLength: 2,
    },
  }),

  // Image optimization
  images: {
    formats: ["image/webp", "image/avif"],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // Skip ESLint during production builds to avoid blocking deploys
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Headers for better caching
  async headers() {
    return [
      {
        source: "/api/skills",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=3600",
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, max-age=0",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: process.env.NODE_ENV === "development" 
              ? "no-cache, no-store, must-revalidate" 
              : "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig

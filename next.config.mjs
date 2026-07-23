// next.config.js

// ============================================
// PWA Configuration (next-pwa)
// ============================================
import withPWA from 'next-pwa';

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    // Google Fonts - cache for 1 year
    {
      urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
      },
    },
    // CDN static assets
    {
      urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'cdn-static',
        expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
    // Company CDN images
    {
      urlPattern: /^https:\/\/cdn\.themototrack\.com\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'cdn-images',
        expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 },
      },
    },
    // Vivens CDN
    {
      urlPattern: /^https:\/\/cdn\.vivens\.pro\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'vivens-cdn',
        expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 7 },
      },
    },
    // Boostly CDN
    {
      urlPattern: /^https:\/\/cdn\.boostly\.buzz\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'boostly-cdn',
        expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 },
      },
    },
    // Dreamstime images
    {
      urlPattern: /^https:\/\/thumbs\.dreamstime\.com\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'dreamstime-images',
        expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 },
      },
    },
    // YouTube thumbnails
    {
      urlPattern: /^https:\/\/img\.youtube\.com\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'youtube-thumbnails',
        expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 },
      },
    },
    // YouTube videos (cached for offline viewing)
    {
      urlPattern: /^https:\/\/www\.youtube\.com\/embed\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'youtube-videos',
        expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 1 },
      },
    },
    // API routes - network first with fallback
    {
      urlPattern: /\/api\//,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        networkTimeoutSeconds: 10,
        expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
      },
    },
    // Images (local + external)
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
    // JS/CSS bundles
    {
      urlPattern: /\.(?:js|css)$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources',
        expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 },
      },
    },
    // Next.js data requests
    {
      urlPattern: /\/_next\/data\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'next-data',
        expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 },
      },
    },
    // Page navigations (HTML)
    {
      urlPattern: /\/$/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages',
        expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,

  // Standalone output for Docker/PM2
  output: 'standalone',

  logging: {
    fetches: { fullUrl: true },
  },

  staticPageGenerationTimeout: 120,

  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? { exclude: ['error', 'warn'] }
        : false,
  },

  // ============================================
  // Image Optimization
  // ============================================
  images: {
    remotePatterns: [
      // Dreamstime - for stock images
      {
        protocol: 'https',
        hostname: 'thumbs.dreamstime.com',
      },
      {
        protocol: 'https',
        hostname: 'img.dreamstime.com',
      },
      {
        protocol: 'https',
        hostname: '*.dreamstime.com',
      },
      // YouTube thumbnails
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: '*.ytimg.com',
      },
      // Google services
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
      },
      // Placeholder services
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      // Unsplash
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.shared.schoolhub.rw',
      },
      // Cloudflare R2 storage
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
      },
      // TheMotoTrack CDN
      {
        protocol: 'https',
        hostname: 'cdn.themototrack.com',
      },
      // Vivens CDN
      {
        protocol: 'https',
        hostname: 'cdn.vivens.pro',
      },
      // Boostly CDN
      {
        protocol: 'https',
        hostname: 'cdn.boostly.buzz',
      },
      {
        protocol: 'https',
        hostname: '*.boostly.buzz',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  // ============================================
  // Experimental
  // ============================================
  experimental: {
    optimizePackageImports: ['gsap', 'lucide-react', 'framer-motion'],
  },

  // ============================================
  // Environment Variables
  // ============================================
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY:
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    NEXT_PUBLIC_R2_CDN_DOMAIN: process.env.R2_CDN_DOMAIN,
    NEXT_VERIFY_URL_URL: process.env.NEXT_VERIFY_URL_URL,
  },

  // ============================================
  // Rewrites (Legal Pages)
  // ============================================
  async rewrites() {
    return [
      {
        source:
          '/:slug(privacy|terms|dpa|gdpr|cookie-policy|security-policy|acceptable-use|data-retention)',
        destination: '/legal/:slug',
      },
    ];
  },

  // ============================================
  // Security Headers
  // ============================================
  async headers() {
    return [
      // All routes - Security headers
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
          { key: 'X-Download-Options', value: 'noopen' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: [
              'camera=()',
              'microphone=()',
              'geolocation=(self)',
              'interest-cohort=()',
            ].join(', '),
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Jivo widget (code.jivosite.com + its subdomains) added below
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://www.youtube.com https://www.youtube-nocookie.com https://www.google.com https://code.jivosite.com https://*.jivosite.com https://*.jivo.ru",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com https://*.jivosite.com",
              "font-src 'self' data: https://fonts.googleapis.com https://fonts.gstatic.com https://cdnjs.cloudflare.com https://*.jivosite.com",
              "img-src 'self' data: https: http: https://cdn.themototrack.com https://cdn.shared.schoolhub.rw https://*.r2.cloudflarestorage.com https://images.unsplash.com https://cdn.vivens.pro https://cdn.boostly.buzz https://thumbs.dreamstime.com https://img.dreamstime.com https://img.youtube.com https://i.ytimg.com https://www.google.com https://*.jivosite.com",
              "connect-src 'self' https: http: ws: wss: https://www.youtube.com https://www.youtube-nocookie.com https://*.jivosite.com wss://*.jivosite.com",
              "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://www.google.com https://www.youtube.com/embed/* https://*.jivosite.com",
              "frame-ancestors 'none'",
              "worker-src 'self' blob:",
              "manifest-src 'self'",
              "media-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://www.youtube.com/embed/*",
              "child-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://*.jivosite.com",
            ].join('; '),
          },
        ],
      },
      // API Upload - CORS
      {
        source: '/api/upload/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
        ],
      },
      // Service Worker
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      // Manifest
      {
        source: '/manifest.json',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600' },
          { key: 'Content-Type', value: 'application/manifest+json' },
        ],
      },
      // Icons - long cache
      {
        source: '/icons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default pwaConfig(nextConfig);

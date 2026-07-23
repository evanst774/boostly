// src/app/layout.tsx
import type { Metadata, Viewport } from 'next';
// import Script from 'next/script';
import './globals.css';
import ClientLayout from './ClientLayout';

// ============================================
// THIRD-PARTY WIDGETS
// ============================================
// Jivo live-chat widget ID, configurable per environment via .env.
// Must be NEXT_PUBLIC_-prefixed since it's read on the client.
// const JIVO_WIDGET_ID = process.env.NEXT_PUBLIC_JIVO_WIDGET_ID;

// ============================================
// VIEWPORT CONFIGURATION (Mobile-first)
// ============================================
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2563EB' },
    { media: '(prefers-color-scheme: dark)', color: '#050B1A' },
  ],
};

// ============================================
// METADATA - Boostly
// ============================================
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'https://boostly.buzz',
  ),

  title: {
    default: 'Boostly - Earn Rewards. Get Paid. Every Day.',
    template: '%s | Boostly',
  },

  description:
    'Boostly is the ultimate rewards platform where you earn real money by watching videos, playing games, completing surveys, and referring friends. Start earning today!',

  keywords: [
    'Boostly',
    'Earn Money',
    'Rewards Platform',
    'Watch Videos Earn Money',
    'Play Games Earn Money',
    'Online Surveys',
    'Referral Program',
    'Daily Rewards',
    'Get Paid',
    'Rwanda',
    'Africa',
  ],

  authors: [{ name: 'Boostly', url: 'https://boostly.buzz' }],
  creator: 'Boostly',
  publisher: 'Boostly',

  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  // PWA manifest
  manifest: '/manifest.json',

  openGraph: {
    title: 'Boostly - Earn Rewards. Get Paid. Every Day.',
    description:
      'Earn real money by watching videos, playing games, completing surveys, and referring friends.',
    url: 'https://boostly.buzz',
    siteName: 'Boostly',
    images: [
      {
        url: '/img/logo/icon.png',
        width: 512,
        height: 512,
        alt: 'Boostly - Earn Rewards',
      },
    ],
    locale: 'en_RW',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Boostly - Earn Rewards. Get Paid. Every Day.',
    description:
      'Earn real money by watching videos, playing games, completing surveys, and referring friends.',
    images: ['/img/logo/icon.png'],
    site: '@boostly',
    creator: '@boostly',
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  icons: {
    icon: [
      { url: '/img/favicons/favicon.ico', sizes: 'any' },
      {
        url: '/img/favicons/favicon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
      },
      { url: '/img/logo/icon.png', sizes: '192x192', type: 'image/png' },
      { url: '/img/logo/icon.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: [{ url: '/img/favicons/favicon.ico' }],
    apple: [
      {
        url: '/img/favicons/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
      { url: '/img/logo/icon.png', sizes: '192x192', type: 'image/png' },
    ],
  },

  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Boostly',
    startupImage: [],
  },

  applicationName: 'Boostly',
  category: 'rewards',
};

// ============================================
// SERVER LAYOUT
// ============================================
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect for external resources */}
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" />
        <link
          rel="preconnect"
          href="https://cdnjs.cloudflare.com"
          crossOrigin="anonymous"
        />

        {/* Font Awesome */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
          crossOrigin="anonymous"
        />

        {/*
          Google Fonts (Inter, Outfit, Space Grotesk) are now loaded via
          next/font/google in ClientLayout.tsx instead of a manual <link>
          tag here. next/font self-hosts and optimizes the font files at
          build time, avoiding a runtime request to fonts.googleapis.com
          and fixing the `no-page-custom-font` warning. The preconnects
          for fonts.googleapis.com / fonts.gstatic.com have been removed
          since nothing fetches from them directly anymore.
        */}

        {/* Favicons */}
        <link rel="icon" href="/img/favicons/favicon.ico" sizes="any" />
        <link
          rel="icon"
          type="image/png"
          href="/img/favicons/favicon-96x96.png"
          sizes="96x96"
        />
        <link rel="shortcut icon" href="/img/favicons/favicon.ico" />
        <link
          rel="apple-touch-icon"
          href="/img/favicons/apple-touch-icon.png"
          sizes="180x180"
        />

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Theme & PWA */}
        <meta name="theme-color" content="#2563EB" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Boostly" />
        <meta name="msapplication-TileColor" content="#2563EB" />

        {/* Additional PWA meta tags */}
        <meta name="msapplication-starturl" content="/" />
        <meta name="msapplication-navbutton-color" content="#2563EB" />
      </head>
      <body>
        <ClientLayout>{children}</ClientLayout>

        {/* Jivo Live Chat Widget */}
        {/* {JIVO_WIDGET_ID && (
          <Script
            src={`https://code.jivosite.com/widget/${JIVO_WIDGET_ID}`}
            strategy="lazyOnload"
          />
        )} */}
        <script src="//code.jivosite.com/widget/2Ir0MowhfA" async></script>
      </body>
    </html>
  );
}

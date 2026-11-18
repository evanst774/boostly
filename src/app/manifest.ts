// src/app/manifest.ts
//
// The ONLY web app manifest (served by Next.js at /manifest.webmanifest).
// Static manifests under /public were removed: they described other products
// (MotoTrack ERP, SchoolHub) and pointed at icon files that don't exist,
// which made Boostly uninstallable.
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Boostly: Earn & Get Paid',
    short_name: 'Boostly',
    description:
      'Earn RWF for sponsored videos, games and surveys. Withdraw to MTN MoMo or Airtel Money, paid daily at 3:00 PM.',
    // Opens straight into the app; logged-out users are sent to /login.
    start_url: '/dashboard?source=pwa',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    orientation: 'portrait',
    background_color: '#070B14',
    theme_color: '#070B14',
    lang: 'en',
    dir: 'ltr',
    categories: ['finance', 'entertainment', 'lifestyle'],
    prefer_related_applications: false,
    icons: [
      { src: '/icons/android/launchericon-48x48.png', sizes: '48x48', type: 'image/png' },
      { src: '/icons/android/launchericon-72x72.png', sizes: '72x72', type: 'image/png' },
      { src: '/icons/android/launchericon-96x96.png', sizes: '96x96', type: 'image/png' },
      { src: '/icons/android/launchericon-144x144.png', sizes: '144x144', type: 'image/png' },
      { src: '/icons/android/launchericon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/android/launchericon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      {
        name: 'Earn',
        short_name: 'Earn',
        description: "Today's videos, games and surveys",
        url: '/earn/videos?source=pwa-shortcut',
        icons: [{ src: '/icons/android/launchericon-96x96.png', sizes: '96x96' }],
      },
      {
        name: 'Withdraw',
        short_name: 'Withdraw',
        description: 'Withdraw to mobile money',
        url: '/wallet/withdraw?source=pwa-shortcut',
        icons: [{ src: '/icons/android/launchericon-96x96.png', sizes: '96x96' }],
      },
      {
        name: 'Wallet',
        short_name: 'Wallet',
        description: 'Balance and payouts',
        url: '/wallet?source=pwa-shortcut',
        icons: [{ src: '/icons/android/launchericon-96x96.png', sizes: '96x96' }],
      },
    ],
  };
}

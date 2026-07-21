// src/app/ClientLayout.tsx
'use client';

import { useState, useEffect } from 'react';
import localFont from 'next/font/local';
import { Manrope, Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import NextTopLoader from 'nextjs-toploader';
import { Providers } from './providers';
import CookieConsent from '@/components/CookieConsent';
import { PageLoader } from '@/components/PageLoader';
import { WithdrawalToast } from '@/components/WithdrawalToast';

// ============================================
// GOOGLE FONTS - Boostly Primary
// ============================================

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

// ============================================
// LOCAL FONTS
// ============================================

const avenirMedium = localFont({
  src: '../../public/fonts/Avenir_Medium/AvenirMedium.ttf',
  variable: '--font-avenir-medium',
  weight: '500',
});

const avenirBlack = localFont({
  src: '../../public/fonts/Avenir_Black/AvenirBlack.ttf',
  variable: '--font-avenir-black',
  weight: '900',
});

// Outfit - using local files (working approach from old version)
const outfit = localFont({
  src: '../../public/fonts/Outfit/static/Outfit-Regular.ttf',
  variable: '--font-outfit',
  weight: '400',
});

const outfitMedium = localFont({
  src: '../../public/fonts/Outfit/static/Outfit-Medium.ttf',
  variable: '--font-outfit-medium',
  weight: '500',
});

// ES Rebond Grotesque - using the actual files from rebond-grotesque folder
// Based on your ls output, the files are in rebond-grotesque/ with .otf extension
// Note: The actual filenames have a hash suffix like -BF66189040400df.otf
// We'll use the base names without the hash

const rebondThin = localFont({
  src: '../../public/fonts/rebond-grotesque/ESRebondGrotesqueTRIAL-Thin.otf',
  variable: '--font-rebond-thin',
  weight: '100',
});

const rebondLight = localFont({
  src: '../../public/fonts/rebond-grotesque/ESRebondGrotesqueTRIAL-Light.otf',
  variable: '--font-rebond-light',
  weight: '300',
});

const rebondRegular = localFont({
  src: '../../public/fonts/rebond-grotesque/ESRebondGrotesqueTRIAL-Regular.otf',
  variable: '--font-rebond-regular',
  weight: '400',
});

const rebondMedium = localFont({
  src: '../../public/fonts/rebond-grotesque/ESRebondGrotesqueTRIAL-Medium.otf',
  variable: '--font-rebond-medium',
  weight: '500',
});

const rebondSemibold = localFont({
  src: '../../public/fonts/rebond-grotesque/ESRebondGrotesqueTRIAL-Semibold.otf',
  variable: '--font-rebond-semibold',
  weight: '600',
});

const rebondBold = localFont({
  src: '../../public/fonts/rebond-grotesque/ESRebondGrotesqueTRIAL-Bold.otf',
  variable: '--font-rebond-bold',
  weight: '700',
});

const rebondExtrabold = localFont({
  src: '../../public/fonts/rebond-grotesque/ESRebondGrotesqueTRIAL-Extrabold.otf',
  variable: '--font-rebond-extrabold',
  weight: '800',
});

const cascadiaRegular = localFont({
  src: '../../public/fonts/cascadia-code/CascadiaCode-Regular.ttf',
  variable: '--font-cascadia-regular',
  weight: '400',
});

const cascadiaItalic = localFont({
  src: '../../public/fonts/cascadia-code/CascadiaCode-Italic.ttf',
  variable: '--font-cascadia-italic',
  weight: '400',
  style: 'italic',
});

const cascadiaBold = localFont({
  src: '../../public/fonts/cascadia-code/CascadiaCode-Bold.ttf',
  variable: '--font-cascadia-bold',
  weight: '700',
});

const fkGrotesk = localFont({
  src: '../../public/fonts/fk-grotesk/FKGroteskTrial-Regular.otf',
  variable: '--font-fk-grotesk',
  weight: '400',
});

const fkGroteskMedium = localFont({
  src: '../../public/fonts/fk-grotesk/FKGroteskTrial-Medium.otf',
  variable: '--font-fk-grotesk-medium',
  weight: '500',
});

const fkGroteskBold = localFont({
  src: '../../public/fonts/fk-grotesk/FKGroteskTrial-Bold.otf',
  variable: '--font-fk-grotesk-bold',
  weight: '700',
});

const fkGroteskLight = localFont({
  src: '../../public/fonts/fk-grotesk/FKGroteskTrial-Light.otf',
  variable: '--font-fk-grotesk-light',
  weight: '300',
});

// ============================================
// CLIENT LAYOUT
// ============================================
export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`
        ${manrope.variable}
        ${plusJakartaSans.variable}
        ${spaceGrotesk.variable}
        ${avenirMedium.variable}
        ${avenirBlack.variable}
        ${outfit.variable}
        ${outfitMedium.variable}
        ${rebondThin.variable}
        ${rebondLight.variable}
        ${rebondRegular.variable}
        ${rebondMedium.variable}
        ${rebondSemibold.variable}
        ${rebondBold.variable}
        ${rebondExtrabold.variable}
        ${cascadiaRegular.variable}
        ${cascadiaItalic.variable}
        ${cascadiaBold.variable}
        ${fkGrotesk.variable}
        ${fkGroteskMedium.variable}
        ${fkGroteskBold.variable}
        ${fkGroteskLight.variable}
      `}
    >
      {/* Page Loader */}
      <PageLoader isLoading={isLoading} />

      {/* Next.js Top Loader */}
      <NextTopLoader
        color="#3366FF"
        initialPosition={0.08}
        crawlSpeed={200}
        height={3}
        crawl={true}
        showSpinner={false}
        easing="ease"
        speed={200}
        shadow="0 0 10px #3366FF, 0 0 5px #06B6D4"
        zIndex={1600}
      />

      {/* Providers */}
      <Providers>
        <main className="min-h-screen bg-background-primary text-white font-outfit antialiased">
          {children}
        </main>
        <CookieConsent />
      </Providers>

      {/* ============================================
          WITHDRAWAL TOAST - Global Social Proof
          Shows rotating withdrawal notifications
          ============================================ */}
      <WithdrawalToast
        interval={50000}
        showDuration={5000}
        maxNotifications={200}
      />

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#0D1835',
            color: '#ffffff',
            border: '1px solid rgba(51, 102, 255, 0.3)',
            boxShadow:
              '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(51, 102, 255, 0.1)',
            borderRadius: '0.75rem',
            padding: '1rem',
            fontFamily: 'var(--font-outfit), sans-serif',
          },
          success: {
            duration: 3000,
            style: {
              background: 'linear-gradient(135deg, #0D1835, #071122)',
              borderLeft: '4px solid #22c55e',
            },
            iconTheme: {
              primary: '#22c55e',
              secondary: '#ffffff',
            },
          },
          error: {
            duration: 4000,
            style: {
              background: 'linear-gradient(135deg, #0D1835, #071122)',
              borderLeft: '4px solid #ef4444',
            },
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
          loading: {
            style: {
              background: 'linear-gradient(135deg, #0D1835, #071122)',
              borderLeft: '4px solid #3b82f6',
            },
          },
        }}
      />
    </div>
  );
}

// src/components/landing/Navbar.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useT } from '@/lib/i18n';
import { landing } from '@/lib/i18n/messages/landing';

const LINKS = [
  { label: 'navWays', href: '/#earn' },
  { label: 'navHow', href: '/#how-it-works' },
  { label: 'navPayouts', href: '/#payouts' },
  { label: 'navFaq', href: '/#faq' },
] as const;

/** Transparent over the dark hero, solid once the page scrolls. */
export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const t = useT(landing);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-colors duration-300',
        scrolled
          ? 'bg-[#070B14]/90 backdrop-blur-md border-b border-white/[0.06]'
          : 'bg-transparent',
      )}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3 lg:gap-6">
        <Link href="/" aria-label="Boostly" className="flex items-center gap-2.5 shrink-0">
          <Image
            src="/img/logo/icon.png"
            alt=""
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="hidden xs:inline font-rebond-bold text-lg tracking-tight text-white">Boostly</span>
        </Link>

        <ul className="hidden lg:flex items-center gap-1 ml-4">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="px-3 py-2 rounded-lg text-sm text-white/65 hover:text-white transition-colors"
              >
                {t(l.label)}
              </a>
            </li>
          ))}
        </ul>

        <div className="ml-auto hidden lg:flex items-center gap-2">
          <LanguageSwitcher variant="compact" className="mr-1 text-white/80" />
          <Link href="/login" className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white">
            {t('logIn')}
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 rounded-full bg-gold hover:bg-gold-hover text-[#111827] text-sm font-bold transition-colors"
          >
            {t('startEarning')}
          </Link>
        </div>

        <div className="lg:hidden ml-auto flex items-center gap-2">
          <LanguageSwitcher variant="compact" className="text-white/80" />
          <Link
            href="/login"
            className="shrink-0 whitespace-nowrap rounded-full border border-white/15 px-3 xs:px-4 py-1.5 text-sm font-semibold text-white"
          >
            {t('logIn')}
          </Link>
        </div>
      </nav>

    </header>
  );
}

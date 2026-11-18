// src/components/landing/Navbar.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const LINKS = [
  { label: 'Ways to earn', href: '/#earn' },
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'Payouts', href: '/#payouts' },
  { label: 'FAQ', href: '/#faq' },
];

/** Transparent over the dark hero, solid once the page scrolls. */
export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

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
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <Image
            src="/img/logo/icon.png"
            alt=""
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="font-rebond-bold text-lg tracking-tight text-white">Boostly</span>
        </Link>

        <ul className="hidden lg:flex items-center gap-1 ml-4">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="px-3 py-2 rounded-lg text-sm text-white/65 hover:text-white transition-colors"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="ml-auto hidden lg:flex items-center gap-2">
          <Link href="/login" className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white">
            Log in
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 rounded-full bg-gold hover:bg-gold-hover text-[#111827] text-sm font-bold transition-colors"
          >
            Start earning
          </Link>
        </div>

        <Link
          href="/login"
          className="lg:hidden ml-auto rounded-full border border-white/15 px-4 py-1.5 text-sm font-semibold text-white"
        >
          Log in
        </Link>
      </nav>

    </header>
  );
}

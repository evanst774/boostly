// src/components/landing/Navbar.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
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
  const [open, setOpen] = useState(false);

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
        scrolled || open
          ? 'bg-[#070B14]/90 backdrop-blur-md border-b border-white/[0.06]'
          : 'bg-transparent',
      )}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2.5 shrink-0" onClick={() => setOpen(false)}>
          <Image
            src="/img/logo/icon.png"
            alt=""
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="font-rebond-bold text-lg tracking-tight text-white">Boostly</span>
        </Link>

        <ul className="hidden md:flex items-center gap-1 ml-4">
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

        <div className="ml-auto hidden md:flex items-center gap-2">
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

        <button
          type="button"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="md:hidden ml-auto w-10 h-10 -mr-2 flex items-center justify-center text-white"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {open && (
        <div className="md:hidden border-t border-white/[0.06] px-4 pb-5 pt-2">
          <ul className="flex flex-col">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block py-3 text-base text-white/80 border-b border-white/[0.06]"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <Link href="/login" className="py-3 rounded-full text-center text-sm font-semibold text-white border border-white/15">
              Log in
            </Link>
            <Link href="/register" className="py-3 rounded-full text-center text-sm font-bold bg-gold text-[#111827]">
              Start earning
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

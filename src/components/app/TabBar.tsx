// src/components/app/TabBar.tsx
//
// The phone tab bar, shared by the signed-in app and the public landing page
// so both feel like the same app. Five slots in the same positions:
//   app:   Home · Earn · Wallet · Plans · Me
//   guest: Home · Earn · Payouts · Help · Join
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Crown,
  HelpCircle,
  Home,
  PlayCircle,
  UserCircle2,
  UserPlus,
  Wallet,
  Banknote,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Tab {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Path prefixes that mark this tab active (app variant). */
  match?: string[];
  /** Landing section id that marks this tab active (guest variant). */
  section?: string;
  primary?: boolean;
}

export const APP_TABS: Tab[] = [
  { label: 'Home', href: '/dashboard', icon: Home, match: ['/dashboard'] },
  { label: 'Earn', href: '/earn/videos', icon: PlayCircle, match: ['/earn'] },
  { label: 'Wallet', href: '/wallet', icon: Wallet, match: ['/wallet'] },
  { label: 'Plans', href: '/plans', icon: Crown, match: ['/plans'] },
  {
    label: 'Me',
    href: '/me',
    icon: UserCircle2,
    match: ['/me', '/settings', '/referrals', '/badges', '/notifications'],
  },
];

const GUEST_TABS: Tab[] = [
  { label: 'Home', href: '/#top', icon: Home, section: 'top' },
  { label: 'Earn', href: '/#earn', icon: PlayCircle, section: 'earn' },
  { label: 'Payouts', href: '/#payouts', icon: Banknote, section: 'payouts' },
  { label: 'Help', href: '/#faq', icon: HelpCircle, section: 'faq' },
  { label: 'Join', href: '/register', icon: UserPlus, primary: true },
];

/** Which landing section is on screen (for the guest variant). */
function useActiveSection(ids: string[], enabled: boolean) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    if (!enabled) return;
    const onScroll = () => {
      const probe = window.innerHeight * 0.35;
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= probe) current = id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [enabled, ids]);
  return active;
}

export function TabBar({
  variant = 'app',
  badges = {},
}: {
  variant?: 'app' | 'guest';
  /** Small count badges by tab label, e.g. { Me: 3 }. */
  badges?: Record<string, number>;
}) {
  const pathname = usePathname() || '/';
  const tabs = variant === 'app' ? APP_TABS : GUEST_TABS;
  const sectionIds = GUEST_TABS.filter((t) => t.section).map((t) => t.section!);
  const activeSection = useActiveSection(sectionIds, variant === 'guest');

  const isActive = (t: Tab) =>
    variant === 'app'
      ? (t.match ?? []).some((m) => pathname === m || pathname.startsWith(`${m}/`))
      : t.section === activeSection;

  const dark = variant === 'guest';

  return (
    <nav
      aria-label="Main"
      className={cn(
        'lg:hidden fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-xl',
        dark
          ? 'bg-[#070B14]/90 border-white/[0.08]'
          : 'bg-white/90 dark:bg-[#0F172A]/90 border-[#E2E8F0] dark:border-[#1E293B]',
      )}
      // Home-indicator space goes OUTSIDE the 64px row so tabs never shrink.
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto grid h-16 max-w-md grid-cols-5 px-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = isActive(t);
          const count = badges[t.label] ?? 0;

          if (t.primary) {
            return (
              <li key={t.label} className="flex items-center justify-center">
                <Link
                  href={t.href}
                  className="flex h-11 min-w-[64px] flex-col items-center justify-center rounded-2xl bg-gold px-3 text-[#111827] shadow-[0_8px_20px_-8px_rgba(251,191,36,0.7)] active:scale-95 transition-transform"
                >
                  <Icon size={18} strokeWidth={2.4} />
                  <span className="text-[10px] font-bold leading-tight">{t.label}</span>
                </Link>
              </li>
            );
          }

          return (
            <li key={t.label}>
              <Link
                href={t.href}
                data-tour={variant === 'app' ? `nav-${t.label.toLowerCase()}` : undefined}
                aria-current={active ? 'page' : undefined}
                className="group relative flex h-full flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
              >
                <span
                  className={cn(
                    'relative flex h-8 w-14 items-center justify-center rounded-full transition-colors',
                    active
                      ? dark
                        ? 'bg-white/10'
                        : 'bg-[#EFF6FF] dark:bg-[#2563EB]/20'
                      : 'bg-transparent',
                  )}
                >
                  <Icon
                    size={21}
                    strokeWidth={active ? 2.4 : 2}
                    className={cn(
                      active
                        ? dark
                          ? 'text-white'
                          : 'text-[#2563EB] dark:text-[#60A5FA]'
                        : dark
                          ? 'text-white/50'
                          : 'text-[#64748B] dark:text-[#94A3B8]',
                    )}
                  />
                  {count > 0 && (
                    <span className="absolute right-2 top-0 min-w-[16px] h-4 px-1 rounded-full bg-[#EF4444] text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-[#0F172A]">
                      {count > 9 ? '9+' : count}
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    'text-[11px] leading-none',
                    active ? 'font-semibold' : 'font-medium',
                    active
                      ? dark
                        ? 'text-white'
                        : 'text-[#0F172A] dark:text-white'
                      : dark
                        ? 'text-white/50'
                        : 'text-[#64748B] dark:text-[#94A3B8]',
                  )}
                >
                  {t.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

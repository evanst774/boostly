// src/components/app/EarnSwitcher.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClipboardCheck, Gamepad2, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import { common } from '@/lib/i18n/messages/common';

const ITEMS = [
  { href: '/earn/videos', label: 'videos', icon: PlayCircle },
  { href: '/earn/games', label: 'games', icon: Gamepad2 },
  { href: '/earn/surveys', label: 'surveys', icon: ClipboardCheck },
] as const;

/** Segmented control for the Earn tab. Sticks under the app bar on scroll. */
export function EarnSwitcher() {
  const pathname = usePathname() || '';
  const t = useT(common);
  return (
    <div
      className="sticky z-20 -mx-4 px-4 py-2 bg-[#F8FAFC]/90 dark:bg-[#0F172A]/90 backdrop-blur-md lg:static lg:mx-0 lg:px-0 lg:py-0 lg:bg-transparent lg:backdrop-blur-none"
      // Sits right under the 56px app bar (plus the notch on phones).
      style={{ top: 'calc(56px + env(safe-area-inset-top))' }}
    >
      <nav
        aria-label="Ways to earn"
        className="grid grid-cols-3 gap-1 rounded-2xl bg-[#E2E8F0]/70 dark:bg-[#1E293B] p-1 lg:max-w-md"
      >
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex h-10 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold transition-colors',
                active
                  ? 'bg-white text-[#0F172A] shadow-sm dark:bg-[#334155] dark:text-white'
                  : 'text-[#64748B] hover:text-[#0F172A] dark:text-[#94A3B8] dark:hover:text-white',
              )}
            >
              <Icon size={16} />
              {t(label)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

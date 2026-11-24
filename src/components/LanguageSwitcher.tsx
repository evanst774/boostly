// src/components/LanguageSwitcher.tsx — pick English / Français / Kiswahili.
'use client';

import { Languages } from 'lucide-react';
import { LOCALES, LOCALE_NAMES, useLocale, type Locale } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/** Segmented control (settings, Me) or a compact select (headers). */
export function LanguageSwitcher({ variant = 'segmented', className }: { variant?: 'segmented' | 'compact'; className?: string }) {
  const { locale, setLocale } = useLocale();

  if (variant === 'compact') {
    return (
      <label className={cn('relative inline-flex items-center', className)}>
        <Languages size={16} className="pointer-events-none absolute left-2.5 opacity-70" aria-hidden />
        <select
          aria-label="Language"
          value={locale}
          onChange={(e) => setLocale(e.target.value as Locale)}
          className="appearance-none rounded-xl border border-current/20 bg-transparent py-1.5 pl-8 pr-3 text-sm font-semibold outline-none"
        >
          {LOCALES.map((l) => (
            <option key={l} value={l} className="text-[#0F172A]">
              {LOCALE_NAMES[l]}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <div role="radiogroup" aria-label="Language" className={cn('grid grid-cols-3 gap-1 rounded-xl bg-[#F1F5F9] p-1 dark:bg-[#0F172A]', className)}>
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          role="radio"
          aria-checked={locale === l}
          onClick={() => setLocale(l)}
          className={cn(
            'rounded-lg py-2 text-sm font-semibold transition-colors',
            locale === l
              ? 'bg-white text-[#0F172A] shadow-sm dark:bg-[#334155] dark:text-white'
              : 'text-[#64748B] hover:text-[#0F172A] dark:text-[#94A3B8] dark:hover:text-white',
          )}
        >
          {LOCALE_NAMES[l]}
        </button>
      ))}
    </div>
  );
}

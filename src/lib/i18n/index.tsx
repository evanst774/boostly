// src/lib/i18n/index.tsx
//
// English, Français and Kiswahili for the member-facing app.
//
//   const t = useT(common);             // one namespace per app area
//   t('save')                          // "Save" / "Enregistrer" / "Hifadhi"
//   t('balanceIs', { amount: '500' })  // "{amount}" placeholders
//
// Each area keeps its strings in src/lib/i18n/messages/<area>.ts as
//   export const <area> = defineMessages({ en: {...}, fr: {...}, sw: {...} })
// English is the source of truth: a key missing in fr/sw falls back to en,
// so the UI never shows an empty string or a raw key.
//
// The choice is stored per device and defaults to the phone/browser language.
'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export const LOCALES = ['en', 'fr', 'sw'] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
  sw: 'Kiswahili',
};

/** BCP-47 tags for Intl (numbers, dates). */
export const LOCALE_TAGS: Record<Locale, string> = { en: 'en-GB', fr: 'fr-FR', sw: 'sw-KE' };

const STORAGE_KEY = 'boostly-locale';
const COOKIE = 'boostly-locale';

type Dict = Record<string, string>;
export interface Messages<K extends string = string> {
  en: Record<K, string>;
  fr: Partial<Record<K, string>>;
  sw: Partial<Record<K, string>>;
}

/** Declare an area's strings; English defines the keys. */
export function defineMessages<K extends string>(m: Messages<K>): Messages<K> {
  return m;
}

function detect(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && (LOCALES as readonly string[]).includes(saved)) return saved as Locale;
  } catch {
    /* private mode */
  }
  const nav = (typeof navigator !== 'undefined' && navigator.language) || 'en';
  if (nav.toLowerCase().startsWith('fr')) return 'fr';
  if (nav.toLowerCase().startsWith('sw')) return 'sw';
  return 'en';
}

interface Ctx {
  locale: Locale;
  setLocale: (l: Locale) => void;
}

const LocaleContext = createContext<Ctx>({ locale: 'en', setLocale: () => undefined });

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  // Server HTML is English; the saved language applies right after mount.
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    setLocaleState(detect());
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
    document.cookie = `${COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}

function interpolate(s: string, vars?: Record<string, string | number>) {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

/** Translator for one area. Keys are type-checked against the English set. */
export function useT<K extends string>(messages: Messages<K>) {
  const { locale } = useLocale();
  return useCallback(
    (key: K, vars?: Record<string, string | number>) => {
      const table = (messages[locale] ?? {}) as Partial<Record<K, string>>;
      return interpolate(table[key] ?? (messages.en as Dict)[key] ?? key, vars);
    },
    [locale, messages],
  );
}

/** Format a number for the current language (thousands separators etc.). */
export function useFormatNumber() {
  const { locale } = useLocale();
  return useCallback((n: number) => n.toLocaleString(LOCALE_TAGS[locale]), [locale]);
}

// src/lib/constants/preferences.ts
export interface UserPreferences {
  darkMode: boolean;
  notifications: boolean;
  emailNotifications: boolean;
  soundEffects: boolean;
  language: 'en' | 'fr' | 'sw';
  /** Show my first name + initial in public payout lists. */
  showOnLeaderboard: boolean;
  analytics: boolean;
  /** Default MTN/Airtel number for withdrawals (normalised, e.g. 0781234567). */
  payoutPhone: string | null;
  /** Name registered on that mobile money account. */
  payoutName: string | null;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  darkMode: false,
  notifications: true,
  emailNotifications: true,
  soundEffects: true,
  language: 'en',
  showOnLeaderboard: true,
  analytics: true,
  payoutPhone: null,
  payoutName: null,
};

/** Keep only known keys with the right types; fill the rest with defaults. */
export function normalizePreferences(raw: unknown): UserPreferences {
  const src = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const out: UserPreferences = { ...DEFAULT_PREFERENCES };
  for (const key of Object.keys(DEFAULT_PREFERENCES) as (keyof UserPreferences)[]) {
    const v = src[key];
    if (key === 'language') {
      if (v === 'en' || v === 'fr' || v === 'sw') out.language = v;
    } else if (key === 'payoutPhone' || key === 'payoutName') {
      out[key] = typeof v === 'string' && v.trim() ? v.trim().slice(0, 80) : null;
    } else if (typeof v === 'boolean') {
      (out[key] as boolean) = v;
    }
  }
  return out;
}

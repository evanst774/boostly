// src/lib/constants/preferences.ts
export interface UserPreferences {
  darkMode: boolean;
  notifications: boolean;
  emailNotifications: boolean;
  soundEffects: boolean;
  language: 'en';
  /** Show my first name + initial in public payout lists. */
  showOnLeaderboard: boolean;
  analytics: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  darkMode: false,
  notifications: true,
  emailNotifications: true,
  soundEffects: true,
  language: 'en',
  showOnLeaderboard: true,
  analytics: true,
};

/** Keep only known keys with the right types; fill the rest with defaults. */
export function normalizePreferences(raw: unknown): UserPreferences {
  const src = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const out: UserPreferences = { ...DEFAULT_PREFERENCES };
  for (const key of Object.keys(DEFAULT_PREFERENCES) as (keyof UserPreferences)[]) {
    const v = src[key];
    if (key === 'language') {
      if (v === 'en') out.language = 'en';
    } else if (typeof v === 'boolean') {
      (out[key] as boolean) = v;
    }
  }
  return out;
}

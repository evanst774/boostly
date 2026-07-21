// src/types/sudo.ts

export type SudoMethod = 'EMAIL' | 'TOTP';

export interface SudoSettingsData {
  sessionDuration: number;
  codeExpiration: number;
  isConfigured: boolean;
}

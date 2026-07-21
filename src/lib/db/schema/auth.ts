// src/lib/db/schema/auth.ts
import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, index } from 'drizzle-orm/sqlite-core';
import { users } from './users';

// ============================================
// OTP VERIFICATIONS TABLE
// ============================================
export const otpTypes = [
  '2FA_LOGIN',
  'EMAIL_VERIFICATION',
  'PASSWORD_RESET',
  '2FA_SETUP',
  '2FA_DISABLE',
  'SUDO_VERIFICATION',
  'SUDO_SETTINGS_VERIFICATION',
] as const;
export type OtpType = (typeof otpTypes)[number];

export const otpVerifications = sqliteTable(
  'otp_verifications',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    type: text('type').$type<OtpType>().notNull(),
    expiresAt: text('expiresAt').notNull(),
    used: integer('used', { mode: 'boolean' }).notNull().default(false),
    createdAt: text('createdAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    updatedAt: text('updatedAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => [
    index('otp_user_id_idx').on(table.userId),
    index('otp_code_idx').on(table.code),
    index('otp_expires_at_idx').on(table.expiresAt),
  ],
);

// ============================================
// TWO-FACTOR AUTHENTICATION SESSIONS TABLE
// ============================================
export const twoFASessions = sqliteTable(
  'two_fa_sessions',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: text('expiresAt').notNull(),
    createdAt: text('createdAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => [
    index('twofa_session_user_id_idx').on(table.userId),
    index('twofa_session_expires_at_idx').on(table.expiresAt),
  ],
);

// ============================================
// SESSIONS TABLE
// ============================================
export const sessions = sqliteTable(
  'sessions',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    expiresAt: text('expiresAt').notNull(),
    createdAt: text('createdAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => [
    index('sessions_user_idx').on(table.userId),
    index('sessions_token_idx').on(table.token),
    index('sessions_expires_at_idx').on(table.expiresAt),
  ],
);

export const sudoSessions = sqliteTable(
  'sudo_sessions',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    expiresAt: text('expiresAt').notNull(),
    createdAt: text('createdAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    verifiedAt: text('verifiedAt'),
    isVerified: integer('isVerified', { mode: 'boolean' })
      .notNull()
      .default(false),
  },
  (table) => [
    index('sudo_sessions_user_idx').on(table.userId),
    index('sudo_sessions_token_idx').on(table.token),
    index('sudo_sessions_expires_at_idx').on(table.expiresAt),
  ],
);

// ============================================
// SUDO SETTINGS TABLE
// ============================================
export const sudoSettings = sqliteTable(
  'sudo_settings',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('userId')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    sessionDuration: integer('sessionDuration').notNull().default(15), // in minutes
    codeExpiration: integer('codeExpiration').notNull().default(5), // in minutes
    createdAt: text('createdAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    updatedAt: text('updatedAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => [index('sudo_settings_user_idx').on(table.userId)],
);

export type SudoSettings = typeof sudoSettings.$inferSelect;
export type NewSudoSettings = typeof sudoSettings.$inferInsert;
export type SudoSession = typeof sudoSessions.$inferSelect;
export type NewSudoSession = typeof sudoSessions.$inferInsert;

// src/lib/db/schema/email.ts
import { sql } from 'drizzle-orm';
import { sqliteTable, text, index } from 'drizzle-orm/sqlite-core';

// ============================================
// EMAIL TYPES ENUM
// ============================================
export const emailTypes = [
  'VERIFICATION',
  'PASSWORD_RESET',
  'WELCOME',
  'TWO_FA',
  'NEWSLETTER',
  'CONTACT_FORM',
  'CONTACT_AUTO_REPLY',
  'REMINDER',
  'INVOICE',
  'PAYMENT_RECEIPT',
  'SECURITY',
  '2FA_OTP',
  'SUDO_OTP',
  'ACCOUNT_LOCKED',
  'ACCOUNT_LOCKED_USER',
  'SECURITY_ALERT',
] as const;

export type EmailType = (typeof emailTypes)[number];

// ============================================
// EMAIL STATUS ENUM
// ============================================
export const emailStatuses = ['PENDING', 'SENT', 'FAILED'] as const;
export type EmailStatus = (typeof emailStatuses)[number];

// ============================================
// EMAIL LOGS TABLE
// ============================================
export const emailLogs = sqliteTable(
  'email_logs',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    to: text('to').notNull(),
    subject: text('subject').notNull(),
    type: text('type').$type<EmailType>().notNull(),
    status: text('status').$type<EmailStatus>().notNull().default('PENDING'),
    sentAt: text('sentAt'),
    error: text('error'),
    createdAt: text('createdAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => [
    index('email_logs_to_idx').on(table.to),
    index('email_logs_type_idx').on(table.type),
    index('email_logs_status_idx').on(table.status),
  ],
);

export type EmailLog = typeof emailLogs.$inferSelect;
export type NewEmailLog = typeof emailLogs.$inferInsert;

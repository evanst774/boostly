// src/lib/db/schema/audit.ts
import { sql } from 'drizzle-orm';
import { sqliteTable, text, index } from 'drizzle-orm/sqlite-core';
import { users } from './users';

// ============================================
// AUDIT ACTION ENUM - BOOSTLY SPECIFIC
// ============================================

export const auditActions = [
  // ========== AUTH & USER MANAGEMENT ==========
  'LOGIN',
  'LOGOUT',
  'LOGIN_FAILED',
  'PASSWORD_CHANGED',
  'PASSWORD_RESET_REQUESTED',
  'PASSWORD_RESET_COMPLETED',
  'PASSWORD_RESET_FAILED',
  'EMAIL_VERIFIED',
  'VERIFICATION_FAILED',
  'TWO_FA_ENABLED',
  'TWO_FA_DISABLED',
  'TWO_FA_VERIFIED',
  'ACCOUNT_LOCKED',
  'ACCOUNT_UNLOCKED',
  'ACCOUNT_LOCKED_NOTIFICATION',
  'OAUTH_ACCOUNT_CREATED',
  'OAUTH_ACCOUNT_LINKED',
  'OAUTH_LOGIN',

  // ========== USER MANAGEMENT ==========
  'USER_CREATED',
  'USER_UPDATED',
  'USER_ACTIVATED',
  'USER_DEACTIVATED',
  'USER_DELETED',
  'USER_ROLE_ASSIGNED',
  'USER_ROLE_REVOKED',
  'PROFILE_UPDATED',
  'EMAIL_CHANGED',
  'AVATAR_UPDATED',
  'AVATAR_REMOVED',

  // ========== RBAC ==========
  'ROLE_CREATED',
  'ROLE_UPDATED',
  'ROLE_DELETED',
  'PERMISSION_ASSIGNED_TO_ROLE',
  'PERMISSION_REVOKED_FROM_ROLE',

  // ========== CONTENT (Videos, Games, Surveys) ==========
  'VIDEO_CREATED',
  'VIDEO_UPDATED',
  'VIDEO_DELETED',
  'VIDEO_PUBLISHED',
  'VIDEO_UNPUBLISHED',
  'VIDEO_WATCHED',
  'VIDEO_WATCH_COMPLETED',

  'GAME_CREATED',
  'GAME_UPDATED',
  'GAME_DELETED',
  'GAME_PUBLISHED',
  'GAME_UNPUBLISHED',
  'GAME_PLAYED',
  'GAME_PLAY_COMPLETED',

  'SURVEY_CREATED',
  'SURVEY_UPDATED',
  'SURVEY_DELETED',
  'SURVEY_PUBLISHED',
  'SURVEY_UNPUBLISHED',
  'SURVEY_RESPONSE_SUBMITTED',
  'SURVEY_RESPONSE_COMPLETED',

  // ========== REPORTS ==========
  'REPORT_CREATED',
  'REPORT_RESOLVED',
  'REPORT_DISMISSED',

  // ========== REWARDS ==========
  'REWARD_CREATED',
  'REWARD_UPDATED',
  'REWARD_DELETED',
  'REWARD_CLAIMED',
  'REWARD_EXPIRED',
  'REWARD_CANCELLED',

  // ========== DAILY BONUS ==========
  'DAILY_BONUS_CREATED',
  'DAILY_BONUS_CLAIMED',
  'DAILY_BONUS_MISSED',
  'STREAK_BROKEN',

  // ========== AD WATCHES ==========
  'AD_WATCH_STARTED',
  'AD_WATCH_COMPLETED',
  'AD_WATCH_REWARD_CLAIMED',

  // ========== WALLET & TRANSACTIONS ==========
  'WALLET_CREATED',
  'WALLET_UPDATED',
  'WALLET_BALANCE_ADDED',
  'WALLET_BALANCE_DEDUCTED',
  'TRANSACTION_CREATED',
  'TRANSACTION_UPDATED',
  'TRANSACTION_COMPLETED',
  'TRANSACTION_FAILED',
  'TRANSACTION_CANCELLED',

  // ========== WITHDRAWALS ==========
  'WITHDRAWAL_REQUESTED',
  'WITHDRAWAL_APPROVED',
  'WITHDRAWAL_REJECTED',
  'WITHDRAWAL_PROCESSED',
  'WITHDRAWAL_COMPLETED',
  'WITHDRAWAL_FAILED',

  // ========== CRYPTO ==========
  'CRYPTO_CURRENCY_CREATED',
  'CRYPTO_CURRENCY_UPDATED',
  'CRYPTO_CURRENCY_DELETED',

  'CRYPTO_WALLET_CREATED',
  'CRYPTO_WALLET_UPDATED',
  'CRYPTO_WALLET_DELETED',

  'CRYPTO_DEPOSIT_CREATED',
  'CRYPTO_DEPOSIT_UPDATED',
  'CRYPTO_DEPOSIT_APPROVED',
  'CRYPTO_DEPOSIT_REJECTED',
  'CRYPTO_DEPOSIT_COMPLETED',
  'CRYPTO_DEPOSIT_FAILED',

  'CRYPTO_WITHDRAWAL_CREATED',
  'CRYPTO_WITHDRAWAL_UPDATED',
  'CRYPTO_WITHDRAWAL_APPROVED',
  'CRYPTO_WITHDRAWAL_REJECTED',
  'CRYPTO_WITHDRAWAL_COMPLETED',
  'CRYPTO_WITHDRAWAL_FAILED',
  'CRYPTO_WITHDRAWAL_PROCESSED',

  'CRYPTO_RATES_UPDATED',

  // ========== REFERRALS ==========
  'REFERRAL_CREATED',
  'REFERRAL_ACTIVATED',
  'REFERRAL_COMPLETED',
  'REFERRAL_REWARD_CLAIMED',
  'REFERRAL_CODE_CREATED',
  'REFERRAL_CODE_DEACTIVATED',
  'REFERRAL_CODE_USED',

  // ========== BADGES ==========
  'BADGE_CREATED',
  'BADGE_UPDATED',
  'BADGE_DELETED',
  'BADGE_PURCHASED',
  'BADGE_ACTIVATED',
  'BADGE_DEACTIVATED',
  'BADGE_BONUS_CLAIMED',

  // ========== SUBSCRIPTIONS ==========
  'SUBSCRIPTION_PLAN_CREATED',
  'SUBSCRIPTION_PLAN_UPDATED',
  'SUBSCRIPTION_PLAN_DELETED',
  'SUBSCRIPTION_CREATED',
  'SUBSCRIPTION_CANCELLED',
  'SUBSCRIPTION_RENEWED',
  'SUBSCRIPTION_EXPIRED',
  'SUBSCRIPTION_UPGRADED',
  'SUBSCRIPTION_DOWNGRADED',

  // ========== SETTINGS ==========
  'SETTINGS_UPDATED',
  'COMPANY_PROFILE_UPDATED',
  'NOTIFICATION_PREFERENCES_UPDATED',

  // ========== SYSTEM ==========
  'SYSTEM_CONFIG_CHANGED',
  'DATABASE_BACKUP',
  'DATABASE_RESTORE',
  'SYSTEM_MAINTENANCE',

  // ========== COMMUNICATIONS ==========
  'EMAIL_SENT',
  'EMAIL_FAILED',
  'NOTIFICATION_SENT',
  'NOTIFICATION_FAILED',

  // ========== SUDO MODE ==========
  'SUDO_MODE_ACTIVATED',
  'SUDO_MODE_DEACTIVATED',
  'SUDO_MODE_FAILED',

  // ========== AUDIT ==========
  'AUDIT_EXPORTED',
  'AUDIT_CLEARED',

  // ========== ADMIN ACTIONS ==========
  'ADMIN_ACTION',
  'ADMIN_IMPERSONATE_START',
  'ADMIN_IMPERSONATE_END',
  'ADMIN_CONTENT_MODERATION',
  'ADMIN_USER_SUSPENDED',
  'ADMIN_USER_UNSUSPENDED',

  // ========== SECURITY ==========
  'SECURITY_EVENT',
  'SUSPICIOUS_ACTIVITY_DETECTED',
  'RATE_LIMIT_EXCEEDED',
] as const;

export type AuditAction = (typeof auditActions)[number];

// ============================================
// ENTITY TYPE ENUM
// ============================================
export const auditEntityTypes = [
  // Core
  'user',
  'role',
  'permission',

  // Content
  'video',
  'game',
  'survey',
  'survey_question',
  'survey_response',
  'report', // ← ADD THIS

  // Rewards
  'reward',
  'daily_bonus',
  'ad_watch',

  // Wallet
  'wallet',
  'transaction',
  'withdrawal',

  // Crypto
  'crypto_currency',
  'crypto_wallet',
  'crypto_deposit',
  'crypto_withdrawal',
  'crypto_rate',

  // Referrals
  'referral',
  'referral_code',

  // Badges & Subscriptions
  'badge',
  'user_badge',
  'subscription_plan',
  'user_subscription',

  // System
  'setting',
  'company',
  'session',
  'otp',
  'communication',
  'email',
  'notification',
  'system',
  'audit',
  'admin',
] as const;

export type AuditEntityType = (typeof auditEntityTypes)[number];

// ============================================
// AUDIT LOGS TABLE
// ============================================
export const auditLogs = sqliteTable(
  'audit_logs',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('userId').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').$type<AuditAction>().notNull(),
    entityType: text('entityType').$type<AuditEntityType>(),
    entityId: text('entityId'),
    oldData: text('oldData'),
    newData: text('newData'),
    ipAddress: text('ipAddress'),
    userAgent: text('userAgent'),
    createdAt: text('createdAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => [
    index('audit_user_idx').on(table.userId),
    index('audit_action_idx').on(table.action),
    index('audit_entity_idx').on(table.entityType, table.entityId),
    index('audit_created_at_idx').on(table.createdAt),
    index('audit_user_action_idx').on(table.userId, table.action),
    index('audit_entity_action_idx').on(table.entityType, table.action),
  ],
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

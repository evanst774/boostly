//src/lib/db/schema/referrals.ts
import { relations, sql } from 'drizzle-orm';
import {
  integer,
  real,
  sqliteTable,
  text,
  index,
} from 'drizzle-orm/sqlite-core';
import { users } from './users';

// ============================================
// REFERRALS TABLE
// ============================================
export const referrals = sqliteTable(
  'referrals',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    // Referrer (who shared the code)
    referrerId: text('referrerId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Referee (who signed up)
    refereeId: text('refereeId')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Referral code used
    code: text('code').notNull(),

    // Status
    status: text('status').notNull().default('PENDING'), // PENDING, ACTIVE, COMPLETED

    // Rewards
    referrerReward: real('referrerReward').notNull().default(200), // Rwf
    refereeReward: real('refereeReward').notNull().default(50), // Rwf
    referrerRewardClaimed: integer('referrerRewardClaimed', { mode: 'boolean' })
      .notNull()
      .default(false),
    refereeRewardClaimed: integer('refereeRewardClaimed', { mode: 'boolean' })
      .notNull()
      .default(false),

    // Timestamps
    joinedAt: text('joinedAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    activatedAt: text('activatedAt'), // when referee becomes active
    createdAt: text('createdAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    updatedAt: text('updatedAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => [
    index('referrals_referrer_idx').on(table.referrerId),
    index('referrals_referee_idx').on(table.refereeId),
    index('referrals_code_idx').on(table.code),
    index('referrals_status_idx').on(table.status),
    index('referrals_referrer_claimed_idx').on(table.referrerRewardClaimed),
  ],
);

// ============================================
// REFERRAL CODES TABLE
// ============================================
export const referralCodes = sqliteTable(
  'referral_codes',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    userId: text('userId')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),

    code: text('code').notNull().unique(),

    // Usage
    timesUsed: integer('timesUsed').notNull().default(0),
    maxUses: integer('maxUses'),

    // Active status
    isActive: integer('isActive', { mode: 'boolean' }).notNull().default(true),

    // Timestamps
    createdAt: text('createdAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    updatedAt: text('updatedAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => [
    index('referral_codes_user_idx').on(table.userId),
    index('referral_codes_code_idx').on(table.code),
    index('referral_codes_active_idx').on(table.isActive),
  ],
);

// ============================================
// TYPES
// ============================================
export type Referral = typeof referrals.$inferSelect;
export type NewReferral = typeof referrals.$inferInsert;
export type ReferralCode = typeof referralCodes.$inferSelect;
export type NewReferralCode = typeof referralCodes.$inferInsert;

// ============================================
// RELATIONS
// ============================================
export const referralsRelations = relations(referrals, ({ one }) => ({
  referrer: one(users, {
    fields: [referrals.referrerId],
    references: [users.id],
    relationName: 'referrer',
  }),
  referee: one(users, {
    fields: [referrals.refereeId],
    references: [users.id],
    relationName: 'referee',
  }),
}));

export const referralCodesRelations = relations(referralCodes, ({ one }) => ({
  user: one(users, {
    fields: [referralCodes.userId],
    references: [users.id],
  }),
}));

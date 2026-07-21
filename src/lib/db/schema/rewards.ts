//src/lib/db/schema/rewards.ts
import { relations, sql } from 'drizzle-orm';
import {
  integer,
  real,
  sqliteTable,
  text,
  index,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import { users } from './users';

// ============================================
// ENUMS
// ============================================
export const RewardTypeEnum = {
  VIDEO: 'VIDEO',
  GAME: 'GAME',
  SURVEY: 'SURVEY',
  DAILY_BONUS: 'DAILY_BONUS',
  REFERRAL: 'REFERRAL',
  BADGE_BONUS: 'BADGE_BONUS',
  SUBSCRIPTION_BONUS: 'SUBSCRIPTION_BONUS',
  AD_WATCH: 'AD_WATCH',
} as const;

export type RewardType = (typeof RewardTypeEnum)[keyof typeof RewardTypeEnum];
export const REWARD_TYPE_LIST = Object.values(RewardTypeEnum);

export const RewardStatusEnum = {
  PENDING: 'PENDING',
  CLAIMED: 'CLAIMED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
} as const;

export type RewardStatus =
  (typeof RewardStatusEnum)[keyof typeof RewardStatusEnum];
export const REWARD_STATUS_LIST = Object.values(RewardStatusEnum);

// ============================================
// REWARDS TABLE
// ============================================
export const rewards = sqliteTable(
  'rewards',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Reward details
    type: text('type').$type<RewardType>().notNull(),

    /** Final credited value == baseAmount * multiplier, rounded. */
    amount: real('amount').notNull(),

    /** Pre-multiplier value, for auditing why a user earned what they earned. */
    baseAmount: real('baseAmount').notNull(),

    /** Combined badge + subscription boost applied at credit time. 1 = none. */
    multiplier: real('multiplier').notNull().default(1),

    description: text('description'),

    // Source reference (videoId, gameId, surveyId, etc.)
    sourceId: text('sourceId'),
    sourceType: text('sourceType'),

    /**
     * Idempotency key. The unique index on (userId, dedupeKey) is what actually
     * prevents double payouts — never rely on application-level checks alone.
     *
     * Format: `${type}:${sourceId}:${scope}` where scope is:
     *   - 'once'        for one-time content
     *   - 'YYYY-MM-DD'  for daily-repeatable content
     *   - a session id  for game sessions (one payout per session)
     */
    dedupeKey: text('dedupeKey').notNull(),

    // Status
    status: text('status').$type<RewardStatus>().notNull().default('PENDING'),

    // Claim details
    claimedAt: text('claimedAt'),

    // Metadata (JSON for extra data)
    metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),

    // Timestamps
    createdAt: text('createdAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    updatedAt: text('updatedAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => [
    index('rewards_user_idx').on(table.userId),
    index('rewards_type_idx').on(table.type),
    index('rewards_status_idx').on(table.status),
    index('rewards_created_at_idx').on(table.createdAt),
    index('rewards_source_idx').on(table.sourceId, table.sourceType),
    index('rewards_user_type_idx').on(table.userId, table.type),

    // The payout guard. Do not remove.
    uniqueIndex('rewards_user_dedupe_idx').on(table.userId, table.dedupeKey),
  ],
);

// ============================================
// DAILY BONUSES TABLE (streak tracking)
// ============================================
export const dailyBonuses = sqliteTable(
  'daily_bonuses',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Streak
    streakDay: integer('streakDay').notNull().default(1),
    bonusAmount: real('bonusAmount').notNull(),

    // Claim status
    claimed: integer('claimed', { mode: 'boolean' }).notNull().default(false),
    claimedAt: text('claimedAt'),

    // Date
    date: text('date').notNull(), // YYYY-MM-DD

    // Timestamps
    createdAt: text('createdAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    updatedAt: text('updatedAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => [
    index('daily_bonuses_user_idx').on(table.userId),
    index('daily_bonuses_date_idx').on(table.date),
    index('daily_bonuses_claimed_idx').on(table.claimed),
    // Was a plain index despite the "unique per user per day" comment.
    uniqueIndex('daily_bonuses_user_date_idx').on(table.userId, table.date),
  ],
);

// ============================================
// AD WATCHES TABLE
// ============================================
export const adWatches = sqliteTable(
  'ad_watches',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Ad details
    advertiser: text('advertiser').notNull(),
    rewardAmount: real('rewardAmount').notNull(),

    // Completion
    completed: integer('completed', { mode: 'boolean' })
      .notNull()
      .default(false),
    watchDuration: integer('watchDuration'), // seconds
    rewardClaimed: integer('rewardClaimed', { mode: 'boolean' })
      .notNull()
      .default(false),

    // Timestamps
    startedAt: text('startedAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    completedAt: text('completedAt'),
    createdAt: text('createdAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    updatedAt: text('updatedAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => [
    index('ad_watches_user_idx').on(table.userId),
    index('ad_watches_completed_idx').on(table.completed),
    index('ad_watches_reward_claimed_idx').on(table.rewardClaimed),
    index('ad_watches_created_at_idx').on(table.createdAt),
  ],
);

// ============================================
// TYPES
// ============================================
export type Reward = typeof rewards.$inferSelect;
export type NewReward = typeof rewards.$inferInsert;
export type DailyBonus = typeof dailyBonuses.$inferSelect;
export type NewDailyBonus = typeof dailyBonuses.$inferInsert;
export type AdWatch = typeof adWatches.$inferSelect;
export type NewAdWatch = typeof adWatches.$inferInsert;

// ============================================
// RELATIONS
// ============================================
export const rewardsRelations = relations(rewards, ({ one }) => ({
  user: one(users, {
    fields: [rewards.userId],
    references: [users.id],
  }),
}));

export const dailyBonusesRelations = relations(dailyBonuses, ({ one }) => ({
  user: one(users, {
    fields: [dailyBonuses.userId],
    references: [users.id],
  }),
}));

export const adWatchesRelations = relations(adWatches, ({ one }) => ({
  user: one(users, {
    fields: [adWatches.userId],
    references: [users.id],
  }),
}));

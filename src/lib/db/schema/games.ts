// src/lib/db/schema/games.ts
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
// ENUMS
// ============================================
export const GameCategoryEnum = {
  PUZZLE: 'PUZZLE',
  ACTION: 'ACTION',
  CASUAL: 'CASUAL',
  STRATEGY: 'STRATEGY',
  QUIZ: 'QUIZ',
  RACING: 'RACING',
  SPORTS: 'SPORTS',
  ADVENTURE: 'ADVENTURE',
} as const;

export type GameCategory =
  (typeof GameCategoryEnum)[keyof typeof GameCategoryEnum];
export const GAME_CATEGORY_LIST = Object.values(GameCategoryEnum);

export const GameStatusEnum = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  DRAFT: 'DRAFT',
} as const;

export type GameStatus = (typeof GameStatusEnum)[keyof typeof GameStatusEnum];
export const GAME_STATUS_LIST = Object.values(GameStatusEnum);

/**
 * Where the playable game actually lives.
 *
 * SELF_HOSTED — your R2 bucket behind your CDN domain. Same-origin-ish, no
 *   third party, no revenue share, no terms to violate. Start here.
 * GAMEPIX / GAMEMONETIZE — external catalogues served by iframe. They pay ad
 *   revenue share, but check their terms first: several networks prohibit
 *   incentivised play, which is exactly Boostly's model.
 */
export const GameProviderEnum = {
  SELF_HOSTED: 'SELF_HOSTED',
  GAMEPIX: 'GAMEPIX',
  GAMEMONETIZE: 'GAMEMONETIZE',
} as const;

export type GameProvider =
  (typeof GameProviderEnum)[keyof typeof GameProviderEnum];
export const GAME_PROVIDER_LIST = Object.values(GameProviderEnum);

export const GameOrientationEnum = {
  PORTRAIT: 'PORTRAIT',
  LANDSCAPE: 'LANDSCAPE',
  BOTH: 'BOTH',
} as const;

export type GameOrientation =
  (typeof GameOrientationEnum)[keyof typeof GameOrientationEnum];

/**
 * Lifecycle of a single play session.
 *
 * ACTIVE     — session open, heartbeats accruing verified time
 * COMPLETED  — user finished; reward resolved (may still be 0 if too short)
 * ABANDONED  — swept by cron after going stale with no heartbeat
 * FLAGGED    — heartbeat cadence looked scripted; never pays out
 */
export const GamePlayStatusEnum = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  ABANDONED: 'ABANDONED',
  FLAGGED: 'FLAGGED',
} as const;

export type GamePlayStatus =
  (typeof GamePlayStatusEnum)[keyof typeof GamePlayStatusEnum];

// ============================================
// GAMES TABLE
// ============================================
export const games = sqliteTable(
  'games',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    // Game metadata
    name: text('name').notNull(),
    description: text('description'),
    category: text('category').$type<GameCategory>().notNull(),

    // Game assets
    icon: text('icon'), // emoji or icon URL
    thumbnailUrl: text('thumbnailUrl'),
    thumbnailKey: text('thumbnailKey'),

    /**
     * The playable URL loaded into the iframe. Required for ACTIVE games —
     * enforced in the service layer, since existing rows may be null.
     * `embedOrigin` is derived from this at runtime via `new URL(gameUrl).origin`,
     * so there is no separate column to keep in sync.
     */
    gameUrl: text('gameUrl'),

    provider: text('provider')
      .$type<GameProvider>()
      .notNull()
      .default('SELF_HOSTED'),

    orientation: text('orientation')
      .$type<GameOrientation>()
      .notNull()
      .default('BOTH'),

    // Reward
    /** Payout for one qualifying session (reaching minPlayDuration). */
    baseReward: real('baseReward').notNull().default(50), // RWF
    /** Hard ceiling for a single session, however long it runs. */
    maxReward: real('maxReward').notNull().default(150),

    // Sponsored content
    isSponsored: integer('isSponsored', { mode: 'boolean' })
      .notNull()
      .default(false),
    sponsorName: text('sponsorName'),
    sponsorLogo: text('sponsorLogo'),
    sponsorWebsite: text('sponsorWebsite'),
    sponsoredUntil: text('sponsoredUntil'),

    // Game settings
    maxPlaysPerDay: integer('maxPlaysPerDay').notNull().default(10),
    /** Verified seconds required before a session pays anything. */
    minPlayDuration: integer('minPlayDuration').notNull().default(30),
    /** Per-user, per-day ceiling on rewardable seconds for THIS game. */
    maxRewardedSecondsPerDay: integer('maxRewardedSecondsPerDay')
      .notNull()
      .default(600),
    difficulty: integer('difficulty').notNull().default(1), // 1-5

    // Status
    status: text('status').$type<GameStatus>().notNull().default('ACTIVE'),

    // Statistics
    totalPlays: integer('totalPlays').notNull().default(0),
    totalPlayers: integer('totalPlayers').notNull().default(0),

    // Engagement metrics
    likes: integer('likes').notNull().default(0),
    shares: integer('shares').notNull().default(0),

    // Admin who added/updated
    createdBy: text('createdBy').references(() => users.id, {
      onDelete: 'set null',
    }),
    updatedBy: text('updatedBy').references(() => users.id, {
      onDelete: 'set null',
    }),

    // Timestamps
    createdAt: text('createdAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    updatedAt: text('updatedAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => [
    index('games_category_idx').on(table.category),
    index('games_status_idx').on(table.status),
    index('games_created_at_idx').on(table.createdAt),
    index('games_reward_idx').on(table.baseReward),
    index('games_sponsored_idx').on(table.isSponsored),
    index('games_provider_idx').on(table.provider),
  ],
);

// ============================================
// GAME PLAYS TABLE — this is the play SESSION table
// ============================================
export const gamePlays = sqliteTable(
  'game_plays',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    gameId: text('gameId')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    status: text('status').$type<GamePlayStatus>().notNull().default('ACTIVE'),

    // ---- Client-reported. Display and analytics ONLY. Never pays. ----
    score: integer('score').notNull().default(0),
    duration: integer('duration'), // wall-clock seconds claimed by the client

    // ---- Server-verified. This is what money is computed from. ----
    /**
     * Seconds the SERVER is willing to vouch for. Only ever incremented by the
     * heartbeat endpoint, and only by the elapsed time it measures itself.
     */
    verifiedSeconds: integer('verifiedSeconds').notNull().default(0),
    heartbeatCount: integer('heartbeatCount').notNull().default(0),
    lastHeartbeatAt: text('lastHeartbeatAt'),

    /** Set server-side: verifiedSeconds >= game.minPlayDuration. */
    achievedGoal: integer('achievedGoal', { mode: 'boolean' })
      .notNull()
      .default(false),

    // Reward
    rewardEarned: real('rewardEarned'),
    rewardClaimed: integer('rewardClaimed', { mode: 'boolean' })
      .notNull()
      .default(false),

    /** YYYY-MM-DD. Drives the per-day play count and rewardable-seconds caps. */
    periodDate: text('periodDate').notNull(),

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
    index('game_plays_game_idx').on(table.gameId),
    index('game_plays_user_idx').on(table.userId),
    index('game_plays_reward_claimed_idx').on(table.rewardClaimed),
    index('game_plays_achieved_idx').on(table.achievedGoal),
    index('game_plays_user_game_idx').on(table.userId, table.gameId),
    index('game_plays_created_at_idx').on(table.createdAt),
    index('game_plays_status_idx').on(table.status),
    // Daily caps hit this constantly — keep it composite.
    index('game_plays_user_period_idx').on(table.userId, table.periodDate),
    index('game_plays_user_game_period_idx').on(
      table.userId,
      table.gameId,
      table.periodDate,
    ),
  ],
);

// ============================================
// TYPES
// ============================================
export type Game = typeof games.$inferSelect;
export type NewGame = typeof games.$inferInsert;
export type GamePlay = typeof gamePlays.$inferSelect;
export type NewGamePlay = typeof gamePlays.$inferInsert;

// ============================================
// RELATIONS
// ============================================
export const gamesRelations = relations(games, ({ many }) => ({
  plays: many(gamePlays),
}));

export const gamePlaysRelations = relations(gamePlays, ({ one }) => ({
  game: one(games, {
    fields: [gamePlays.gameId],
    references: [games.id],
  }),
  user: one(users, {
    fields: [gamePlays.userId],
    references: [users.id],
  }),
}));

// ============================================
// HELPERS
// ============================================

/** YYYY-MM-DD in UTC. Used for every daily cap in the games module. */
export function currentPeriodDate(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/**
 * Origin of a game's embed URL, for validating postMessage events.
 * Returns null when the URL is missing or malformed — callers must treat that
 * as "do not trust any message from this frame".
 */
export function getGameEmbedOrigin(gameUrl: string | null): string | null {
  if (!gameUrl) return null;
  try {
    return new URL(gameUrl).origin;
  } catch {
    return null;
  }
}

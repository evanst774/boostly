// src/modules/content/repositories/games/plays.repository.ts
import { and, desc, eq, lt, sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import {
  gamePlays,
  GamePlayStatusEnum,
  currentPeriodDate,
  type GamePlay,
  type NewGamePlay,
} from '@/lib/db/schema';

export class GamePlaysRepository {
  // ============================================
  // SESSION LIFECYCLE
  // ============================================

  async create(data: NewGamePlay): Promise<GamePlay> {
    const [play] = await db
      .insert(gamePlays)
      .values({
        id: crypto.randomUUID(),
        ...data,
      })
      .returning();
    return play;
  }

  async getById(id: string): Promise<GamePlay | undefined> {
    return await db.query.gamePlays.findFirst({
      where: eq(gamePlays.id, id),
      with: { game: true },
    });
  }

  /**
   * Fetches a session and asserts ownership in the same query. Every session
   * endpoint must use this rather than getById, or one user can drive another
   * user's session.
   */
  async getOwnedSession(
    sessionId: string,
    userId: string,
  ): Promise<GamePlay | undefined> {
    return await db.query.gamePlays.findFirst({
      where: and(eq(gamePlays.id, sessionId), eq(gamePlays.userId, userId)),
    });
  }

  /**
   * Credits verified time to a session. `secondsToAdd` is computed by the
   * server from wall-clock elapsed — never taken from the request body.
   */
  async addVerifiedSeconds(
    sessionId: string,
    secondsToAdd: number,
    heartbeatAt: string,
  ): Promise<GamePlay | undefined> {
    const [updated] = await db
      .update(gamePlays)
      .set({
        verifiedSeconds: sql`${gamePlays.verifiedSeconds} + ${secondsToAdd}`,
        heartbeatCount: sql`${gamePlays.heartbeatCount} + 1`,
        lastHeartbeatAt: heartbeatAt,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(gamePlays.id, sessionId))
      .returning();
    return updated;
  }

  async flagSession(sessionId: string): Promise<void> {
    await db
      .update(gamePlays)
      .set({
        status: GamePlayStatusEnum.FLAGGED,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(gamePlays.id, sessionId));
  }

  async update(
    id: string,
    data: Partial<NewGamePlay>,
  ): Promise<GamePlay | undefined> {
    const [updated] = await db
      .update(gamePlays)
      .set({ ...data, updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))` })
      .where(eq(gamePlays.id, id))
      .returning();
    return updated;
  }

  /**
   * Sweeps sessions that stopped sending heartbeats. Run from the same cron
   * that handles installment reminders. Without this, abandoned ACTIVE rows
   * accumulate forever and skew the "sessions in progress" numbers.
   */
  async abandonStaleSessions(staleBeforeISO: string): Promise<number> {
    const rows = await db
      .update(gamePlays)
      .set({
        status: GamePlayStatusEnum.ABANDONED,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(
        and(
          eq(gamePlays.status, GamePlayStatusEnum.ACTIVE),
          lt(gamePlays.startedAt, staleBeforeISO),
        ),
      )
      .returning({ id: gamePlays.id });
    return rows.length;
  }

  // ============================================
  // DAILY CAPS
  // ============================================

  /** Sessions the user actually finished today for this game. */
  async getCompletedPlayCountToday(
    userId: string,
    gameId: string,
    periodDate: string = currentPeriodDate(),
  ): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(gamePlays)
      .where(
        and(
          eq(gamePlays.userId, userId),
          eq(gamePlays.gameId, gameId),
          eq(gamePlays.periodDate, periodDate),
          eq(gamePlays.status, GamePlayStatusEnum.COMPLETED),
        ),
      );
    return Number(result[0]?.count ?? 0);
  }

  /**
   * Verified seconds already REWARDED today for this game. Used to compute how
   * much of a new session is still eligible, so a user can't farm the same game
   * indefinitely by opening fresh sessions.
   */
  async getRewardedSecondsToday(
    userId: string,
    gameId: string,
    periodDate: string = currentPeriodDate(),
  ): Promise<number> {
    const result = await db
      .select({ sum: sql<number>`sum(${gamePlays.verifiedSeconds})` })
      .from(gamePlays)
      .where(
        and(
          eq(gamePlays.userId, userId),
          eq(gamePlays.gameId, gameId),
          eq(gamePlays.periodDate, periodDate),
          eq(gamePlays.rewardClaimed, true),
        ),
      );
    return Number(result[0]?.sum ?? 0);
  }

  /** Any session still open for this user+game, so we reuse instead of stacking. */
  async getActiveSession(
    userId: string,
    gameId: string,
  ): Promise<GamePlay | undefined> {
    return await db.query.gamePlays.findFirst({
      where: and(
        eq(gamePlays.userId, userId),
        eq(gamePlays.gameId, gameId),
        eq(gamePlays.status, GamePlayStatusEnum.ACTIVE),
      ),
      orderBy: [desc(gamePlays.startedAt)],
    });
  }

  async getDailyEarnings(
    userId: string,
    date: string = currentPeriodDate(),
  ): Promise<number> {
    const result = await db
      .select({ sum: sql<number>`sum(${gamePlays.rewardEarned})` })
      .from(gamePlays)
      .where(
        and(
          eq(gamePlays.userId, userId),
          eq(gamePlays.rewardClaimed, true),
          eq(gamePlays.periodDate, date),
        ),
      );
    return Number(result[0]?.sum ?? 0);
  }

  // ============================================
  // HISTORY & LEADERBOARDS
  // ============================================

  async getByUserAndGame(
    userId: string,
    gameId: string,
  ): Promise<GamePlay | undefined> {
    return await db.query.gamePlays.findFirst({
      where: and(eq(gamePlays.userId, userId), eq(gamePlays.gameId, gameId)),
      orderBy: [desc(gamePlays.createdAt)],
    });
  }

  async getUserPlays(userId: string, limit?: number): Promise<GamePlay[]> {
    return await db.query.gamePlays.findMany({
      where: and(
        eq(gamePlays.userId, userId),
        eq(gamePlays.status, GamePlayStatusEnum.COMPLETED),
      ),
      with: { game: true },
      limit: limit,
      orderBy: [desc(gamePlays.createdAt)],
    });
  }

  async getByGameId(gameId: string, limit?: number): Promise<GamePlay[]> {
    return await db.query.gamePlays.findMany({
      where: and(
        eq(gamePlays.gameId, gameId),
        eq(gamePlays.status, GamePlayStatusEnum.COMPLETED),
      ),
      with: { user: true },
      limit: limit,
      orderBy: [desc(gamePlays.createdAt)],
    });
  }

  async getTotalPlays(gameId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(gamePlays)
      .where(
        and(
          eq(gamePlays.gameId, gameId),
          eq(gamePlays.status, GamePlayStatusEnum.COMPLETED),
        ),
      );
    return Number(result[0]?.count ?? 0);
  }

  async getPlayCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(gamePlays)
      .where(
        and(
          eq(gamePlays.userId, userId),
          eq(gamePlays.status, GamePlayStatusEnum.COMPLETED),
        ),
      );
    return Number(result[0]?.count ?? 0);
  }

  async getAverageScore(gameId: string): Promise<number> {
    const result = await db
      .select({ avg: sql<number>`avg(${gamePlays.score})` })
      .from(gamePlays)
      .where(
        and(
          eq(gamePlays.gameId, gameId),
          eq(gamePlays.status, GamePlayStatusEnum.COMPLETED),
        ),
      );
    return Number(result[0]?.avg ?? 0);
  }

  /**
   * Leaderboard. Scores here are client-reported and unverified — fine for
   * bragging rights, never used to compute a payout.
   */
  async getTopScores(gameId: string, limit: number = 10): Promise<GamePlay[]> {
    return await db.query.gamePlays.findMany({
      where: and(
        eq(gamePlays.gameId, gameId),
        eq(gamePlays.status, GamePlayStatusEnum.COMPLETED),
      ),
      with: { user: true },
      orderBy: [desc(gamePlays.score)],
      limit: limit,
    });
  }
}

export const gamePlaysRepository = new GamePlaysRepository();

// src/modules/content/services/games/games.service.ts
import { gamesRepository, gamePlaysRepository } from '../../repositories/games';
import {
  createGameSchema,
  updateGameSchema,
  type CreateGameInput,
  type UpdateGameInput,
} from '../../validation';
import { createAuditLog } from '@/lib/audit';
import { getCurrentUser } from '@/lib/auth/session.server';
import { requirePermission } from '@/lib/auth/permissions';
import { ContentPermissions } from '../../permissions';
import {
  GamePlayStatusEnum,
  GameStatusEnum,
  currentPeriodDate,
  getGameEmbedOrigin,
  type Game,
  type GameCategory,
  type GameStatus,
} from '@/lib/db/schema';
import { rewardsService } from '@/modules/rewards/service';
import { RewardTypeEnum } from '@/lib/db/schema/rewards';
import { getUserDailyLimits } from '@/modules/rewards/plan-limits';

// ============================================
// CONSTANTS
// ============================================

/** How often the client is told to beat. Must match the client's timer. */
export const HEARTBEAT_INTERVAL_SECONDS = 15;

/**
 * Slack for network jitter and background-tab throttling. A beat arriving
 * later than interval+tolerance credits only interval+tolerance, so a client
 * that sleeps and then floods gains nothing.
 */
export const HEARTBEAT_TOLERANCE_SECONDS = 5;

/** Beats arriving faster than this are scripted, not played. */
const MIN_HEARTBEAT_GAP_SECONDS =
  HEARTBEAT_INTERVAL_SECONDS - HEARTBEAT_TOLERANCE_SECONDS;

/** Sessions with no beat for this long are dead. */
const SESSION_STALE_AFTER_SECONDS = 120;

// ============================================
// TYPES
// ============================================

export interface StartSessionResult {
  sessionId: string;
  embedUrl: string;
  embedOrigin: string;
  heartbeatIntervalSeconds: number;
  minPlaySeconds: number;
  remainingDailySeconds: number;
  maxSessionReward: number;
}

export interface HeartbeatResult {
  ok: boolean;
  verifiedSeconds: number;
  qualified: boolean;
  projectedReward: number;
  remainingDailySeconds: number;
  reason?: 'FLAGGED' | 'SESSION_CLOSED' | 'CAP_REACHED';
}

export type CompleteSessionResult =
  | {
      status: 'REWARDED';
      rewardEarned: number;
      verifiedSeconds: number;
      newBalance: number;
    }
  | {
      status: 'NO_REWARD';
      rewardEarned: 0;
      verifiedSeconds: number;
      reason: 'TOO_SHORT' | 'FLAGGED' | 'CAP_REACHED' | 'ALREADY_CLAIMED';
      minPlaySeconds: number;
    };

// ============================================
// SERVICE
// ============================================

export class GamesService {
  // ============================================
  // ADMIN CRUD
  // ============================================

  async createGame(input: CreateGameInput): Promise<Game> {
    await requirePermission(ContentPermissions.GAMES_CREATE);
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const validated = createGameSchema.parse(input);
    const game = await gamesRepository.create({
      ...validated,
      createdBy: user.id,
      updatedBy: user.id,
      status: GameStatusEnum.DRAFT,
    });

    await createAuditLog({
      userId: user.id,
      action: 'GAME_CREATED',
      entityType: 'game',
      entityId: game.id,
      newData: game,
    });

    return game;
  }

  async getGame(id: string): Promise<Game> {
    await requirePermission(ContentPermissions.GAMES_READ);
    const game = await gamesRepository.getById(id);
    if (!game) throw new Error('Game not found');
    return game;
  }

  async updateGame(id: string, input: UpdateGameInput): Promise<Game> {
    await requirePermission(ContentPermissions.GAMES_UPDATE);
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const existing = await gamesRepository.getById(id);
    if (!existing) throw new Error('Game not found');

    const validated = updateGameSchema.parse(input);
    const updated = await gamesRepository.update(id, {
      ...validated,
      updatedBy: user.id,
    });
    if (!updated) throw new Error('Game not found');

    await createAuditLog({
      userId: user.id,
      action: 'GAME_UPDATED',
      entityType: 'game',
      entityId: id,
      oldData: existing,
      newData: updated,
    });

    return updated;
  }

  async publishGame(id: string): Promise<Game> {
    await requirePermission(ContentPermissions.GAMES_PUBLISH);
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const existing = await gamesRepository.getById(id);
    if (!existing) throw new Error('Game not found');

    // A game with no playable URL would render an empty iframe that still
    // accrues rewardable time. Refuse to publish it.
    if (!getGameEmbedOrigin(existing.gameUrl)) {
      throw new Error(
        'Cannot publish: gameUrl is missing or is not a valid absolute URL',
      );
    }

    const updated = await gamesRepository.update(id, {
      status: GameStatusEnum.ACTIVE,
      updatedBy: user.id,
    });
    if (!updated) throw new Error('Game not found');

    await createAuditLog({
      userId: user.id,
      action: 'GAME_PUBLISHED',
      entityType: 'game',
      entityId: id,
      oldData: existing,
      newData: updated,
    });

    return updated;
  }

  async deleteGame(id: string): Promise<void> {
    await requirePermission(ContentPermissions.GAMES_DELETE);
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const existing = await gamesRepository.getById(id);
    if (!existing) throw new Error('Game not found');

    await gamesRepository.delete(id);

    await createAuditLog({
      userId: user.id,
      action: 'GAME_DELETED',
      entityType: 'game',
      entityId: id,
      oldData: existing,
    });
  }

  // ============================================
  // READS
  // ============================================

  /**
   * Public catalogue. No permission check, and ACTIVE is forced rather than
   * accepted from the caller — otherwise the earn page happily lists DRAFT rows.
   */
  async getPublicGames(filters: {
    category?: GameCategory;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ games: Game[]; total: number }> {
    return await gamesRepository.getGames({
      ...filters,
      status: GameStatusEnum.ACTIVE,
    });
  }

  /** Admin listing. Status is filterable here because admins should see drafts. */
  async getGames(filters: {
    category?: GameCategory;
    status?: GameStatus;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ games: Game[]; total: number }> {
    await requirePermission(ContentPermissions.GAMES_READ);
    return await gamesRepository.getGames(filters);
  }

  async getActiveGames(): Promise<Game[]> {
    return await gamesRepository.getActiveGames();
  }

  async getGameStats() {
    await requirePermission(ContentPermissions.GAMES_READ);
    return await gamesRepository.getStats();
  }

  async getGameTopScores(gameId: string, limit?: number) {
    return await gamePlaysRepository.getTopScores(gameId, limit);
  }

  async getUserGameStats(gameId: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const plays = await gamePlaysRepository.getUserPlays(user.id);
    const forThisGame = plays.filter((p) => p.gameId === gameId);

    const [totalPlays, averageScore] = await Promise.all([
      gamePlaysRepository.getTotalPlays(gameId),
      gamePlaysRepository.getAverageScore(gameId),
    ]);

    return {
      userPlays: forThisGame,
      totalPlays,
      averageScore,
      userBestScore: forThisGame.length
        ? Math.max(...forThisGame.map((p) => p.score))
        : 0,
      userTotalScore: forThisGame.reduce((sum, p) => sum + p.score, 0),
    };
  }

  // ============================================
  // PLAY SESSIONS
  // ============================================

  /**
   * Opens a play session and hands back the embed URL.
   *
   * The client never learns anything it could forge into a payout — the reward
   * is computed entirely from time this server measures.
   */
  async startSession(gameId: string): Promise<StartSessionResult> {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const game = await gamesRepository.getById(gameId);
    if (!game) throw new Error('Game not found');
    if (game.status !== GameStatusEnum.ACTIVE) {
      throw new Error('Game not available');
    }

    const embedOrigin = getGameEmbedOrigin(game.gameUrl);
    if (!game.gameUrl || !embedOrigin) {
      throw new Error('Game has no playable URL');
    }

    const periodDate = currentPeriodDate();

    const [playsToday, rewardedSeconds] = await Promise.all([
      gamePlaysRepository.getCompletedPlayCountToday(
        user.id,
        gameId,
        periodDate,
      ),
      gamePlaysRepository.getRewardedSecondsToday(user.id, gameId, periodDate),
    ]);

    if (playsToday >= game.maxPlaysPerDay) {
      throw new Error(
        `Daily play limit reached for this game (${game.maxPlaysPerDay})`,
      );
    }

    // Cross-game per-plan cap on how many DIFFERENT games can earn a reward
    // per day, on top of this game's own per-game maxPlaysPerDay above.
    const limits = await getUserDailyLimits(user.id);
    const todayGameRewards = await rewardsService.getTodayRewardCount(
      user.id,
      RewardTypeEnum.GAME,
    );
    if (todayGameRewards >= limits.maxDailyGames) {
      throw new Error(
        `You've reached your plan's daily game limit (${limits.maxDailyGames}). Upgrade your plan to earn from more games per day.`,
      );
    }

    const remainingDailySeconds = Math.max(
      0,
      game.maxRewardedSecondsPerDay - rewardedSeconds,
    );

    // Reuse an already-open session rather than stacking ACTIVE rows when the
    // user backs out and taps play again.
    const existing = await gamePlaysRepository.getActiveSession(
      user.id,
      gameId,
    );
    const session =
      existing ??
      (await gamePlaysRepository.create({
        gameId,
        userId: user.id,
        status: GamePlayStatusEnum.ACTIVE,
        periodDate,
      }));

    return {
      sessionId: session.id,
      embedUrl: game.gameUrl,
      embedOrigin,
      heartbeatIntervalSeconds: HEARTBEAT_INTERVAL_SECONDS,
      minPlaySeconds: game.minPlayDuration,
      remainingDailySeconds,
      maxSessionReward: game.maxReward,
    };
  }

  /**
   * Credits verified play time.
   *
   * The entire trust model lives in these few lines: elapsed time is measured
   * server-side from the previous beat, and the amount credited is clamped to
   * one interval regardless of what the clock says. Batching, replaying, or
   * spoofing beats therefore cannot inflate the total.
   */
  async heartbeat(sessionId: string): Promise<HeartbeatResult> {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const session = await gamePlaysRepository.getOwnedSession(
      sessionId,
      user.id,
    );
    if (!session) throw new Error('Session not found');

    const game = await gamesRepository.getById(session.gameId);
    if (!game) throw new Error('Game not found');

    if (session.status === GamePlayStatusEnum.FLAGGED) {
      return this.deadHeartbeat(session.verifiedSeconds, 'FLAGGED');
    }
    if (session.status !== GamePlayStatusEnum.ACTIVE) {
      return this.deadHeartbeat(session.verifiedSeconds, 'SESSION_CLOSED');
    }

    const now = new Date();
    const previous = new Date(session.lastHeartbeatAt ?? session.startedAt);
    const elapsedSeconds = Math.floor(
      (now.getTime() - previous.getTime()) / 1000,
    );

    // Too fast to be real play. Flag rather than silently drop, so abuse is
    // visible in the data instead of invisible.
    if (
      session.heartbeatCount > 0 &&
      elapsedSeconds < MIN_HEARTBEAT_GAP_SECONDS
    ) {
      await gamePlaysRepository.flagSession(sessionId);
      return this.deadHeartbeat(session.verifiedSeconds, 'FLAGGED');
    }

    const creditedSeconds = Math.min(
      Math.max(elapsedSeconds, 0),
      HEARTBEAT_INTERVAL_SECONDS + HEARTBEAT_TOLERANCE_SECONDS,
    );

    const updated = await gamePlaysRepository.addVerifiedSeconds(
      sessionId,
      creditedSeconds,
      now.toISOString(),
    );
    const verifiedSeconds = updated?.verifiedSeconds ?? session.verifiedSeconds;

    const rewardedToday = await gamePlaysRepository.getRewardedSecondsToday(
      user.id,
      session.gameId,
      session.periodDate,
    );
    const remainingDailySeconds = Math.max(
      0,
      game.maxRewardedSecondsPerDay - rewardedToday,
    );

    const eligibleSeconds = Math.min(verifiedSeconds, remainingDailySeconds);
    const qualified = eligibleSeconds >= game.minPlayDuration;

    return {
      ok: true,
      verifiedSeconds,
      qualified,
      projectedReward: this.computeReward(game, eligibleSeconds),
      remainingDailySeconds,
    };
  }

  /**
   * Closes a session and pays out.
   *
   * `score` is accepted purely so the leaderboard has something to show. It has
   * no influence on the amount — that is derived from verified time and the
   * reward figures configured on the game.
   */
  async completeSession(
    sessionId: string,
    clientReport: { score?: number; duration?: number } = {},
  ): Promise<CompleteSessionResult> {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const session = await gamePlaysRepository.getOwnedSession(
      sessionId,
      user.id,
    );
    if (!session) throw new Error('Session not found');

    const game = await gamesRepository.getById(session.gameId);
    if (!game) throw new Error('Game not found');

    const score = Math.max(0, Math.floor(clientReport.score ?? 0));
    const duration = Math.max(0, Math.floor(clientReport.duration ?? 0));

    if (session.rewardClaimed) {
      return {
        status: 'NO_REWARD',
        rewardEarned: 0,
        verifiedSeconds: session.verifiedSeconds,
        reason: 'ALREADY_CLAIMED',
        minPlaySeconds: game.minPlayDuration,
      };
    }

    if (session.status === GamePlayStatusEnum.FLAGGED) {
      await gamePlaysRepository.update(sessionId, {
        score,
        duration,
        completedAt: new Date().toISOString(),
      });
      return {
        status: 'NO_REWARD',
        rewardEarned: 0,
        verifiedSeconds: session.verifiedSeconds,
        reason: 'FLAGGED',
        minPlaySeconds: game.minPlayDuration,
      };
    }

    const rewardedToday = await gamePlaysRepository.getRewardedSecondsToday(
      user.id,
      session.gameId,
      session.periodDate,
    );
    const remainingDailySeconds = Math.max(
      0,
      game.maxRewardedSecondsPerDay - rewardedToday,
    );
    const eligibleSeconds = Math.min(
      session.verifiedSeconds,
      remainingDailySeconds,
    );

    const closeSession = async (achievedGoal: boolean, rewardEarned: number) =>
      gamePlaysRepository.update(sessionId, {
        status: GamePlayStatusEnum.COMPLETED,
        score,
        duration,
        achievedGoal,
        rewardEarned,
        completedAt: new Date().toISOString(),
      });

    if (remainingDailySeconds <= 0) {
      await closeSession(false, 0);
      return {
        status: 'NO_REWARD',
        rewardEarned: 0,
        verifiedSeconds: session.verifiedSeconds,
        reason: 'CAP_REACHED',
        minPlaySeconds: game.minPlayDuration,
      };
    }

    if (eligibleSeconds < game.minPlayDuration) {
      await closeSession(false, 0);
      return {
        status: 'NO_REWARD',
        rewardEarned: 0,
        verifiedSeconds: session.verifiedSeconds,
        reason: 'TOO_SHORT',
        minPlaySeconds: game.minPlayDuration,
      };
    }

    const baseAmount = this.computeReward(game, eligibleSeconds);

    // scope = session id, so a double-tapped Claim pays exactly once.
    const credit = await rewardsService.createReward({
      userId: user.id,
      type: RewardTypeEnum.GAME,
      baseAmount,
      description: `Game reward: ${game.name}`,
      sourceId: game.id,
      sourceType: 'game',
      scope: session.id,
      metadata: {
        sessionId: session.id,
        verifiedSeconds: session.verifiedSeconds,
        eligibleSeconds,
        heartbeatCount: session.heartbeatCount,
        score,
      },
    });

    if (!credit.credited) {
      await closeSession(true, 0);
      return {
        status: 'NO_REWARD',
        rewardEarned: 0,
        verifiedSeconds: session.verifiedSeconds,
        reason: 'ALREADY_CLAIMED',
        minPlaySeconds: game.minPlayDuration,
      };
    }

    await gamePlaysRepository.update(sessionId, {
      status: GamePlayStatusEnum.COMPLETED,
      score,
      duration,
      achievedGoal: true,
      rewardEarned: credit.amount,
      rewardClaimed: true,
      completedAt: new Date().toISOString(),
    });

    await gamesRepository.incrementPlays(game.id);

    return {
      status: 'REWARDED',
      rewardEarned: credit.amount,
      verifiedSeconds: session.verifiedSeconds,
      newBalance: credit.newBalance,
    };
  }

  /** Cron entry point. Sweep sessions the client never closed. */
  async abandonStaleSessions(): Promise<number> {
    const cutoff = new Date(
      Date.now() - SESSION_STALE_AFTER_SECONDS * 1000,
    ).toISOString();
    return await gamePlaysRepository.abandonStaleSessions(cutoff);
  }

  // ============================================
  // REWARD MATH
  // ============================================

  /**
   * Reward for a session, from verified seconds alone.
   *
   * `baseReward` is what one qualifying session (exactly minPlayDuration) pays.
   * Playing longer scales the payout linearly, up to `maxReward`. So a game
   * configured at baseReward 50 / minPlayDuration 60 pays 50 RWF for a minute,
   * 100 for two, and stops at maxReward however long the user keeps going.
   */
  private computeReward(
    game: Pick<Game, 'baseReward' | 'maxReward' | 'minPlayDuration'>,
    eligibleSeconds: number,
  ): number {
    if (game.minPlayDuration <= 0) return 0;
    if (eligibleSeconds < game.minPlayDuration) return 0;

    const qualifyingUnits = eligibleSeconds / game.minPlayDuration;
    return Math.min(game.baseReward * qualifyingUnits, game.maxReward);
  }

  private deadHeartbeat(
    verifiedSeconds: number,
    reason: 'FLAGGED' | 'SESSION_CLOSED' | 'CAP_REACHED',
  ): HeartbeatResult {
    return {
      ok: false,
      verifiedSeconds,
      qualified: false,
      projectedReward: 0,
      remainingDailySeconds: 0,
      reason,
    };
  }
}

export const gamesService = new GamesService();

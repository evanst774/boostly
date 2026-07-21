// src/modules/admin/stats.service.ts
import { and, eq, gte, sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import {
  transactions,
  wallets,
  withdrawals,
  TransactionStatusEnum,
  WithdrawalStatusEnum,
} from '@/lib/db/schema/wallet';
import { rewards, RewardStatusEnum } from '@/lib/db/schema/rewards';
import { games } from '@/lib/db/schema/games';
import { videos } from '@/lib/db/schema/videos';
import { surveys } from '@/lib/db/schema/surveys';

// ============================================
// TYPES — this is the contract the dashboard renders against
// ============================================

export interface AdminOverviewStats {
  users: {
    total: number;
    active: number;
    newToday: number;
    newThisWeek: number;
    growthPercent: number;
  };
  money: {
    /** Total credited to user wallets, all time. Your cost. */
    totalPaidOut: number;
    paidOutToday: number;
    paidOutThisMonth: number;
    /** Sum of every user's current balance. Money you owe. */
    outstandingLiability: number;
    totalWithdrawn: number;
    pendingWithdrawalCount: number;
    pendingWithdrawalAmount: number;
  };
  content: {
    videos: { total: number; active: number };
    games: { total: number; active: number };
    surveys: { total: number; active: number };
  };
  health: {
    /** Paid out today divided by active users. The number to watch. */
    avgCostPerActiveUser: number;
    /** Users who earned something today. */
    earningUsersToday: number;
  };
}

// ============================================
// SERVICE
// ============================================

export class AdminStatsService {
  /**
   * Everything the overview tab needs, in one round trip.
   *
   * Deliberately shaped to match what the dashboard renders rather than
   * concatenating each module's own stats object — the previous route returned
   * `{ wallet, rewards, referrals, badges, content }` while the page destructured
   * `totalUsers`, `monthlyRevenue` and friends, so every card showed undefined.
   */
  async getOverview(): Promise<AdminOverviewStats> {
    const now = new Date();
    const startOfToday = `${now.toISOString().slice(0, 10)}T00:00:00.000Z`;
    const startOfMonth = `${now.toISOString().slice(0, 7)}-01T00:00:00.000Z`;
    const weekAgo = new Date(now.getTime() - 7 * 86_400_000).toISOString();
    const twoWeeksAgo = new Date(now.getTime() - 14 * 86_400_000).toISOString();

    const claimed = eq(rewards.status, RewardStatusEnum.CLAIMED);

    const [
      userTotals,
      newToday,
      newThisWeek,
      newPriorWeek,
      payoutAllTime,
      payoutToday,
      payoutMonth,
      earningUsersToday,
      walletTotals,
      pendingWithdrawals,
      videoCounts,
      gameCounts,
      surveyCounts,
    ] = await Promise.all([
      db
        .select({
          total: sql<number>`count(*)`,
          active: sql<number>`sum(case when ${users.isActive} then 1 else 0 end)`,
        })
        .from(users),

      db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(gte(users.createdAt, startOfToday)),

      db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(gte(users.createdAt, weekAgo)),

      // Prior 7-day window, for a real growth comparison instead of a fixed
      // "+12%" string in the UI.
      db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(
          and(
            gte(users.createdAt, twoWeeksAgo),
            sql`${users.createdAt} < ${weekAgo}`,
          ),
        ),

      db
        .select({ sum: sql<number>`sum(${rewards.amount})` })
        .from(rewards)
        .where(claimed),

      db
        .select({ sum: sql<number>`sum(${rewards.amount})` })
        .from(rewards)
        .where(and(claimed, gte(rewards.createdAt, startOfToday))),

      db
        .select({ sum: sql<number>`sum(${rewards.amount})` })
        .from(rewards)
        .where(and(claimed, gte(rewards.createdAt, startOfMonth))),

      db
        .select({ count: sql<number>`count(distinct ${rewards.userId})` })
        .from(rewards)
        .where(and(claimed, gte(rewards.createdAt, startOfToday))),

      db
        .select({
          balance: sql<number>`sum(${wallets.balance})`,
          withdrawn: sql<number>`sum(${wallets.totalWithdrawn})`,
        })
        .from(wallets),

      db
        .select({
          count: sql<number>`count(*)`,
          amount: sql<number>`sum(${withdrawals.amount})`,
        })
        .from(withdrawals)
        .where(eq(withdrawals.status, WithdrawalStatusEnum.PENDING)),

      db
        .select({
          total: sql<number>`count(*)`,
          active: sql<number>`sum(case when ${videos.status} = 'ACTIVE' then 1 else 0 end)`,
        })
        .from(videos),

      db
        .select({
          total: sql<number>`count(*)`,
          active: sql<number>`sum(case when ${games.status} = 'ACTIVE' then 1 else 0 end)`,
        })
        .from(games),

      db
        .select({
          total: sql<number>`count(*)`,
          active: sql<number>`sum(case when ${surveys.status} = 'ACTIVE' then 1 else 0 end)`,
        })
        .from(surveys),
    ]);

    const thisWeek = num(newThisWeek[0]?.count);
    const priorWeek = num(newPriorWeek[0]?.count);
    const growthPercent =
      priorWeek > 0
        ? ((thisWeek - priorWeek) / priorWeek) * 100
        : thisWeek > 0
          ? 100
          : 0;

    const activeUsers = num(userTotals[0]?.active);
    const paidToday = num(payoutToday[0]?.sum);

    return {
      users: {
        total: num(userTotals[0]?.total),
        active: activeUsers,
        newToday: num(newToday[0]?.count),
        newThisWeek: thisWeek,
        growthPercent: Math.round(growthPercent * 10) / 10,
      },
      money: {
        totalPaidOut: num(payoutAllTime[0]?.sum),
        paidOutToday: paidToday,
        paidOutThisMonth: num(payoutMonth[0]?.sum),
        outstandingLiability: num(walletTotals[0]?.balance),
        totalWithdrawn: num(walletTotals[0]?.withdrawn),
        pendingWithdrawalCount: num(pendingWithdrawals[0]?.count),
        pendingWithdrawalAmount: num(pendingWithdrawals[0]?.amount),
      },
      content: {
        videos: {
          total: num(videoCounts[0]?.total),
          active: num(videoCounts[0]?.active),
        },
        games: {
          total: num(gameCounts[0]?.total),
          active: num(gameCounts[0]?.active),
        },
        surveys: {
          total: num(surveyCounts[0]?.total),
          active: num(surveyCounts[0]?.active),
        },
      },
      health: {
        avgCostPerActiveUser: activeUsers > 0 ? paidToday / activeUsers : 0,
        earningUsersToday: num(earningUsersToday[0]?.count),
      },
    };
  }

  /**
   * Daily payout for the last N days, for the overview chart.
   * Replaces the hardcoded `[65, 45, 80, ...]` array in the dashboard.
   */
  async getDailyPayoutSeries(
    days = 30,
  ): Promise<Array<{ date: string; amount: number; count: number }>> {
    const since = new Date(Date.now() - days * 86_400_000)
      .toISOString()
      .slice(0, 10);

    const rows = await db
      .select({
        date: sql<string>`date(${rewards.createdAt})`,
        amount: sql<number>`sum(${rewards.amount})`,
        count: sql<number>`count(*)`,
      })
      .from(rewards)
      .where(
        and(
          eq(rewards.status, RewardStatusEnum.CLAIMED),
          gte(rewards.createdAt, `${since}T00:00:00.000Z`),
        ),
      )
      .groupBy(sql`date(${rewards.createdAt})`)
      .orderBy(sql`date(${rewards.createdAt})`);

    // Fill gaps so the chart doesn't compress days with no activity.
    const byDate = new Map(rows.map((r) => [r.date, r]));
    const series: Array<{ date: string; amount: number; count: number }> = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86_400_000)
        .toISOString()
        .slice(0, 10);
      const row = byDate.get(date);
      series.push({
        date,
        amount: num(row?.amount),
        count: num(row?.count),
      });
    }

    return series;
  }

  /**
   * Real recent activity from the transactions ledger.
   * Replaces the hardcoded "John Doe registered 2 min ago" list.
   */
  async getRecentActivity(limit = 10) {
    return await db
      .select({
        id: transactions.id,
        userId: transactions.userId,
        userName: users.name,
        type: transactions.type,
        amount: transactions.amount,
        currency: transactions.currency,
        description: transactions.description,
        referenceType: transactions.referenceType,
        createdAt: transactions.createdAt,
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .where(eq(transactions.status, TransactionStatusEnum.COMPLETED))
      .orderBy(sql`${transactions.createdAt} desc`)
      .limit(limit);
  }
}

// ============================================
// HELPERS
// ============================================

function num(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export const adminStatsService = new AdminStatsService();

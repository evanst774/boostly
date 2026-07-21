// src/services/withdrawal-activity.service.ts

import { db } from '@/lib/db';
import {
  withdrawals,
  type Withdrawal,
  type WithdrawalStatus,
} from '@/lib/db/schema/wallet';
import { eq, desc, and, sql } from 'drizzle-orm';
import { formatDistanceToNow } from 'date-fns';

export interface WithdrawalActivity {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  amount: number;
  currency: string;
  method: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  requestedAt: string;
  completedAt?: string;
  timeAgo: string;
  formattedAmount: string;
  reference?: string;
  failureReason?: string;
}

export interface WithdrawalActivityStats {
  totalWithdrawn: number;
  pendingCount: number;
  completedCount: number;
  failedCount: number;
  recentWithdrawals: WithdrawalActivity[];
}

export class WithdrawalActivityService {
  /**
   * Get recent withdrawal activity for a user
   */
  async getUserWithdrawalActivity(
    userId: string,
    limit: number = 10,
    offset: number = 0,
  ): Promise<WithdrawalActivity[]> {
    const results = await db.query.withdrawals.findMany({
      where: eq(withdrawals.userId, userId),
      orderBy: [desc(withdrawals.requestedAt)],
      limit,
      offset,
    });

    return results.map((w) => this.formatWithdrawalActivity(w));
  }

  /**
   * Get withdrawal activity with user details (for admin)
   */
  async getAllWithdrawalActivity(
    limit: number = 20,
    offset: number = 0,
    status?: WithdrawalStatus,
  ): Promise<WithdrawalActivity[]> {
    const conditions = [];
    if (status) {
      conditions.push(eq(withdrawals.status, status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db.query.withdrawals.findMany({
      where: whereClause,
      with: {
        user: true,
      },
      orderBy: [desc(withdrawals.requestedAt)],
      limit,
      offset,
    });

    return results.map((w) => this.formatWithdrawalActivity(w));
  }

  /**
   * Get withdrawal statistics for a user
   */
  async getUserWithdrawalStats(
    userId: string,
  ): Promise<WithdrawalActivityStats> {
    const [total, pending, completed, failed, recent] = await Promise.all([
      // Total withdrawn
      db
        .select({
          total: sql<number>`sum(${withdrawals.amount})`,
        })
        .from(withdrawals)
        .where(
          and(
            eq(withdrawals.userId, userId),
            eq(withdrawals.status, 'COMPLETED'),
          ),
        ),

      // Pending count
      db
        .select({
          count: sql<number>`count(*)`,
        })
        .from(withdrawals)
        .where(
          and(
            eq(withdrawals.userId, userId),
            eq(withdrawals.status, 'PENDING'),
          ),
        ),

      // Completed count
      db
        .select({
          count: sql<number>`count(*)`,
        })
        .from(withdrawals)
        .where(
          and(
            eq(withdrawals.userId, userId),
            eq(withdrawals.status, 'COMPLETED'),
          ),
        ),

      // Failed count
      db
        .select({
          count: sql<number>`count(*)`,
        })
        .from(withdrawals)
        .where(
          and(eq(withdrawals.userId, userId), eq(withdrawals.status, 'FAILED')),
        ),

      // Recent 5 withdrawals
      db.query.withdrawals.findMany({
        where: eq(withdrawals.userId, userId),
        orderBy: [desc(withdrawals.requestedAt)],
        limit: 5,
      }),
    ]);

    return {
      totalWithdrawn: Number(total[0]?.total ?? 0),
      pendingCount: Number(pending[0]?.count ?? 0),
      completedCount: Number(completed[0]?.count ?? 0),
      failedCount: Number(failed[0]?.count ?? 0),
      recentWithdrawals: recent.map((w) => this.formatWithdrawalActivity(w)),
    };
  }

  /**
   * Get global withdrawal statistics (for admin)
   */
  async getGlobalWithdrawalStats(): Promise<{
    totalWithdrawn: number;
    totalCount: number;
    pendingCount: number;
    processingCount: number;
    completedCount: number;
    failedCount: number;
    todayCount: number;
    todayAmount: number;
    weekCount: number;
    weekAmount: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [
      total,
      pending,
      processing,
      completed,
      failed,
      todayStats,
      weekStats,
    ] = await Promise.all([
      db
        .select({
          total: sql<number>`sum(${withdrawals.amount})`,
          count: sql<number>`count(*)`,
        })
        .from(withdrawals)
        .where(eq(withdrawals.status, 'COMPLETED')),

      db
        .select({ count: sql<number>`count(*)` })
        .from(withdrawals)
        .where(eq(withdrawals.status, 'PENDING')),
      db
        .select({ count: sql<number>`count(*)` })
        .from(withdrawals)
        .where(eq(withdrawals.status, 'PROCESSING')),
      db
        .select({ count: sql<number>`count(*)` })
        .from(withdrawals)
        .where(eq(withdrawals.status, 'COMPLETED')),
      db
        .select({ count: sql<number>`count(*)` })
        .from(withdrawals)
        .where(eq(withdrawals.status, 'FAILED')),

      db
        .select({
          count: sql<number>`count(*)`,
          amount: sql<number>`sum(${withdrawals.amount})`,
        })
        .from(withdrawals)
        .where(
          and(
            eq(withdrawals.status, 'COMPLETED'),
            sql`${withdrawals.completedAt} >= ${today.toISOString()}`,
          ),
        ),

      db
        .select({
          count: sql<number>`count(*)`,
          amount: sql<number>`sum(${withdrawals.amount})`,
        })
        .from(withdrawals)
        .where(
          and(
            eq(withdrawals.status, 'COMPLETED'),
            sql`${withdrawals.completedAt} >= ${weekAgo.toISOString()}`,
          ),
        ),
    ]);

    return {
      totalWithdrawn: Number(total[0]?.total ?? 0),
      totalCount: Number(total[0]?.count ?? 0),
      pendingCount: Number(pending[0]?.count ?? 0),
      processingCount: Number(processing[0]?.count ?? 0),
      completedCount: Number(completed[0]?.count ?? 0),
      failedCount: Number(failed[0]?.count ?? 0),
      todayCount: Number(todayStats[0]?.count ?? 0),
      todayAmount: Number(todayStats[0]?.amount ?? 0),
      weekCount: Number(weekStats[0]?.count ?? 0),
      weekAmount: Number(weekStats[0]?.amount ?? 0),
    };
  }

  /**
   * Format a withdrawal record for display
   */
  private formatWithdrawalActivity(
    withdrawal: Withdrawal & { user?: { name: string | null } | null },
  ): WithdrawalActivity {
    const userName = withdrawal.user?.name || 'Unknown User';
    const status = withdrawal.status as
      | 'PENDING'
      | 'PROCESSING'
      | 'COMPLETED'
      | 'FAILED';

    return {
      id: withdrawal.id,
      userId: withdrawal.userId,
      userName: userName,
      amount: withdrawal.amount,
      currency: withdrawal.currency || 'RWF',
      method: withdrawal.method,
      status: status,
      requestedAt: withdrawal.requestedAt,
      completedAt: withdrawal.completedAt ?? undefined,
      timeAgo: formatDistanceToNow(new Date(withdrawal.requestedAt), {
        addSuffix: true,
      }),
      formattedAmount: `${withdrawal.amount.toLocaleString()} ${withdrawal.currency || 'RWF'}`,
      reference: withdrawal.reference ?? undefined,
      failureReason: withdrawal.failureReason ?? undefined,
    };
  }
}

export const withdrawalActivityService = new WithdrawalActivityService();

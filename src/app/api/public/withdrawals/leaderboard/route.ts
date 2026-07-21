// src/app/api/public/withdrawals/leaderboard/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withdrawals } from '@/lib/db/schema/wallet';
import { users } from '@/lib/db/schema/users';
import { userBadges } from '@/lib/db/schema/badges';
import { badges } from '@/lib/db/schema/badges';
import { eq, desc, sql, and, gte } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const period = searchParams.get('period') || 'month'; // 'week', 'month', 'all'
    const limit = parseInt(searchParams.get('limit') || '10');

    // Calculate date range based on period
    let startDate: Date | null = null;
    if (period === 'week') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
    }

    // Build query conditions
    const conditions = [
      eq(withdrawals.status, 'COMPLETED'),
      sql`${withdrawals.completedAt} IS NOT NULL`,
    ];

    if (startDate) {
      conditions.push(gte(withdrawals.completedAt, startDate.toISOString()));
    }

    // Get top withdrawers
    const topWithdrawers = await db
      .select({
        userId: withdrawals.userId,
        userName: users.name,
        totalWithdrawn: sql<number>`sum(${withdrawals.amount})`,
        withdrawalsCount: sql<number>`count(${withdrawals.id})`,
        currency: withdrawals.currency,
        lastWithdrawal: sql<string>`max(${withdrawals.completedAt})`,
      })
      .from(withdrawals)
      .leftJoin(users, eq(withdrawals.userId, users.id))
      .where(and(...conditions))
      .groupBy(withdrawals.userId)
      .orderBy(desc(sql`sum(${withdrawals.amount})`))
      .limit(limit);

    // Get user badges for display
    const userBadgesList = await db
      .select({
        userId: userBadges.userId,
        badgeName: badges.name,
        badgeIcon: badges.icon,
        badgeTier: badges.tier,
      })
      .from(userBadges)
      .leftJoin(badges, eq(userBadges.badgeId, badges.id))
      .where(eq(userBadges.isActive, true));

    const badgeMap = userBadgesList.reduce(
      (acc, ub) => {
        acc[ub.userId] = ub.badgeName || 'User';
        return acc;
      },
      {} as Record<string, string>,
    );

    // Format for leaderboard
    const formatted = topWithdrawers.map((w, index) => ({
      rank: index + 1,
      userId: w.userId,
      userName: w.userName || 'Anonymous User',
      totalWithdrawn: Number(w.totalWithdrawn) || 0,
      currency: w.currency || 'RWF',
      withdrawalsCount: Number(w.withdrawalsCount) || 0,
      badge: badgeMap[w.userId] || null,
    }));

    return NextResponse.json({
      withdrawers: formatted,
      period,
      total: formatted.length,
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 },
    );
  }
}

// src/app/api/public/withdrawals/stats/route.ts

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withdrawals } from '@/lib/db/schema/wallet';
import { eq, sql, and, gte } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    // Get total withdrawals
    const [totalStats, todayStats, weekStats, monthStats] = await Promise.all([
      // All time
      db
        .select({
          count: sql<number>`count(*)`,
          amount: sql<number>`sum(${withdrawals.amount})`,
          users: sql<number>`count(distinct ${withdrawals.userId})`,
        })
        .from(withdrawals)
        .where(eq(withdrawals.status, 'COMPLETED')),

      // Today
      db
        .select({
          count: sql<number>`count(*)`,
          amount: sql<number>`sum(${withdrawals.amount})`,
        })
        .from(withdrawals)
        .where(
          and(
            eq(withdrawals.status, 'COMPLETED'),
            gte(withdrawals.completedAt, today.toISOString()),
          ),
        ),

      // This week
      db
        .select({
          count: sql<number>`count(*)`,
          amount: sql<number>`sum(${withdrawals.amount})`,
        })
        .from(withdrawals)
        .where(
          and(
            eq(withdrawals.status, 'COMPLETED'),
            gte(withdrawals.completedAt, weekAgo.toISOString()),
          ),
        ),

      // This month
      db
        .select({
          count: sql<number>`count(*)`,
          amount: sql<number>`sum(${withdrawals.amount})`,
        })
        .from(withdrawals)
        .where(
          and(
            eq(withdrawals.status, 'COMPLETED'),
            gte(withdrawals.completedAt, monthAgo.toISOString()),
          ),
        ),
    ]);

    return NextResponse.json({
      stats: {
        totalWithdrawals: Number(totalStats[0]?.count || 0),
        totalAmount: Number(totalStats[0]?.amount || 0),
        totalUsers: Number(totalStats[0]?.users || 0),
        todayWithdrawals: Number(todayStats[0]?.count || 0),
        todayAmount: Number(todayStats[0]?.amount || 0),
        weekWithdrawals: Number(weekStats[0]?.count || 0),
        weekAmount: Number(weekStats[0]?.amount || 0),
        monthWithdrawals: Number(monthStats[0]?.count || 0),
        monthAmount: Number(monthStats[0]?.amount || 0),
      },
    });
  } catch (error) {
    console.error('Error fetching withdrawal stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch withdrawal stats' },
      { status: 500 },
    );
  }
}

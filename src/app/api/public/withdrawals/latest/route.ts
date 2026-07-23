// src/app/api/public/withdrawals/latest/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withdrawals } from '@/lib/db/schema/wallet';
import { users } from '@/lib/db/schema/users';
import { eq, desc, and, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '3');

    const latestWithdrawals = await db
      .select({
        id: withdrawals.id,
        userId: withdrawals.userId,
        amount: withdrawals.amount,
        currency: withdrawals.currency,
        completedAt: withdrawals.completedAt,
        userName: users.name,
      })
      .from(withdrawals)
      .leftJoin(users, eq(withdrawals.userId, users.id))
      .where(
        and(
          eq(withdrawals.status, 'COMPLETED'),
          sql`${withdrawals.completedAt} IS NOT NULL`,
        ),
      )
      .orderBy(desc(withdrawals.completedAt))
      .limit(limit);

    const formatted = latestWithdrawals.map((w) => {
      const nameParts = w.userName?.split(' ') || ['User'];
      const displayName =
        nameParts.length > 1
          ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`
          : nameParts[0] || 'Someone';

      return {
        id: w.id,
        displayName,
        amount: w.amount,
        currency: w.currency || 'RWF',
        timestamp: w.completedAt,
      };
    });

    return NextResponse.json({
      withdrawals: formatted,
    });
  } catch (error) {
    console.error('Error fetching latest withdrawals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch latest withdrawals' },
      { status: 500 },
    );
  }
}

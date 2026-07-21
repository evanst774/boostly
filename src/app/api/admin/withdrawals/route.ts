// src/app/api/admin/withdrawals/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { requirePermission } from '@/lib/auth/permissions';
import { PermissionKeys } from '@/modules/rbac/permissions';
import { db } from '@/lib/db';
import {
  withdrawals,
  type Withdrawal,
  type WithdrawalStatus,
} from '@/lib/db/schema/wallet';
import { eq, desc, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await requirePermission(PermissionKeys.ADMIN_DASHBOARD);

    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'PENDING';
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const whereClause =
      status === 'all'
        ? undefined
        : eq(withdrawals.status, status as WithdrawalStatus);

    const results = await db.query.withdrawals.findMany({
      where: whereClause,
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [desc(withdrawals.requestedAt)],
      limit,
      offset,
    });

    // Get counts for stats
    const [total, pending, processing, completed, failed] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(withdrawals),
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
    ]);

    const formatted = results.map((w: Withdrawal & {
      user: { id: string; name: string; email: string } | null;
    }) => ({
      id: w.id,
      userId: w.userId,
      userName: w.user?.name || 'Unknown User',
      amount: w.amount,
      method: w.method,
      status: w.status,
      date: w.requestedAt,
      phoneNumber: w.phoneNumber,
      bankAccount: w.bankAccount,
    }));

    return NextResponse.json({
      withdrawals: formatted,
      stats: {
        total: Number(total[0]?.count ?? 0),
        pending: Number(pending[0]?.count ?? 0),
        processing: Number(processing[0]?.count ?? 0),
        completed: Number(completed[0]?.count ?? 0),
        failed: Number(failed[0]?.count ?? 0),
      },
    });
  } catch (error) {
    console.error('Withdrawals error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch withdrawals' },
      { status: 500 },
    );
  }
}

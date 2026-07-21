// src/app/api/admin/withdrawals/pending/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { requirePermission } from '@/lib/auth/permissions';
import { PermissionKeys } from '@/modules/rbac/permissions';
import { db } from '@/lib/db';
import { withdrawals, type Withdrawal } from '@/lib/db/schema/wallet';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await requirePermission(PermissionKeys.ADMIN_DASHBOARD);

    const results = await db.query.withdrawals.findMany({
      where: eq(withdrawals.status, 'PENDING'),
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
      limit: 20,
    });

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

    return NextResponse.json({ withdrawals: formatted });
  } catch (error) {
    console.error('Pending withdrawals error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending withdrawals' },
      { status: 500 },
    );
  }
}

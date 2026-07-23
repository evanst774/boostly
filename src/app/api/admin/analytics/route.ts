// src/app/api/admin/analytics/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { requirePermission } from '@/lib/auth/permissions';
import { PermissionKeys } from '@/modules/rbac/permissions';
import { adminStatsService } from '@/modules/admin/stats.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await requirePermission(PermissionKeys.ADMIN_DASHBOARD);

    const overview = await adminStatsService.getOverview();
    const series = await adminStatsService.getDailyPayoutSeries(30);

    return NextResponse.json({
      totalRevenue: overview.money.totalPaidOut,
      monthlyRevenue: overview.money.paidOutThisMonth,
      totalWithdrawals: overview.money.totalWithdrawn,
      pendingWithdrawals: overview.money.pendingWithdrawalCount,
      totalUsers: overview.users.total,
      activeUsers: overview.users.active,
      payoutSeries: series,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 },
    );
  }
}

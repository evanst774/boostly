// src/app/api/wallet/withdrawals/activity/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { withdrawalActivityService } from '@/services/withdrawal-activity.service';
import { requirePermission } from '@/lib/auth/permissions';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const userId = searchParams.get('userId');

    // If userId is provided, check if user has permission to view other users' withdrawals
    if (userId && userId !== user.id) {
      await requirePermission('withdrawals.manage');
    }

    const targetUserId = userId || user.id;

    // Get activity
    const activities =
      await withdrawalActivityService.getUserWithdrawalActivity(
        targetUserId,
        limit,
        offset,
      );

    // Get stats
    const stats =
      await withdrawalActivityService.getUserWithdrawalStats(targetUserId);

    return NextResponse.json({
      activities,
      stats,
      pagination: {
        limit,
        offset,
        total: activities.length,
      },
    });
  } catch (error) {
    console.error('Withdrawal activity error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 },
    );
  }
}

// src/app/api/admin/rewards/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { requirePermission } from '@/lib/auth/permissions';
import { PermissionKeys } from '@/modules/rbac/permissions';
import { db } from '@/lib/db';
import { rewards, RewardStatusEnum } from '@/lib/db/schema/rewards';
import { eq, desc, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await requirePermission(PermissionKeys.ADMIN_DASHBOARD);

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const results = await db.query.rewards.findMany({
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [desc(rewards.createdAt)],
      limit,
      offset,
    });

    // Get stats
    const [total, claimed, pending] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(rewards),
      db
        .select({ count: sql<number>`count(*)` })
        .from(rewards)
        .where(eq(rewards.status, RewardStatusEnum.CLAIMED)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(rewards)
        .where(eq(rewards.status, RewardStatusEnum.PENDING)),
    ]);

    return NextResponse.json({
      rewards: results,
      stats: {
        total: Number(total[0]?.count ?? 0),
        claimed: Number(claimed[0]?.count ?? 0),
        pending: Number(pending[0]?.count ?? 0),
      },
    });
  } catch (error) {
    console.error('Rewards error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rewards' },
      { status: 500 },
    );
  }
}

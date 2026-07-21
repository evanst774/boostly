// src/app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth/session.server';
import { requirePermission } from '@/lib/auth/permissions';
import { PermissionKeys } from '@/modules/rbac/permissions';
import { adminStatsService } from '@/modules/admin/stats.service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/stats
 * GET /api/admin/stats?include=series,activity
 *
 * Returns exactly the shape the dashboard renders. The previous version
 * concatenated each module's own stats object, which didn't match anything the
 * page destructured — so every card silently rendered undefined.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission(PermissionKeys.ADMIN_DASHBOARD);

    const include = new Set(
      (new URL(request.url).searchParams.get('include') ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    );

    // The overview is always needed. The chart series and activity feed are
    // heavier, so they're opt-in rather than paid for on every poll.
    const [overview, series, activity] = await Promise.all([
      adminStatsService.getOverview(),
      include.has('series')
        ? adminStatsService.getDailyPayoutSeries(30)
        : Promise.resolve(null),
      include.has('activity')
        ? adminStatsService.getRecentActivity(10)
        : Promise.resolve(null),
    ]);

    return NextResponse.json({
      ...overview,
      ...(series ? { payoutSeries: series } : {}),
      ...(activity ? { recentActivity: activity } : {}),
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    const lower = message.toLowerCase();
    const status =
      lower.includes('permission') || lower.includes('forbidden')
        ? 403
        : lower.includes('unauthorized')
          ? 401
          : 500;

    if (status === 500) console.error('[ADMIN STATS]', error);
    return NextResponse.json({ error: message }, { status });
  }
}

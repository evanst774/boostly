// src/app/api/admin/content/stats/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { requirePermission } from '@/lib/auth/permissions';
import { PermissionKeys } from '@/modules/rbac/permissions';
import { db } from '@/lib/db';
import { videos } from '@/lib/db/schema/videos';
import { games } from '@/lib/db/schema/games';
import { surveys } from '@/lib/db/schema/surveys';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await requirePermission(PermissionKeys.ADMIN_DASHBOARD);

    const [videoStats, gameStats, surveyStats] = await Promise.all([
      db
        .select({
          total: sql<number>`count(*)`,
          active: sql<number>`sum(case when ${videos.status} = 'ACTIVE' then 1 else 0 end)`,
        })
        .from(videos),
      db
        .select({
          total: sql<number>`count(*)`,
          active: sql<number>`sum(case when ${games.status} = 'ACTIVE' then 1 else 0 end)`,
        })
        .from(games),
      db
        .select({
          total: sql<number>`count(*)`,
          active: sql<number>`sum(case when ${surveys.status} = 'ACTIVE' then 1 else 0 end)`,
        })
        .from(surveys),
    ]);

    return NextResponse.json({
      videos: Number(videoStats[0]?.total ?? 0),
      games: Number(gameStats[0]?.total ?? 0),
      surveys: Number(surveyStats[0]?.total ?? 0),
    });
  } catch (error) {
    console.error('Content stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content stats' },
      { status: 500 },
    );
  }
}

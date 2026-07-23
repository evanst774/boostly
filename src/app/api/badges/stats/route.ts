// src/app/api/badges/stats/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { requirePermission } from '@/lib/auth/permissions';
import { badgesService } from '@/modules/badges/service';
import { BadgesPermissions } from '@/modules/badges/permissions';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission(BadgesPermissions.READ);

    const stats = await badgesService.getGlobalBadgeStats();

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Badge stats error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

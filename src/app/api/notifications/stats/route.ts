// src/app/api/notifications/stats/route.ts

import { NextResponse } from 'next/server';
import { notificationsService } from '@/lib/notifications';
import { requireAuth } from '@/lib/db/auth-utils';

export async function GET() {
  try {
    const user = await requireAuth();
    const stats = await notificationsService.getStatsForUser(user.user.id);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('[NOTIFICATIONS] Stats error:', error);
    return NextResponse.json(
      { message: 'Failed to get notification stats' },
      { status: 500 },
    );
  }
}

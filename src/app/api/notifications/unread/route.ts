// src/app/api/notifications/unread/route.ts

import { NextResponse } from 'next/server';
import { notificationsService } from '@/lib/notifications';
import { requireAuth } from '@/lib/db/auth-utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireAuth();
    const count = await notificationsService.getUnreadCount(user.user.id);

    return NextResponse.json({ count });
  } catch (error) {
    console.error('[NOTIFICATIONS] Unread count error:', error);
    return NextResponse.json(
      { message: 'Failed to get unread count' },
      { status: 500 },
    );
  }
}

// src/app/api/notifications/mark-all-read/route.ts

import { NextResponse } from 'next/server';
import { notificationsService } from '@/lib/notifications';
import { requireAuth } from '@/lib/db/auth-utils';

export async function PUT() {
  try {
    await requireAuth();
    const count = await notificationsService.markAllAsRead();

    return NextResponse.json({
      success: true,
      message: `Marked ${count} notifications as read`,
      count,
    });
  } catch (error) {
    console.error('[NOTIFICATIONS] Mark all read error:', error);
    return NextResponse.json(
      { message: 'Failed to mark all as read' },
      { status: 500 },
    );
  }
}

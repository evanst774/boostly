// src/app/api/notifications/[id]/read/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { notificationsService } from '@/lib/notifications';
import { requireAuth } from '@/lib/db/auth-utils';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireAuth();
    const notification = await notificationsService.markAsRead(params.id);

    if (!notification) {
      return NextResponse.json(
        { message: 'Notification not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, notification });
  } catch (error) {
    console.error('[NOTIFICATIONS] Mark read error:', error);
    return NextResponse.json(
      { message: 'Failed to mark notification as read' },
      { status: 500 },
    );
  }
}

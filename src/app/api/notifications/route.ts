// src/app/api/notifications/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { notificationsService } from '@/lib/notifications';
import { requireAuth } from '@/lib/db/auth-utils';
import type {
  NotificationFilters,
  NotificationType,
} from '@/lib/notifications/types';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;

    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const isRead = searchParams.get('isRead');
    const type = searchParams.get('type') as NotificationType | null;

    const filters: NotificationFilters = { limit, offset };
    if (isRead !== null) filters.isRead = isRead === 'true';
    if (type) filters.type = type;

    const result = await notificationsService.getUserNotifications(
      user.user.id,
      filters,
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('[NOTIFICATIONS] GET error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch notifications' },
      { status: 500 },
    );
  }
}

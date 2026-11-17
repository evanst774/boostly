// src/app/api/subscriptions/cancel/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { badgesService } from '@/modules/badges/service';

export const dynamic = 'force-dynamic';

/** Cancels the current user's active subscription; they fall back to Free. */
export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await badgesService.cancelMySubscription();
    return NextResponse.json({ success: true, subscription });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    const status = message === 'No active subscription found' ? 400 : 500;
    if (status === 500) console.error('Cancel subscription error:', error);
    return NextResponse.json({ error: message }, { status });
  }
}

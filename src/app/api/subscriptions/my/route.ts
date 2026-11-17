// src/app/api/subscriptions/my/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { badgesService } from '@/modules/badges/service';

export const dynamic = 'force-dynamic';

/** The current user's active subscription (with its plan), or null on Free. */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await badgesService.getMySubscription();
    if (!result || !result.plan) {
      return NextResponse.json({ subscription: null });
    }

    return NextResponse.json({
      subscription: {
        ...result.subscription,
        plan: result.plan,
        daysRemaining: result.daysRemaining,
      },
    });
  } catch (error) {
    console.error('My subscription error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// src/app/api/subscriptions/plans/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { requirePermission } from '@/lib/auth/permissions';
import { badgesService } from '@/modules/badges/service';
import { BadgesPermissions } from '@/modules/badges/permissions';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission(BadgesPermissions.SUBSCRIPTIONS_MANAGE);

    const body = await req.json();
    const updated = await badgesService.updateSubscriptionPlan(params.id, body);

    return NextResponse.json({ plan: updated });
  } catch (error) {
    console.error('Subscription plan PATCH error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission(BadgesPermissions.SUBSCRIPTIONS_DELETE);

    await badgesService.deleteSubscriptionPlan(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Subscription plan DELETE error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

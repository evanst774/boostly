// src/app/api/subscriptions/plans/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { requirePermission } from '@/lib/auth/permissions';
import { badgesService } from '@/modules/badges/service';
import { BadgesPermissions } from '@/modules/badges/permissions';
import { createSubscriptionPlanSchema } from '@/modules/badges/validation';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const plans = await badgesService.getAllSubscriptionPlans();

    return NextResponse.json({ plans });
  } catch (error) {
    console.error('Subscription plans GET error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission(BadgesPermissions.SUBSCRIPTIONS_CREATE);

    const body = await request.json();
    const validated = createSubscriptionPlanSchema.parse(body);

    const plan = await badgesService.createSubscriptionPlan(validated);

    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    console.error('Subscription plan POST error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// src/app/api/subscriptions/plans/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { requirePermission } from '@/lib/auth/permissions';
import { badgesService } from '@/modules/badges/service';
import { BadgesPermissions } from '@/modules/badges/permissions';
import { planErrorResponse } from '@/lib/api/plan-errors';

export const dynamic = 'force-dynamic';

// Members: active plans. Admins: ?all=1 adds hidden plans + subscriber counts.
export async function GET(request: NextRequest) {
  try {
    if (request.nextUrl.searchParams.get('all') === '1') {
      const user = await getCurrentUser();
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const plans = await badgesService.getAllSubscriptionPlansForAdmin();
      return NextResponse.json({ plans });
    }

    const plans = await badgesService.getAllSubscriptionPlans();

    return NextResponse.json({ plans });
  } catch (error) {
    console.error('Subscription plans GET error:', error);
    const { status, error: message } = planErrorResponse(error);
    return NextResponse.json({ error: message }, { status });
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
    const plan = await badgesService.createSubscriptionPlan(body);

    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    console.error('Subscription plan POST error:', error);
    const { status, error: message } = planErrorResponse(error);
    return NextResponse.json({ error: message }, { status });
  }
}

// src/app/api/referrals/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { requirePermission } from '@/lib/auth/permissions';
import { referralsService } from '@/modules/referrals/service';
import { ReferralsPermissions } from '@/modules/referrals/permissions';
import { createReferralSchema } from '@/modules/referrals/validation';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || user.id;
    const status = searchParams.get('status') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Users can only see their own referrals unless they have manage permission
    if (userId !== user.id) {
      await requirePermission(ReferralsPermissions.MANAGE);
    }

    const result = await referralsService.getUserReferrals(userId, {
      status,
      limit,
      offset,
    });

    return NextResponse.json({
      referrals: result.referrals,
      total: result.total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Referrals GET error:', error);
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

    const body = await request.json();
    const validated = createReferralSchema.parse(body);

    const referral = await referralsService.createReferral(user.id, validated);

    return NextResponse.json({ referral }, { status: 201 });
  } catch (error) {
    console.error('Referral POST error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

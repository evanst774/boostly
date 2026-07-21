// src/app/api/referrals/[id]/activate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { requirePermission } from '@/lib/auth/permissions';
import { referralsService } from '@/modules/referrals/service';
import { ReferralsPermissions } from '@/modules/referrals/permissions';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await requirePermission(ReferralsPermissions.MANAGE);

    const referral = await referralsService.activateReferral(params.id);

    return NextResponse.json({ referral });
  } catch (error) {
    console.error('Referral activate error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

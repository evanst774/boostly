// src/app/api/rewards/claim-all/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { rewardsService } from '@/modules/rewards/service';

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await rewardsService.claimAllRewards(user.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Claim all rewards error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

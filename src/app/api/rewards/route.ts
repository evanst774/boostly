// src/app/api/rewards/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { rewardsService } from '@/modules/rewards/service';
import { REWARD_TYPE_LIST, type RewardType } from '@/lib/db/schema/rewards';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    // Non-admins may only ever see their own rewards.
    const userId = user.id;
    const typeParam = searchParams.get('type');
    const type =
      typeParam && REWARD_TYPE_LIST.includes(typeParam as RewardType)
        ? (typeParam as RewardType)
        : undefined;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await rewardsService.getUserRewards(userId, {
      type,
      limit,
      offset,
    });

    return NextResponse.json({
      rewards: result.rewards,
      total: result.total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Rewards GET error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

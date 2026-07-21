// src/app/api/daily-bonus/streak/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { dailyBonusesService } from '@/modules/rewards/service';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const streakInfo = await dailyBonusesService.getStreakInfo(user.id);

    return NextResponse.json(streakInfo);
  } catch (error) {
    console.error('Streak GET error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

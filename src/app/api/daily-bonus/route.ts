// src/app/api/daily-bonus/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { dailyBonusesService } from '@/modules/rewards/service';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bonus = await dailyBonusesService.getOrCreateTodayBonus(user.id);

    return NextResponse.json({ bonus });
  } catch (error) {
    console.error('Daily bonus GET error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await dailyBonusesService.claimTodayBonus(user.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Daily bonus claim error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

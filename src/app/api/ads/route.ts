// src/app/api/ads/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { adWatchesService } from '@/modules/rewards/service';
import { createAdWatchSchema } from '@/modules/rewards/validation';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const today = searchParams.get('today') === 'true';

    let result;
    if (today) {
      result = await adWatchesService.getTodayAdWatches(user.id);
    } else {
      result = await adWatchesService.getUserAdEarnings(user.id);
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Ads GET error:', error);
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
    const validated = createAdWatchSchema.parse(body);

    const adWatch = await adWatchesService.startAdWatch(user.id, validated);

    return NextResponse.json({ adWatch }, { status: 201 });
  } catch (error) {
    console.error('Ad watch POST error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// src/app/api/ads/[id]/complete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { adWatchesService } from '@/modules/rewards/service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { watchDuration } = body;

    if (watchDuration === undefined) {
      return NextResponse.json(
        { error: 'watchDuration is required' },
        { status: 400 },
      );
    }

    const result = await adWatchesService.completeAdWatch(
      user.id,
      params.id,
      watchDuration,
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Ad watch complete error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

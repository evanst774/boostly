// src/app/api/content/videos/[id]/watch/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { videosService } from '@/modules/content';

export const dynamic = 'force-dynamic';

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
    const { watchPercent, watchDuration, deviceType, browserInfo } = body;

    if (watchPercent === undefined || watchDuration === undefined) {
      return NextResponse.json(
        { error: 'watchPercent and watchDuration are required' },
        { status: 400 },
      );
    }

    // FIX: videosService.watchVideo() accepts deviceType/browserInfo as its
    // 4th/5th params, but this route never forwarded them, so every watch
    // row was stamped 'unknown'/'unknown' regardless of what the client
    // sent. Falls back to the User-Agent header when the client doesn't
    // send an explicit browserInfo.
    const result = await videosService.watchVideo(
      params.id,
      watchPercent,
      watchDuration,
      typeof deviceType === 'string' ? deviceType : undefined,
      typeof browserInfo === 'string'
        ? browserInfo
        : request.headers.get('user-agent') || undefined,
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Video watch error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

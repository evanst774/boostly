// src/app/api/content/videos/[id]/watch/route.ts
//
// One endpoint, three actions:
//   { action: 'start' }                              -> start token + today's status
//   { action: 'progress', watchPercent, watchDuration } -> save progress (never pays)
//   { action: 'complete', startToken, watchDuration }   -> pay today's reward once
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { videosService } from '@/modules/content';
import { VideoTaskError } from '@/modules/content/services/videos/videos.service';

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

    const body = await request.json().catch(() => ({}));
    const action = body?.action ?? 'progress';

    if (action === 'start') {
      return NextResponse.json(await videosService.startWatch(params.id));
    }

    if (action === 'complete') {
      return NextResponse.json(
        await videosService.completeWatch(
          params.id,
          typeof body.startToken === 'string' ? body.startToken : undefined,
          Number(body.watchDuration) || 0,
        ),
      );
    }

    return NextResponse.json(
      await videosService.reportProgress(
        params.id,
        Number(body.watchPercent) || 0,
        Number(body.watchDuration) || 0,
        typeof body.deviceType === 'string' ? body.deviceType : undefined,
        typeof body.browserInfo === 'string'
          ? body.browserInfo
          : request.headers.get('user-agent') || undefined,
      ),
    );
  } catch (error) {
    if (error instanceof VideoTaskError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }
    console.error('Video watch error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 },
    );
  }
}

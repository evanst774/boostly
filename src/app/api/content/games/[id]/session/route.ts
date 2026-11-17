// src/app/api/content/games/[id]/session/route.ts
import { NextResponse } from 'next/server';

import {
  gamesService,
  GameTaskError,
} from '@/modules/content/services/games/games.service';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await gamesService.startSession(params.id);
    return NextResponse.json(session);
  } catch (error) {
    if (error instanceof GameTaskError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }
    const message =
      error instanceof Error ? error.message : 'Failed to start session';

    // Daily limits are an expected outcome, not a server fault.
    const status = message.includes('Unauthorized')
      ? 401
      : message.includes('not found')
        ? 404
        : message.includes('limit reached')
          ? 429
          : 400;

    return NextResponse.json({ error: message }, { status });
  }
}

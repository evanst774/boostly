// src/app/api/content/games/sessions/[sessionId]/heartbeat/route.ts
import { NextResponse } from 'next/server';

import { gamesService } from '@/modules/content/services/games/games.service';

export const dynamic = 'force-dynamic';

/**
 * Deliberately takes no body. Everything that determines payout is measured
 * server-side, so there is nothing the client could usefully send.
 */
export async function POST(
  _request: Request,
  { params }: { params: { sessionId: string } },
) {
  try {
    const result = await gamesService.heartbeat(params.sessionId);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Heartbeat failed';
    const status =
      message.includes('Unauthorized') ? 401
      : message.includes('not found') ? 404
      : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
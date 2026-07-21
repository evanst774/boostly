// src/app/api/content/games/sessions/[sessionId]/complete/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { gamesService } from '@/modules/content/services/games/games.service';

export const dynamic = 'force-dynamic';

/**
 * Both fields are cosmetic. `score` feeds the leaderboard, `duration` is kept
 * for analytics so you can compare what clients claim against what the server
 * verified — a large persistent gap is a useful abuse signal.
 */
const completeSchema = z.object({
  score: z.number().int().min(0).max(10_000_000).optional(),
  duration: z.number().int().min(0).max(86_400).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: { sessionId: string } },
) {
  try {
    const raw: unknown = await request.json().catch(() => ({}));
    const parsed = completeSchema.safeParse(raw);
    const clientReport = parsed.success ? parsed.data : {};

    const result = await gamesService.completeSession(
      params.sessionId,
      clientReport,
    );
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to complete session';
    const status = message.includes('Unauthorized')
      ? 401
      : message.includes('not found')
        ? 404
        : 400;

    return NextResponse.json({ error: message }, { status });
  }
}

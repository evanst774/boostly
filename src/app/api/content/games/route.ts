// src/app/api/content/games/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getCurrentUser } from '@/lib/auth/session.server';
import { GameCategoryEnum, GameStatusEnum } from '@/lib/db/schema';
import { createGameSchema } from '@/modules/content/validation';
import { gamesService } from '@/modules/content';

export const dynamic = 'force-dynamic';

// ============================================
// QUERY VALIDATION
// ============================================

/**
 * THIS is what fixes the TS2322 errors.
 *
 * searchParams.get() returns `string | null`. TypeScript can't know those
 * strings are valid enum members, so it refuses to pass them to a parameter
 * typed `GameCategory`. The error message points at games.service.ts only
 * because that's where the EXPECTED type is declared — the offending code was
 * always here.
 *
 * z.enum() accepts the `as const` enum objects directly in Zod 4 and infers the
 * exact union, so there's no cast and no second list of names to keep in sync.
 */
const listQuerySchema = z.object({
  /** 'admin' unlocks the status filter and draft visibility. Requires permission. */
  scope: z.enum(['public', 'admin']).default('public'),
  active: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
  category: z.enum(GameCategoryEnum).optional(),
  status: z.enum(GameStatusEnum).optional(),
  search: z.string().trim().min(1).max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  // Capped so a client can't request the whole table in one call.
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// ============================================
// GET — list games
// ============================================

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parsed = listQuerySchema.safeParse(
      Object.fromEntries(searchParams.entries()),
    );

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { scope, active, category, status, search, page, limit } = parsed.data;

    if (active) {
      const games = await gamesService.getActiveGames();
      return NextResponse.json({ games });
    }

    // Admin listing enforces GAMES_READ inside getGames, and `status` is only
    // honoured there. Public callers can never surface DRAFT rows — previously
    // this route required GAMES_READ from everyone, including the earn page.
    const result =
      scope === 'admin'
        ? await gamesService.getGames({ category, status, search, page, limit })
        : await gamesService.getPublicGames({ category, search, page, limit });

    // totalPages was missing before, so the client's `page < totalPages` check
    // always failed and "Load More" never appeared past the first page.
    const totalPages = Math.max(1, Math.ceil(result.total / limit));

    return NextResponse.json({
      games: result.games,
      total: result.total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    return NextResponse.json(
      { error: messageOf(error) },
      { status: statusOf(error) },
    );
  }
}

// ============================================
// POST — create game
// ============================================

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: unknown = await request.json();
    const parsed = createGameSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid game payload',
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    // createGame checks GAMES_CREATE and validates again internally. The parse
    // here exists only to return a useful 400 instead of a thrown 500.
    const game = await gamesService.createGame(parsed.data);

    return NextResponse.json({ game }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: messageOf(error) },
      { status: statusOf(error) },
    );
  }
}

// ============================================
// ERROR MAPPING
// ============================================

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Internal server error';
}

/**
 * Everything used to return 500, including permission denials — which makes
 * "you're not allowed" indistinguishable from "the server broke" in your logs.
 */
function statusOf(error: unknown): number {
  const message = messageOf(error).toLowerCase();
  if (message.includes('unauthorized')) return 401;
  if (message.includes('permission') || message.includes('forbidden'))
    return 403;
  if (message.includes('not found')) return 404;
  return 500;
}

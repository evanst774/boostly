// src/app/api/admin/content/games/route.ts
//
// Admin list of all games (every status). The service enforces the content
// read permission, so being logged in is not enough.
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { gamesService } from '@/modules/content/services/games/games.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(
      Math.max(1, parseInt(searchParams.get('limit') || '200', 10) || 200),
      500,
    );
    const search = searchParams.get('search') || undefined;

    const result = await gamesService.getGames({ search, page, limit });
    return NextResponse.json({ ...result, page, limit });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = /permission|forbidden|unauthori[sz]ed/i.test(message) ? 403 : 500;
    if (status === 500) console.error('Admin games list error:', error);
    return NextResponse.json({ error: message }, { status });
  }
}

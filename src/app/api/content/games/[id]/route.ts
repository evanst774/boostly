// src/app/api/content/games/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { requirePermission } from '@/lib/auth/permissions';
import { ContentPermissions } from '@/modules/content/permissions';
import { updateGameSchema } from '@/modules/content/validation';
import { gamesService } from '@/modules/content';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const game = await gamesService.getGame(params.id);
    return NextResponse.json({ game });
  } catch (error) {
    console.error('Game GET error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission(ContentPermissions.GAMES_UPDATE);

    const body = await request.json();
    const validated = updateGameSchema.parse(body);

    const game = await gamesService.updateGame(params.id, validated);
    return NextResponse.json({ game });
  } catch (error) {
    console.error('Game PUT error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission(ContentPermissions.GAMES_DELETE);

    await gamesService.deleteGame(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Game DELETE error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

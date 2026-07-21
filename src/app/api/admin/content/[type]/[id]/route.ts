// src/app/api/admin/content/[type]/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { videosService } from '@/modules/content/services/videos/videos.service';
import { gamesService } from '@/modules/content/services/games/games.service';
import { surveysService } from '@/modules/content/services/surveys/surveys.service';

type ContentType = 'videos' | 'games' | 'surveys';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { type: ContentType; id: string } },
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    if (body.action !== 'publish') {
      return NextResponse.json(
        { error: 'Unsupported action' },
        { status: 400 },
      );
    }

    let updated;
    if (params.type === 'videos') {
      updated = await videosService.publishVideo(params.id);
    } else if (params.type === 'games') {
      updated = await gamesService.publishGame(params.id);
    } else if (params.type === 'surveys') {
      updated = await surveysService.publishSurvey(params.id);
    } else {
      return NextResponse.json(
        { error: 'Unknown content type' },
        { status: 400 },
      );
    }

    return NextResponse.json({ item: updated });
  } catch (error) {
    console.error('Admin content publish error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { type: ContentType; id: string } },
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (params.type === 'videos') {
      await videosService.deleteVideo(params.id);
    } else if (params.type === 'games') {
      await gamesService.deleteGame(params.id);
    } else if (params.type === 'surveys') {
      await surveysService.deleteSurvey(params.id);
    } else {
      return NextResponse.json(
        { error: 'Unknown content type' },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin content delete error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

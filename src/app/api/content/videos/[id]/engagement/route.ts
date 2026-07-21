// src/app/api/content/videos/[id]/engagement/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { videoEngagementsService } from '@/modules/content';

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
    const { type } = body;

    if (!type || !['like', 'dislike', 'share', 'save'].includes(type)) {
      return NextResponse.json(
        {
          error: 'Invalid engagement type. Must be: like, dislike, share, save',
        },
        { status: 400 },
      );
    }

    const result = await videoEngagementsService.toggleEngagement(params.id, type);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Engagement error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await videoEngagementsService.getVideoEngagementStats(params.id);
    const userEngagement = await videoEngagementsService.getUserVideoEngagements(
      params.id,
    );

    return NextResponse.json({ stats, userEngagement });
  } catch (error) {
    console.error('Engagement stats error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

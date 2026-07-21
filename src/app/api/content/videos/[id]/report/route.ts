// src/app/api/content/videos/[id]/report/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { videoReportsService } from '@/modules/content';

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
    const { reason, description } = body;

    if (!reason) {
      return NextResponse.json(
        { error: 'Reason is required' },
        { status: 400 },
      );
    }

    const report = await videoReportsService.reportVideo(
      params.id,
      reason,
      description,
    );
    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    console.error('Report POST error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

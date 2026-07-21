// src/app/api/content/videos/sponsored/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { videosService } from '@/modules/content';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const videos = await videosService.getSponsoredVideos();
    return NextResponse.json({ videos });
  } catch (error) {
    console.error('Sponsored videos error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

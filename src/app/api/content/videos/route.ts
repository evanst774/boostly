// src/app/api/content/videos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { requirePermission } from '@/lib/auth/permissions';
import { ContentPermissions } from '@/modules/content/permissions';
import { createVideoSchema } from '@/modules/content/validation';
import { videosService } from '@/modules/content';
import {
  VIDEO_CATEGORY_LIST,
  VIDEO_STATUS_LIST,
  VIDEO_DIFFICULTY_LIST,
  type VideoCategory,
  type VideoStatus,
  type VideoDifficulty,
} from '@/lib/db/schema/videos';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';
    const categoryParam = searchParams.get('category');
    const category =
      categoryParam && VIDEO_CATEGORY_LIST.includes(categoryParam as VideoCategory)
        ? (categoryParam as VideoCategory)
        : undefined;
    const statusParam = searchParams.get('status');
    const status =
      statusParam && VIDEO_STATUS_LIST.includes(statusParam as VideoStatus)
        ? (statusParam as VideoStatus)
        : undefined;
    // FIX: the admin videos page sends `difficulty` as a filter, but this
    // route never read it, so it was silently dropped before ever reaching
    // videosRepository.getVideos() (which already supports it).
    const difficultyParam = searchParams.get('difficulty');
    const difficulty =
      difficultyParam &&
      VIDEO_DIFFICULTY_LIST.includes(difficultyParam as VideoDifficulty)
        ? (difficultyParam as VideoDifficulty)
        : undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // If active only, no permission check needed (public)
    if (activeOnly) {
      const videos = await videosService.getActiveVideos();
      return NextResponse.json({ videos });
    }

    // For full list, require read permission
    await requirePermission(ContentPermissions.VIDEOS_READ);

    const result = await videosService.getVideos({
      category,
      status,
      difficulty,
      search,
      page,
      limit,
    });

    return NextResponse.json({
      videos: result.videos,
      total: result.total,
      page,
      limit,
    });
  } catch (error) {
    console.error('Videos GET error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission(ContentPermissions.VIDEOS_CREATE);

    const body = await request.json();
    const validated = createVideoSchema.parse(body);

    const video = await videosService.createVideo(validated);

    return NextResponse.json({ video }, { status: 201 });
  } catch (error) {
    console.error('Videos POST error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

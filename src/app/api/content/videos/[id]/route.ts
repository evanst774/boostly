// src/app/api/content/videos/[id]/route.ts
import { ZodError } from 'zod';
import { firstIssueMessage } from '@/modules/content/validation';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { requirePermission } from '@/lib/auth/permissions';
import { ContentPermissions } from '@/modules/content/permissions';
import { updateVideoSchema } from '@/modules/content/validation';
import { videosService } from '@/modules/content';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const video = await videosService.getVideo(params.id);
    return NextResponse.json({ video });
  } catch (error) {
    console.error('Video GET error:', error);
    // Validation problems: one clear sentence and a 400, not raw JSON.
    if (error instanceof ZodError) {
      return NextResponse.json({ error: firstIssueMessage(error) }, { status: 400 });
    }
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

    await requirePermission(ContentPermissions.VIDEOS_UPDATE);

    const body = await request.json();
    // The service validates and keeps only the fields that were sent; parsing
    // here first would add schema defaults (e.g. status) and overwrite them.
    updateVideoSchema.parse(body);

    const video = await videosService.updateVideo(params.id, body);
    return NextResponse.json({ video });
  } catch (error) {
    console.error('Video PUT error:', error);
    // Validation problems: one clear sentence and a 400, not raw JSON.
    if (error instanceof ZodError) {
      return NextResponse.json({ error: firstIssueMessage(error) }, { status: 400 });
    }
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

    await requirePermission(ContentPermissions.VIDEOS_DELETE);

    await videosService.deleteVideo(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Video DELETE error:', error);
    // Validation problems: one clear sentence and a 400, not raw JSON.
    if (error instanceof ZodError) {
      return NextResponse.json({ error: firstIssueMessage(error) }, { status: 400 });
    }
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

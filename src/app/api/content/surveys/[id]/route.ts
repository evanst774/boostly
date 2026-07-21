// src/app/api/content/surveys/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { requirePermission } from '@/lib/auth/permissions';
import { ContentPermissions } from '@/modules/content/permissions';
import { updateSurveySchema } from '@/modules/content/validation';
import { surveysService } from '@/modules/content';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const survey = await surveysService.getSurvey(params.id);
    return NextResponse.json({ survey });
  } catch (error) {
    console.error('Survey GET error:', error);
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

    await requirePermission(ContentPermissions.SURVEYS_UPDATE);

    const body = await request.json();
    const validated = updateSurveySchema.parse(body);

    const survey = await surveysService.updateSurvey(params.id, validated);
    return NextResponse.json({ survey });
  } catch (error) {
    console.error('Survey PUT error:', error);
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

    await requirePermission(ContentPermissions.SURVEYS_DELETE);

    await surveysService.deleteSurvey(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Survey DELETE error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

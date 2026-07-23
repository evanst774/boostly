// src/app/api/content/surveys/[id]/questions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { surveysService } from '@/modules/content';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const questions = Array.isArray(body?.questions) ? body.questions : [];

    const result = await surveysService.setQuestions(params.id, questions);
    return NextResponse.json({ questions: result });
  } catch (error) {
    console.error('Survey questions PUT error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

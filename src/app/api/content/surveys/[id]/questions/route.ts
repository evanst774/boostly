// src/app/api/content/surveys/[id]/questions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { surveysService } from '@/modules/content';
import { SurveyTaskError } from '@/modules/content/services/surveys/surveys.service';

export const dynamic = 'force-dynamic';

/** Start a survey: returns its questions and a signed start token. */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(await surveysService.startSurvey(params.id));
  } catch (error) {
    if (error instanceof SurveyTaskError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }
    console.error('Survey start error:', error);
    return NextResponse.json(
      { error: 'Could not open this survey. Please try again.' },
      { status: 500 },
    );
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

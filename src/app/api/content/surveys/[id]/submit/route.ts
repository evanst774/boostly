// src/app/api/content/surveys/[id]/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/session.server';
import { surveysService } from '@/modules/content';
import { SurveyTaskError } from '@/modules/content/services/surveys/surveys.service';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    if (!Array.isArray(body?.answers) || body.answers.length === 0) {
      return NextResponse.json(
        { error: 'Please answer the questions before submitting.', code: 'INVALID_ANSWER' },
        { status: 400 },
      );
    }

    const result = await surveysService.submitSurvey({
      surveyId: params.id,
      answers: body.answers,
      startToken: body.startToken,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof SurveyTaskError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Some answers are invalid. Please try again.', code: 'INVALID_ANSWER' },
        { status: 400 },
      );
    }
    console.error('Survey submit error:', error);
    return NextResponse.json(
      { error: 'Could not submit your survey. Please try again.' },
      { status: 500 },
    );
  }
}

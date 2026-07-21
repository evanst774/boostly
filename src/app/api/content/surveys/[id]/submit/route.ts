// src/app/api/content/surveys/[id]/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { surveysService } from '@/modules/content';

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
    const { answers } = body;

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { error: 'answers array is required' },
        { status: 400 },
      );
    }

    const result = await surveysService.submitSurvey({
      surveyId: params.id,
      answers,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Survey submit error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// src/app/api/content/surveys/route.ts
import { ZodError } from 'zod';
import { firstIssueMessage } from '@/modules/content/validation';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { requirePermission } from '@/lib/auth/permissions';
import { ContentPermissions } from '@/modules/content/permissions';
import { createSurveySchema } from '@/modules/content/validation';
import { surveysService } from '@/modules/content';
import { SurveyStatusEnum, type SurveyStatus } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

const VALID_STATUSES = Object.values(SurveyStatusEnum) as string[];

function parseStatus(raw: string | null): SurveyStatus | undefined {
  if (!raw) return undefined;
  const normalized = raw.trim().toUpperCase();
  if (!VALID_STATUSES.includes(normalized)) {
    throw new Error(
      `Invalid status "${raw}". Expected one of: ${VALID_STATUSES.join(', ')}`,
    );
  }
  return normalized as SurveyStatus;
}

function parsePositiveInt(raw: string | null, fallback: number): number {
  const parsed = parseInt(raw ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

// Category isn't a fixed enum in the schema (it's a free-text column based on
// the seed data), so we just normalize case rather than hard-validate it.
// If you do have a SurveyCategoryEnum exported from '@/lib/db/schema', swap
// this for the same validate-against-enum pattern as parseStatus.
function parseCategory(raw: string | null): string | undefined {
  if (!raw) return undefined;
  return raw.trim().toUpperCase();
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';
    const brand = searchParams.get('brand') || undefined;
    const category = parseCategory(searchParams.get('category'));
    const search = searchParams.get('search') || undefined;
    const page = parsePositiveInt(searchParams.get('page'), 1);
    const limit = Math.min(
      parsePositiveInt(searchParams.get('limit'), 20),
      100,
    );

    let status: SurveyStatus | undefined;
    try {
      status = parseStatus(searchParams.get('status'));
    } catch (validationError) {
      return NextResponse.json(
        { error: (validationError as Error).message },
        { status: 400 },
      );
    }

    // Fast-path only applies when there's no additional filtering requested —
    // category/brand/search need the full query, not the lightweight one.
    // Users (earn page): active surveys only, with their completion state and
    // quota stats. Filtering happens in memory, so no admin permission needed.
    const wantsActiveOnly = activeOnly || status === SurveyStatusEnum.ACTIVE;
    if (wantsActiveOnly && !brand) {
      return NextResponse.json(
        await surveysService.listForUser({ category, search }),
      );
    }

    // Full list (drafts, every plan) is for content admins only. Members hold
    // surveys.read too, so check the admin-only update permission.
    await requirePermission(ContentPermissions.SURVEYS_UPDATE);

    const result = await surveysService.getSurveys({
      brand,
      category,
      search,
      status: status ?? (wantsActiveOnly ? SurveyStatusEnum.ACTIVE : undefined),
      page,
      limit,
    });

    return NextResponse.json({
      surveys: result.surveys,
      total: result.total,
      page,
      limit,
    });
  } catch (error) {
    console.error('Surveys GET error:', error);
    // Validation problems: one clear sentence and a 400, not raw JSON.
    if (error instanceof ZodError) {
      return NextResponse.json({ error: firstIssueMessage(error) }, { status: 400 });
    }
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: message.startsWith('Forbidden') ? 403 : 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission(ContentPermissions.SURVEYS_CREATE);

    const body = await request.json();
    const validated = createSurveySchema.parse(body);

    const survey = await surveysService.createSurvey(validated);

    return NextResponse.json({ survey }, { status: 201 });
  } catch (error) {
    console.error('Surveys POST error:', error);
    // Validation problems: one clear sentence and a 400, not raw JSON.
    if (error instanceof ZodError) {
      return NextResponse.json({ error: firstIssueMessage(error) }, { status: 400 });
    }
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: message.startsWith('Forbidden') ? 403 : 500 },
    );
  }
}

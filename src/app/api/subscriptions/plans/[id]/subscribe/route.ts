// src/app/api/subscriptions/plans/[id]/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { badgesService } from '@/modules/badges/service';
import { subscribeToPlanSchema } from '@/modules/badges/validation';

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
    const validated = subscribeToPlanSchema.parse({
      ...body,
      planId: params.id,
    });

    const result = await badgesService.subscribeToPlan(validated);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Subscribe to plan error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

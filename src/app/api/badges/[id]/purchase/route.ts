// src/app/api/badges/[id]/purchase/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { badgesService } from '@/modules/badges/service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await badgesService.purchaseBadge({
      badgeId: params.id,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Badge purchase error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

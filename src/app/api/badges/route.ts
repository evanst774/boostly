// src/app/api/badges/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { requirePermission } from '@/lib/auth/permissions';
import { badgesService } from '@/modules/badges/service';
import { BadgesPermissions } from '@/modules/badges/permissions';
import { createBadgeSchema } from '@/modules/badges/validation';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const badges = await badgesService.getAllBadges();

    return NextResponse.json({ badges });
  } catch (error) {
    console.error('Badges GET error:', error);
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

    await requirePermission(BadgesPermissions.CREATE);

    const body = await request.json();
    const validated = createBadgeSchema.parse(body);

    const badge = await badgesService.createBadge(validated);

    return NextResponse.json({ badge }, { status: 201 });
  } catch (error) {
    console.error('Badge POST error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

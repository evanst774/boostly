// src/app/api/user/preferences/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth/session.server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { normalizePreferences } from '@/lib/constants/preferences';

export const dynamic = 'force-dynamic';

/** Save the member's preferences (unknown keys are ignored). */
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    const preferences = normalizePreferences(body);
    await db
      .update(users)
      .set({ preferences: { ...preferences }, updatedAt: new Date().toISOString() })
      .where(eq(users.id, user.id));
    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Preferences PUT error:', error);
    return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 });
  }
}

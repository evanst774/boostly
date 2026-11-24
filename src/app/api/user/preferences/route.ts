// src/app/api/user/preferences/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth/session.server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { normalizePreferences } from '@/lib/constants/preferences';
import { detectMobileProvider, normalizeRwandaPhone } from '@/lib/constants/payouts';

export const dynamic = 'force-dynamic';

/** Save the member's preferences (unknown keys are ignored). */
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    // Merge with what's stored: saving one tab never wipes another's settings.
    const row = await db.query.users.findFirst({ where: eq(users.id, user.id), columns: { preferences: true } });
    const merged = { ...normalizePreferences(row?.preferences), ...body };

    // Default payout number: must be a valid MTN or Airtel Rwanda number.
    if (typeof body.payoutPhone === 'string' && body.payoutPhone.trim()) {
      const phone = normalizeRwandaPhone(body.payoutPhone);
      if (!phone || !detectMobileProvider(phone)) {
        return NextResponse.json({ error: 'Enter a valid MTN or Airtel number (e.g. 078 123 4567).' }, { status: 400 });
      }
      merged.payoutPhone = phone;
    }
    if ('payoutName' in body && typeof body.payoutName === 'string' && body.payoutName.trim().length > 0 && body.payoutName.trim().length < 2) {
      return NextResponse.json({ error: 'Enter the name on the mobile money account.' }, { status: 400 });
    }
    const preferences = normalizePreferences(merged);
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

// src/app/api/user/settings/route.ts
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth/session.server';
import { db } from '@/lib/db';
import { users, wallets } from '@/lib/db/schema';
import { normalizePreferences } from '@/lib/constants/preferences';

export const dynamic = 'force-dynamic';

/** Data for the Settings screen: saved preferences + total earned. */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const [row, wallet] = await Promise.all([
      db.query.users.findFirst({ where: eq(users.id, user.id), columns: { preferences: true } }),
      db.query.wallets.findFirst({ where: eq(wallets.userId, user.id), columns: { totalEarned: true } }),
    ]);
    return NextResponse.json({
      preferences: normalizePreferences(row?.preferences),
      totalEarned: wallet?.totalEarned ?? 0,
    });
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

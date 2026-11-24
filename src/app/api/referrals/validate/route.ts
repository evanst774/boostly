// GET /api/referrals/validate?code=ABCD1234
//
// Public: used on the sign-up form before an account exists. Uses the same
// lookup as sign-up itself (referralsService.attachPendingReferral), so the
// form and the server can't disagree. Returns only a masked referrer name.
// Rate-limited per visitor so codes can't be guessed in bulk.
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { referralCodes, users } from '@/lib/db/schema';
import { publicDisplayName } from '@/lib/privacy';

export const dynamic = 'force-dynamic';

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;
const hits = new Map<string, { n: number; since: number }>();

function limited(key: string) {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || now - h.since > WINDOW_MS) {
    hits.set(key, { n: 1, since: now });
    if (hits.size > 5000) hits.clear();
    return false;
  }
  h.n += 1;
  return h.n > MAX_PER_WINDOW;
}

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (limited(ip)) {
    return NextResponse.json({ valid: false, error: 'Too many checks. Try again in a minute.' }, { status: 429 });
  }

  const code = (request.nextUrl.searchParams.get('code') || '').toUpperCase().trim();
  if (!/^[A-Z0-9_-]{4,32}$/.test(code)) {
    return NextResponse.json({ valid: false });
  }

  try {
    const row = await db
      .select({ isActive: referralCodes.isActive, name: users.name })
      .from(referralCodes)
      .leftJoin(users, eq(users.id, referralCodes.userId))
      .where(eq(referralCodes.code, code))
      .limit(1);
    const hit = row[0];
    if (!hit || !hit.isActive) return NextResponse.json({ valid: false });
    return NextResponse.json({ valid: true, referrer: publicDisplayName(hit.name) });
  } catch (error) {
    console.error('Referral validate error:', error);
    return NextResponse.json({ valid: false, error: 'Could not check the code' }, { status: 500 });
  }
}

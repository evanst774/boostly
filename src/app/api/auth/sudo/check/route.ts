// src/app/api/auth/sudo/check/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { db } from '@/lib/db';
import { sudoSessions } from '@/lib/db/schema/auth';
import { eq, and, gt } from 'drizzle-orm';
import { SUDO_CONFIG } from '@/lib/constants/sudo';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await db.query.sudoSessions.findFirst({
      where: and(
        eq(sudoSessions.userId, user.id),
        eq(sudoSessions.isVerified, true),
        gt(sudoSessions.expiresAt, new Date().toISOString()),
      ),
    });

    if (!session) {
      return NextResponse.json({
        isActive: false,
        message: 'No active sudo session',
      });
    }

    const now = Date.now();
    const expiresAt = new Date(session.expiresAt).getTime();
    const remainingTime = Math.max(0, expiresAt - now);
    const remainingMinutes = Math.ceil(remainingTime / 60000);

    return NextResponse.json({
      isActive: true,
      expiresAt: session.expiresAt,
      remainingTime,
      remainingMinutes,
      isExpiringSoon:
        remainingMinutes < SUDO_CONFIG.EXPIRING_SOON_THRESHOLD_MINUTES,
    });
  } catch (error) {
    console.error('Sudo check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

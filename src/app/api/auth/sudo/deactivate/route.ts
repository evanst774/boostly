// src/app/api/auth/sudo/deactivate/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { db } from '@/lib/db';
import { sudoSessions } from '@/lib/db/schema/auth';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete all active sudo sessions for this user
    await db
      .delete(sudoSessions)
      .where(
        and(
          eq(sudoSessions.userId, user.id),
          eq(sudoSessions.isVerified, true),
        ),
      );

    return NextResponse.json({
      success: true,
      message: 'Sudo mode deactivated',
    });
  } catch (error) {
    console.error('Sudo deactivate error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

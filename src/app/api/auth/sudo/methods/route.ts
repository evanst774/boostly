// src/app/api/auth/sudo/methods/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRecord = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const methods: ('EMAIL' | 'TOTP')[] = [];

    // Use the twoFAEnabledMethods array — this is the source of truth for
    // which methods the user has actually completed setup for.
    const enabledMethods = (userRecord.twoFAEnabledMethods ?? []) as (
      | 'EMAIL'
      | 'TOTP'
    )[];

    if (enabledMethods.includes('EMAIL') && userRecord.emailVerifiedAt) {
      methods.push('EMAIL');
    }

    // TOTP requires both the method to be listed AND the secret to exist
    if (enabledMethods.includes('TOTP') && userRecord.totpSecret) {
      methods.push('TOTP');
    }

    return NextResponse.json({
      methods,
      hasAny: methods.length > 0,
      // Let the client know if 2FA is enabled at all, so it can show
      // a "set up 2FA first" message vs "no methods configured" message
      is2FAEnabled: userRecord.is2FAEnabled,
    });
  } catch (error) {
    console.error('Sudo methods error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

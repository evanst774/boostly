// src/app/api/user/2fa/totp/setup/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';
import {
  generateTOTPSecret,
  generateTOTPUri,
  generateBackupCodes,
} from '@/lib/totp';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Never replace an authenticator that is already active: the member's
    // current app would stop working before the new one is verified.
    const current = await db.query.users.findFirst({ where: eq(users.id, user.id), columns: { twoFAEnabledMethods: true } });
    const methods = Array.isArray(current?.twoFAEnabledMethods) ? current.twoFAEnabledMethods : [];
    if (methods.includes('TOTP')) {
      return NextResponse.json({ error: 'Authenticator app is already on. Turn it off first to set up a new one.' }, { status: 409 });
    }

    const secret = generateTOTPSecret();
    const uri = generateTOTPUri(user.email, 'Boostly', secret);
    const backupCodes = generateBackupCodes(10);

    await db
      .update(users)
      .set({
        totpSecret: secret,
        totpBackupCodes: JSON.stringify(backupCodes),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({ secret, uri, backupCodes });
  } catch (error) {
    console.error('Error setting up TOTP:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

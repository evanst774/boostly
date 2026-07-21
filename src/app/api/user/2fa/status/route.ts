// src/app/api/user/2fa/status/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';

type TwoFAMethod = 'EMAIL' | 'TOTP';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const record = await db
      .select({
        twoFAEnabledMethods: users.twoFAEnabledMethods,
        twoFADefaultMethod: users.twoFADefaultMethod,
        is2FAEnabled: users.is2FAEnabled,
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    const u = record[0];

    let enabled: TwoFAMethod[] = [];

    // Parse enabled methods from the JSON column
    if (u?.twoFAEnabledMethods && Array.isArray(u.twoFAEnabledMethods)) {
      enabled = u.twoFAEnabledMethods.filter(
        (m): m is TwoFAMethod => m === 'EMAIL' || m === 'TOTP',
      );
    }

    // Determine default method
    let defaultMethod: TwoFAMethod | null = null;
    if (
      u?.twoFADefaultMethod &&
      (u.twoFADefaultMethod === 'EMAIL' || u.twoFADefaultMethod === 'TOTP')
    ) {
      defaultMethod = u.twoFADefaultMethod as TwoFAMethod;
    } else if (enabled.length > 0) {
      defaultMethod = enabled[0];
    }

    return NextResponse.json({
      available: ['EMAIL', 'TOTP'] as TwoFAMethod[],
      enabled,
      defaultMethod,
      is2FAEnabled: u?.is2FAEnabled ?? false,
    });
  } catch (error) {
    console.error('Error checking 2FA status:', error);
    return NextResponse.json({
      available: ['EMAIL', 'TOTP'] as TwoFAMethod[],
      enabled: [] as TwoFAMethod[],
      defaultMethod: null,
      is2FAEnabled: false,
    });
  }
}

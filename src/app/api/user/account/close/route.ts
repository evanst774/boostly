// POST /api/user/account/close  { confirm: 'DELETE', password? }
//
// Closes the member's own account: it is deactivated (can't sign in), every
// session is ended, and the action is audit-logged. Records that money
// depends on (rewards, ledger, withdrawals, referrals) are kept, as the law
// and our books require. Refused while a withdrawal is still being paid.
import { NextRequest, NextResponse } from 'next/server';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { sessions, users, withdrawals, WithdrawalStatusEnum } from '@/lib/db/schema';
import { getCurrentUser } from '@/lib/auth/session.server';
import { createAuditLog } from '@/lib/audit';
import { verifyPassword } from '@/lib/db/auth-utils';
import { JWT_COOKIE_NAME } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { confirm?: string; password?: string };
  if ((body.confirm || '').trim().toUpperCase() !== 'DELETE') {
    return NextResponse.json({ error: 'Type DELETE to confirm.' }, { status: 400 });
  }

  const row = await db.query.users.findFirst({ where: eq(users.id, user.id), columns: { passwordHash: true } });
  if (row?.passwordHash) {
    const ok = body.password ? await verifyPassword(body.password, row.passwordHash) : false;
    if (!ok) return NextResponse.json({ error: 'Your password is incorrect.' }, { status: 400 });
  }

  const pending = await db.query.withdrawals.findFirst({
    where: and(
      eq(withdrawals.userId, user.id),
      inArray(withdrawals.status, [WithdrawalStatusEnum.PENDING, WithdrawalStatusEnum.PROCESSING]),
    ),
  });
  if (pending) {
    return NextResponse.json(
      { error: 'You have a withdrawal being paid. You can close your account after it is completed.' },
      { status: 409 },
    );
  }

  await db.update(users).set({ isActive: false, updatedAt: new Date().toISOString() }).where(eq(users.id, user.id));
  await db.delete(sessions).where(eq(sessions.userId, user.id));
  await createAuditLog({
    userId: user.id,
    action: 'USER_DEACTIVATED',
    entityType: 'user',
    entityId: user.id,
    newData: { closedBy: 'member' },
  }).catch(() => undefined);

  const res = NextResponse.json({ closed: true });
  res.cookies.set(JWT_COOKIE_NAME, '', { path: '/', maxAge: 0 });
  return res;
}

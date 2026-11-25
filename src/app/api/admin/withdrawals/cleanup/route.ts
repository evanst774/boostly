// POST /api/admin/withdrawals/cleanup
//   { ids: string[], confirm: 'DELETE', refundCompleted?: boolean, reason?: string }
// SUPER ADMIN ONLY. Permanently removes withdrawal records (test data) and
// reverses their wallet effect. See src/modules/wallet/withdrawal-cleanup.ts.
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { removeWithdrawals } from '@/modules/wallet/withdrawal-cleanup';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const roles = (user as { roles?: string[] }).roles ?? [];
  if (!roles.includes('SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Only a super admin can remove withdrawal records.' }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    ids?: unknown;
    confirm?: string;
    refundCompleted?: boolean;
    reason?: string;
  };
  const ids = Array.isArray(body.ids) ? body.ids.filter((x): x is string => typeof x === 'string') : [];
  if (ids.length === 0) return NextResponse.json({ error: 'Select at least one withdrawal.' }, { status: 400 });
  if ((body.confirm || '').trim().toUpperCase() !== 'DELETE') {
    return NextResponse.json({ error: 'Type DELETE to confirm.' }, { status: 400 });
  }

  const result = await removeWithdrawals(ids, user.id, {
    refundCompleted: body.refundCompleted === true,
    reason: typeof body.reason === 'string' ? body.reason.slice(0, 300) : undefined,
  });
  return NextResponse.json(result);
}

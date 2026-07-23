// src/app/api/admin/withdrawals/pending/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { requirePermission } from '@/lib/auth/permissions';
import { walletService } from '@/modules/wallet/service';
import { WalletPermissions } from '@/modules/wallet/permissions';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission(WalletPermissions.WITHDRAWALS_APPROVE);

    const withdrawals = await walletService.getPendingWithdrawals();

    return NextResponse.json({ withdrawals });
  } catch (error) {
    console.error('Pending withdrawals error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

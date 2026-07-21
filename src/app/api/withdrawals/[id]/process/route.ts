// src/app/api/admin/withdrawals/[id]/process/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { requirePermission } from '@/lib/auth/permissions';
import { walletService } from '@/modules/wallet/service';
import { WalletPermissions } from '@/modules/wallet/permissions';
import { processWithdrawalSchema } from '@/modules/wallet/validation';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission(WalletPermissions.WITHDRAWALS_PROCESS);

    const body = await request.json();
    const validated = processWithdrawalSchema.parse(body);

    const withdrawal = await walletService.processWithdrawal(
      params.id,
      validated,
    );

    return NextResponse.json({ withdrawal });
  } catch (error) {
    console.error('Process withdrawal error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// src/app/api/admin/withdrawals/[id]/approve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { requirePermission } from '@/lib/auth/permissions';
import { PermissionKeys } from '@/modules/rbac/permissions';
import { db } from '@/lib/db';
import {
  withdrawals,
  WithdrawalStatusEnum,
  wallets,
  transactions,
  TransactionTypeEnum,
  TransactionStatusEnum,
} from '@/lib/db/schema/wallet';
import { eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await requirePermission(PermissionKeys.WITHDRAWALS_APPROVE);

    const withdrawal = await db.query.withdrawals.findFirst({
      where: eq(withdrawals.id, params.id),
    });

    if (!withdrawal) {
      return NextResponse.json(
        { error: 'Withdrawal not found' },
        { status: 404 },
      );
    }

    if (withdrawal.status !== 'PENDING' && withdrawal.status !== 'PROCESSING') {
      return NextResponse.json(
        { error: 'Withdrawal cannot be approved' },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const reference =
      withdrawal.reference ?? `WD-${withdrawal.id.slice(0, 8).toUpperCase()}`;

    const updated = await db.transaction(async (tx) => {
      const [result] = await tx
        .update(withdrawals)
        .set({
          status: WithdrawalStatusEnum.COMPLETED,
          processedBy: currentUser.id,
          processedAt: now,
          completedAt: now,
          reference,
          updatedAt: now,
        })
        .where(eq(withdrawals.id, params.id))
        .returning();

      // Approval releases the hold that was placed at request time — it does
      // NOT touch `balance` again. The money already left `balance` when the
      // withdrawal was requested; this just confirms it's really gone.
      const [wallet] = await tx
        .update(wallets)
        .set({
          pendingWithdrawal: sql`MAX(0, ${wallets.pendingWithdrawal} - ${withdrawal.amount})`,
          totalWithdrawn: sql`${wallets.totalWithdrawn} + ${withdrawal.amount}`,
          updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
        })
        .where(eq(wallets.userId, withdrawal.userId))
        .returning();

      // Wallet row should always exist by this point, but don't let a missing
      // row silently skip the ledger entry.
      if (wallet) {
        await tx.insert(transactions).values({
          walletId: wallet.id,
          userId: withdrawal.userId,
          type: TransactionTypeEnum.DEBIT,
          amount: withdrawal.amount,
          currency: withdrawal.currency,
          amountInBase: withdrawal.amountInBase,
          description: `Withdrawal approved (${reference})`,
          referenceId: withdrawal.id,
          referenceType: 'withdrawal',
          status: TransactionStatusEnum.COMPLETED,
          completedAt: now,
        });
      }

      return result;
    });

    return NextResponse.json({ success: true, withdrawal: updated });
  } catch (error) {
    console.error('Approve withdrawal error:', error);
    return NextResponse.json(
      { error: 'Failed to approve withdrawal' },
      { status: 500 },
    );
  }
}

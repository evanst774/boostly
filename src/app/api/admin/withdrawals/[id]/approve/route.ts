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
import { and, eq, sql } from 'drizzle-orm';
import { notificationsService } from '@/lib/notifications';
import { emailWithdrawalPaid, inBackground } from '@/lib/mail/money-emails';

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

      // The request already wrote a PENDING debit for this withdrawal; mark it
      // COMPLETED rather than adding a second debit to the ledger. Older
      // requests without one still get a ledger entry here.
      const settled = await tx
        .update(transactions)
        .set({
          status: TransactionStatusEnum.COMPLETED,
          completedAt: now,
          updatedAt: now,
          description: `Withdrawal paid (${reference})`,
        })
        .where(
          and(
            eq(transactions.referenceId, withdrawal.id),
            eq(transactions.referenceType, 'withdrawal'),
            eq(transactions.status, TransactionStatusEnum.PENDING),
          ),
        )
        .returning({ id: transactions.id });

      if (wallet && settled.length === 0) {
        await tx.insert(transactions).values({
          walletId: wallet.id,
          userId: withdrawal.userId,
          type: TransactionTypeEnum.DEBIT,
          amount: withdrawal.amount,
          currency: withdrawal.currency,
          amountInBase: withdrawal.amountInBase,
          description: `Withdrawal paid (${reference})`,
          referenceId: withdrawal.id,
          referenceType: 'withdrawal',
          status: TransactionStatusEnum.COMPLETED,
          completedAt: now,
        });
      }

      return result;
    });

    inBackground(
      emailWithdrawalPaid({
        userId: withdrawal.userId,
        amount: withdrawal.amount,
        phoneNumber: withdrawal.phoneNumber,
        reference,
      }),
    );

    await notificationsService
      .notifyWithdrawalStatus(withdrawal.userId, withdrawal.amount, 'completed')
      .catch((e) => console.error('Withdrawal notification failed:', e));

    return NextResponse.json({ success: true, withdrawal: updated });
  } catch (error) {
    console.error('Approve withdrawal error:', error);
    return NextResponse.json(
      { error: 'Failed to approve withdrawal' },
      { status: 500 },
    );
  }
}

// src/modules/wallet/service.ts
import {
  walletRepository,
  transactionsRepository,
  withdrawalsRepository,
} from './repository';
import {
  createWithdrawalSchema,
  processWithdrawalSchema,
  type CreateWithdrawalInput,
  type ProcessWithdrawalInput,
} from './validation';
import { createAuditLog } from '@/lib/audit';
import { getCurrentUser } from '@/lib/auth/session.server';
import { requirePermission } from '@/lib/auth/permissions';
import { WalletPermissions } from './permissions';
import {
  TransactionStatusEnum,
  WithdrawalStatusEnum,
  TransactionTypeEnum,
  type TransactionType,
  type TransactionStatus,
  type WithdrawalStatus,
} from '@/lib/db/schema';
import { db } from '@/lib/db';
import { wallets, withdrawals, transactions } from '@/lib/db/schema';
import { and, eq, gte, sql } from 'drizzle-orm';
import { getWithdrawalEligibility } from './withdrawal-policy';
import {
  MOBILE_MONEY_PROVIDERS,
  detectMobileProvider,
  formatRwandaPhone,
  getNextPayoutAt,
  normalizeRwandaPhone,
} from '@/lib/constants/payouts';

// ============================================
// TYPES
// ============================================

/** A user-facing problem with a withdrawal request (maps to HTTP 400). */
export class WithdrawalRequestError extends Error {}

/**
 * FIX: addBalance/deductBalance previously typed their third parameter as
 * `Omit<CreateTransactionInput, 'userId' | 'amount' | 'type'>`, which still
 * required `currency` and `amountInBase` from the caller — but neither
 * method ever reads those two fields; both hardcode
 * `currency: wallet.defaultCurrency` and `amountInBase: amount` internally
 * (see below). Same story for `status`: both methods hardcode
 * `TransactionStatusEnum.COMPLETED` regardless of what's passed in, so a
 * caller-supplied `status` was silently discarded even when the old type
 * accepted it — a footgun in its own right.
 *
 * This narrower type reflects what these two methods actually consume.
 * `badges.service.ts` calling with only `{ description, referenceId,
 * referenceType }` — no currency/amountInBase/status — is now type-correct
 * because it always was functionally correct; the old signature was simply
 * asking for more than the implementation used.
 */
export interface WalletCreditMeta {
  description?: string;
  referenceId?: string;
  referenceType?: string;
  metadata?: Record<string, unknown>;
}

// ============================================
// WALLET SERVICE
// ============================================
export class WalletService {
  async getOrCreateWallet(userId?: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const targetUserId = userId || user.id;

    if (targetUserId !== user.id) {
      await requirePermission(WalletPermissions.READ);
    }

    return await walletRepository.getOrCreate(targetUserId);
  }

  async getWalletBalance(userId?: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const targetUserId = userId || user.id;

    if (targetUserId !== user.id) {
      await requirePermission(WalletPermissions.READ);
    }

    const wallet = await walletRepository.getByUserId(targetUserId);
    return wallet?.balance || 0;
  }

  /**
   * Credits a wallet directly for non-earning money movement (e.g. refunds).
   *
   * NOT for earning activity — rewardsService.createReward() is the only
   * place that should credit a wallet for videos/games/surveys/badges/
   * subscriptions, since it also handles the multiplier and the idempotent
   * dedupe key. Calling both createReward() and addBalance() for the same
   * logical event double-credits the user; that was happening in
   * badges.service.ts's purchaseBadge() until this fix.
   */
  async addBalance(userId: string, amount: number, input: WalletCreditMeta) {
    if (amount <= 0) throw new Error('Amount must be positive');

    // Update wallet balance
    await walletRepository.updateBalance(userId, amount);

    const wallet = await walletRepository.getOrCreate(userId);

    // Create transaction
    const transaction = await transactionsRepository.create({
      userId,
      walletId: wallet.id,
      type: TransactionTypeEnum.CREDIT,
      amount,
      currency: wallet.defaultCurrency,
      amountInBase: amount,
      description: input.description || 'Balance added',
      referenceId: input.referenceId,
      referenceType: input.referenceType,
      metadata: input.metadata,
      status: TransactionStatusEnum.COMPLETED,
      completedAt: new Date().toISOString(),
    });

    return transaction;
  }

  async deductBalance(userId: string, amount: number, input: WalletCreditMeta) {
    if (amount <= 0) throw new Error('Amount must be positive');

    const wallet = await walletRepository.getByUserId(userId);
    if (!wallet || wallet.balance < amount) {
      throw new Error('Insufficient balance');
    }

    // Update wallet balance
    await walletRepository.updateBalance(userId, -amount);

    // Create transaction
    const transaction = await transactionsRepository.create({
      userId,
      walletId: wallet.id,
      type: TransactionTypeEnum.DEBIT,
      amount,
      currency: wallet.defaultCurrency,
      amountInBase: amount,
      description: input.description || 'Balance deducted',
      referenceId: input.referenceId,
      referenceType: input.referenceType,
      metadata: input.metadata,
      status: TransactionStatusEnum.COMPLETED,
      completedAt: new Date().toISOString(),
    });

    return transaction;
  }

  async getTransaction(id: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const transaction = await transactionsRepository.getById(id);
    if (!transaction) throw new Error('Transaction not found');

    if (transaction.userId !== user.id) {
      await requirePermission(WalletPermissions.MANAGE);
    }

    return transaction;
  }

  async getUserTransactions(
    userId?: string,
    filters?: {
      type?: TransactionType;
      status?: TransactionStatus;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const targetUserId = userId || user.id;

    if (targetUserId !== user.id) {
      await requirePermission(WalletPermissions.MANAGE);
    }

    return await transactionsRepository.getUserTransactions(
      targetUserId,
      filters,
    );
  }

  async getRecentTransactions(userId?: string, limit: number = 10) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const targetUserId = userId || user.id;

    if (targetUserId !== user.id) {
      await requirePermission(WalletPermissions.MANAGE);
    }

    return await transactionsRepository.getRecentTransactions(
      targetUserId,
      limit,
    );
  }

  async getWalletStats(userId?: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const targetUserId = userId || user.id;

    if (targetUserId !== user.id) {
      await requirePermission(WalletPermissions.MANAGE);
    }

    const wallet = await walletRepository.getOrCreate(targetUserId);
    return {
      balance: wallet.balance,
      totalEarned: wallet.totalEarned,
      totalWithdrawn: wallet.totalWithdrawn,
      pendingWithdrawal: wallet.pendingWithdrawal,
    };
  }

  async getSystemStats() {
    await requirePermission(WalletPermissions.MANAGE);
    return await walletRepository.getStats();
  }

  // ============================================
  // WITHDRAWALS
  // ============================================

  async createWithdrawal(input: CreateWithdrawalInput) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const validated = createWithdrawalSchema.parse(input);
    const phoneNumber = normalizeRwandaPhone(validated.phoneNumber)!;
    const provider = detectMobileProvider(phoneNumber);

    // Plan-based frequency (Free: weekly, paid: daily) + minimum balance.
    const eligibility = await getWithdrawalEligibility(user.id);
    if (!eligibility.canWithdraw) {
      throw new WithdrawalRequestError(eligibility.reason!);
    }
    if (validated.amount > eligibility.balance) {
      throw new WithdrawalRequestError(
        'Amount is more than your available balance',
      );
    }

    const now = new Date();
    const scheduledPayoutAt = getNextPayoutAt(now).toISOString();

    // Hold the money in one atomic step: the conditional UPDATE only succeeds
    // if the balance still covers the amount, so concurrent requests can't
    // overdraw. Rejection refunds it; approval just releases the hold.
    const withdrawal = await db.transaction(async (tx) => {
      const [wallet] = await tx
        .update(wallets)
        .set({
          balance: sql`${wallets.balance} - ${validated.amount}`,
          pendingWithdrawal: sql`${wallets.pendingWithdrawal} + ${validated.amount}`,
          updatedAt: now.toISOString(),
          lastActivityAt: now.toISOString(),
        })
        .where(
          and(
            eq(wallets.userId, user.id),
            gte(wallets.balance, validated.amount),
          ),
        )
        .returning();

      if (!wallet) {
        throw new WithdrawalRequestError('Insufficient balance');
      }

      const [created] = await tx
        .insert(withdrawals)
        .values({
          userId: user.id,
          amount: validated.amount,
          currency: wallet.defaultCurrency,
          amountInBase: validated.amount,
          method: 'MOBILE_MONEY',
          phoneNumber,
          accountName: validated.accountName,
          fee: 0,
          netAmount: validated.amount,
          status: WithdrawalStatusEnum.PENDING,
          requestedAt: now.toISOString(),
          metadata: { provider, scheduledPayoutAt },
        })
        .returning();

      const providerLabel = provider
        ? MOBILE_MONEY_PROVIDERS[provider].label
        : 'Mobile Money';

      await tx.insert(transactions).values({
        userId: user.id,
        walletId: wallet.id,
        type: TransactionTypeEnum.DEBIT,
        amount: validated.amount,
        currency: wallet.defaultCurrency,
        amountInBase: validated.amount,
        description: `Withdrawal to ${providerLabel} ${formatRwandaPhone(phoneNumber)}`,
        referenceId: created.id,
        referenceType: 'withdrawal',
        status: TransactionStatusEnum.PENDING,
      });

      return created;
    });

    await createAuditLog({
      userId: user.id,
      action: 'WITHDRAWAL_REQUESTED',
      entityType: 'withdrawal',
      entityId: withdrawal.id,
      newData: {
        amount: validated.amount,
        method: 'MOBILE_MONEY',
        provider,
        scheduledPayoutAt,
      },
    });

    return withdrawal;
  }

  async getWithdrawal(id: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const withdrawal = await withdrawalsRepository.getById(id);
    if (!withdrawal) throw new Error('Withdrawal not found');

    if (withdrawal.userId !== user.id) {
      await requirePermission(WalletPermissions.WITHDRAWALS_APPROVE);
    }

    return withdrawal;
  }

  async getUserWithdrawals(
    userId?: string,
    filters?: {
      status?: WithdrawalStatus;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const targetUserId = userId || user.id;

    if (targetUserId !== user.id) {
      await requirePermission(WalletPermissions.WITHDRAWALS_APPROVE);
    }

    return await withdrawalsRepository.getUserWithdrawals(
      targetUserId,
      filters,
    );
  }

  async processWithdrawal(id: string, input: ProcessWithdrawalInput) {
    await requirePermission(WalletPermissions.WITHDRAWALS_PROCESS);
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const validated = processWithdrawalSchema.parse(input);

    const withdrawal = await withdrawalsRepository.getById(id);
    if (!withdrawal) throw new Error('Withdrawal not found');

    if (withdrawal.status !== WithdrawalStatusEnum.PENDING) {
      throw new Error('Withdrawal is not in pending state');
    }

    let updated;

    if (validated.action === 'approve') {
      // Approve withdrawal
      updated = await withdrawalsRepository.updateStatus(
        id,
        WithdrawalStatusEnum.PROCESSING,
        user.id,
      );

      // Update transaction status - find by referenceId
      // Since getByReferenceId doesn't exist, we'll query all transactions and filter
      const userTransactions = await transactionsRepository.getUserTransactions(
        withdrawal.userId,
        {
          limit: 100, // Get enough to find the matching one
        },
      );

      const matchingTransaction = userTransactions.transactions.find(
        (t) => t.referenceId === id && t.referenceType === 'withdrawal',
      );

      if (matchingTransaction) {
        await transactionsRepository.updateStatus(
          matchingTransaction.id,
          TransactionStatusEnum.COMPLETED,
        );
      }

      // Update wallet
      await walletRepository.updateWithdrawn(
        withdrawal.userId,
        withdrawal.amount,
      );

      await createAuditLog({
        userId: user.id,
        action: 'WITHDRAWAL_APPROVED',
        entityType: 'withdrawal',
        entityId: id,
        newData: { processedBy: user.id },
      });
    } else if (validated.action === 'reject') {
      // Reject withdrawal
      updated = await withdrawalsRepository.updateFailed(
        id,
        validated.reason || 'Rejected by admin',
      );

      // Find and update transaction status
      const userTransactions = await transactionsRepository.getUserTransactions(
        withdrawal.userId,
        {
          limit: 100,
        },
      );

      const matchingTransaction = userTransactions.transactions.find(
        (t) => t.referenceId === id && t.referenceType === 'withdrawal',
      );

      if (matchingTransaction) {
        await transactionsRepository.updateStatus(
          matchingTransaction.id,
          TransactionStatusEnum.FAILED,
        );
      }

      // Release the hold and refund: the amount left `balance` at request time.
      await db
        .update(wallets)
        .set({
          pendingWithdrawal: sql`MAX(0, ${wallets.pendingWithdrawal} - ${withdrawal.amount})`,
          balance: sql`${wallets.balance} + ${withdrawal.amount}`,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(wallets.userId, withdrawal.userId));

      await createAuditLog({
        userId: user.id,
        action: 'WITHDRAWAL_REJECTED',
        entityType: 'withdrawal',
        entityId: id,
        newData: { reason: validated.reason },
      });
    }

    return updated;
  }

  async completeWithdrawal(id: string) {
    await requirePermission(WalletPermissions.WITHDRAWALS_PROCESS);
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const withdrawal = await withdrawalsRepository.getById(id);
    if (!withdrawal) throw new Error('Withdrawal not found');

    if (withdrawal.status !== WithdrawalStatusEnum.PROCESSING) {
      throw new Error('Withdrawal is not in processing state');
    }

    const updated = await withdrawalsRepository.updateStatus(
      id,
      WithdrawalStatusEnum.COMPLETED,
      user.id,
    );

    await createAuditLog({
      userId: user.id,
      action: 'WITHDRAWAL_COMPLETED',
      entityType: 'withdrawal',
      entityId: id,
      newData: { completedBy: user.id },
    });

    return updated;
  }

  async getPendingWithdrawals() {
    await requirePermission(WalletPermissions.WITHDRAWALS_APPROVE);
    return await withdrawalsRepository.getPendingWithdrawals();
  }

  async getWithdrawalStats() {
    await requirePermission(WalletPermissions.WITHDRAWALS_READ);
    return await withdrawalsRepository.getStats();
  }
}

// ============================================
// EXPORT SERVICES
// ============================================
export const walletService = new WalletService();

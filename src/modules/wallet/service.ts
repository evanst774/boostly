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

// ============================================
// TYPES
// ============================================

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

    // Check balance
    const wallet = await walletRepository.getByUserId(user.id);
    if (!wallet || wallet.balance < validated.amount) {
      throw new Error('Insufficient balance');
    }

    // Check minimum withdrawal
    if (validated.amount < 1000) {
      throw new Error('Minimum withdrawal is Rwf 1,000');
    }

    // Create withdrawal request
    const withdrawal = await withdrawalsRepository.create({
      userId: user.id,
      amount: validated.amount,
      currency: wallet.defaultCurrency,
      amountInBase: validated.amount,
      method: validated.method,
      phoneNumber: validated.phoneNumber,
      bankAccount: validated.bankAccount,
      accountName: validated.accountName,
      bankName: validated.bankName,
      status: WithdrawalStatusEnum.PENDING,
      requestedAt: new Date().toISOString(),
    });

    // Update wallet pending withdrawal
    await walletRepository.updatePendingWithdrawal(user.id, validated.amount);

    // Create transaction (pending)
    await transactionsRepository.create({
      userId: user.id,
      walletId: wallet.id,
      type: TransactionTypeEnum.DEBIT,
      amount: validated.amount,
      currency: wallet.defaultCurrency,
      amountInBase: validated.amount,
      description: `Withdrawal request - ${validated.method}`,
      referenceId: withdrawal.id,
      referenceType: 'withdrawal',
      status: TransactionStatusEnum.PENDING,
    });

    // Correct
    await createAuditLog({
      userId: user.id,
      action: 'WITHDRAWAL_REQUESTED',
      entityType: 'withdrawal',
      entityId: withdrawal.id,
      newData: { amount: validated.amount, method: validated.method },
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

      // Revert pending withdrawal
      const wallet = await walletRepository.getByUserId(withdrawal.userId);
      if (wallet) {
        await walletRepository.updatePendingWithdrawal(
          withdrawal.userId,
          -withdrawal.amount,
        );
      }

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

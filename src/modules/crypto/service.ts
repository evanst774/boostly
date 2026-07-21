// src/modules/crypto/service.ts
import {
  cryptoCurrenciesRepository,
  cryptoWalletsRepository,
  cryptoDepositsRepository,
  cryptoWithdrawalsRepository,
  cryptoRatesRepository,
} from './repository';
import {
  createCurrencySchema,
  updateCurrencySchema,
  createDepositSchema,
  processDepositSchema,
  createWithdrawalSchema,
  processWithdrawalSchema,
  type CreateCurrencyInput,
  type UpdateCurrencyInput,
  type CreateDepositInput,
  type ProcessDepositInput,
  type CreateWithdrawalInput,
  type ProcessWithdrawalInput,
} from './validation';
import { CryptoPermissions } from './permissions';
import { AuditHelpers } from '@/lib/audit';
import { getCurrentUser } from '@/lib/auth/session.server';
import { requirePermission } from '@/lib/auth/permissions';
import { walletService } from '@/modules/wallet/service';
import {
  type CryptoCurrencyType,
  type CryptoDepositStatus,
  type CryptoWithdrawalStatus,
} from '@/lib/db/schema/crypto';

// ============================================
// CRYPTO SERVICE
// ============================================
export class CryptoService {
  // ============================================
  // CURRENCIES
  // ============================================

  async createCurrency(input: CreateCurrencyInput) {
    await requirePermission(CryptoPermissions.CURRENCIES_CREATE);
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const validated = createCurrencySchema.parse(input);

    // Check if currency already exists
    const existing = await cryptoCurrenciesRepository.getBySymbol(
      validated.symbol,
    );
    if (existing)
      throw new Error(`Currency ${validated.symbol} already exists`);

    const currency = await cryptoCurrenciesRepository.create(validated);

    await AuditHelpers.logCryptoCurrencyCreated(user.id, currency.id, currency);

    return currency;
  }

  async getCurrencies() {
    await requirePermission(CryptoPermissions.CURRENCIES_READ);
    return await cryptoCurrenciesRepository.getAll();
  }

  async getActiveCurrencies() {
    return await cryptoCurrenciesRepository.getActive();
  }

  async updateCurrency(id: string, input: UpdateCurrencyInput) {
    await requirePermission(CryptoPermissions.CURRENCIES_UPDATE);
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const validated = updateCurrencySchema.parse(input);
    const existing = await cryptoCurrenciesRepository.getById(id);
    if (!existing) throw new Error('Currency not found');

    const updated = await cryptoCurrenciesRepository.update(id, validated);

    await AuditHelpers.logCryptoCurrencyUpdated(
      user.id,
      id,
      existing,
      updated || {},
    );

    return updated;
  }

  async deleteCurrency(id: string) {
    await requirePermission(CryptoPermissions.CURRENCIES_DELETE);
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const existing = await cryptoCurrenciesRepository.getById(id);
    if (!existing) throw new Error('Currency not found');

    await cryptoCurrenciesRepository.delete(id);

    await AuditHelpers.logCryptoCurrencyDeleted(user.id, id, existing);

    return { success: true };
  }

  // ============================================
  // WALLETS
  // ============================================

  async getOrCreateWallet(userId: string, currency: CryptoCurrencyType) {
    return await cryptoWalletsRepository.getOrCreate(userId, currency);
  }

  async getUserWallets(userId?: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const targetUserId = userId || user.id;
    if (targetUserId !== user.id) {
      await requirePermission(CryptoPermissions.WALLET_READ);
    }

    const wallets = await cryptoWalletsRepository.getByUserId(targetUserId);

    // Get rates for USD conversion
    const rates = await cryptoRatesRepository.getAll();
    const rateMap = rates.reduce(
      (acc, r) => {
        acc[r.currency] = r.usdRate;
        return acc;
      },
      {} as Record<string, number>,
    );

    return wallets.map((w) => ({
      ...w,
      usdBalance: w.balance * (rateMap[w.currency] || 0),
    }));
  }

  async getWalletBalance(userId: string, currency: CryptoCurrencyType) {
    const wallet = await cryptoWalletsRepository.getByUserAndCurrency(
      userId,
      currency,
    );
    if (!wallet) return { balance: 0, locked: 0 };

    const rate = await cryptoRatesRepository.getRateInUSD(currency);

    return {
      balance: wallet.balance,
      locked: wallet.lockedBalance,
      usdBalance: wallet.balance * rate,
    };
  }

  async getTotalWalletBalance(userId: string) {
    const wallets = await cryptoWalletsRepository.getByUserId(userId);
    const rates = await cryptoRatesRepository.getAll();
    const rateMap = rates.reduce(
      (acc, r) => {
        acc[r.currency] = r.usdRate;
        return acc;
      },
      {} as Record<string, number>,
    );

    let totalUSD = 0;
    const balances: Record<string, { balance: number; usd: number }> = {};

    for (const wallet of wallets) {
      const usd = wallet.balance * (rateMap[wallet.currency] || 0);
      totalUSD += usd;
      balances[wallet.currency] = {
        balance: wallet.balance,
        usd,
      };
    }

    return { totalUSD, balances };
  }

  // ============================================
  // DEPOSITS
  // ============================================

  async createDeposit(input: CreateDepositInput) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const validated = createDepositSchema.parse(input);

    // Get currency config
    const currency = await cryptoCurrenciesRepository.getBySymbol(
      validated.currency,
    );
    if (!currency) throw new Error('Currency not supported');
    if (!currency.isDepositEnabled)
      throw new Error('Deposits are currently disabled for this currency');

    // Get or create wallet
    const wallet = await cryptoWalletsRepository.getOrCreate(
      user.id,
      validated.currency,
    );

    // Calculate fees
    const fee = currency.depositFee || 0;
    const netAmount = validated.amount - fee;

    // Get USD rate
    const usdRate = await cryptoRatesRepository.getRateInUSD(
      validated.currency,
    );

    // Create deposit record
    const deposit = await cryptoDepositsRepository.create({
      userId: user.id,
      walletId: wallet.id,
      currency: validated.currency,
      amount: validated.amount,
      usdAmount: validated.amount * usdRate,
      fee,
      netAmount,
      fromAddress: validated.fromAddress,
      txHash: validated.txHash,
      toAddress: wallet.address,
      status: 'PENDING',
      requiredConfirmations: currency.confirmationsRequired || 3,
      confirmations: 0,
    });

    // Lock the amount in wallet
    await cryptoWalletsRepository.updateLockedBalance(
      wallet.id,
      validated.amount,
      'add',
    );

    await AuditHelpers.logCryptoDepositCreated(user.id, deposit.id, deposit);

    return deposit;
  }

  async getUserDeposits(
    userId?: string,
    filters?: {
      status?: CryptoDepositStatus;
      currency?: CryptoCurrencyType;
      limit?: number;
      offset?: number;
    },
  ) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const targetUserId = userId || user.id;
    if (targetUserId !== user.id) {
      await requirePermission(CryptoPermissions.DEPOSITS_READ);
    }

    return await cryptoDepositsRepository.getUserDeposits(
      targetUserId,
      filters,
    );
  }

  async processDeposit(id: string, input: ProcessDepositInput) {
    await requirePermission(CryptoPermissions.DEPOSITS_PROCESS);
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const validated = processDepositSchema.parse(input);
    const deposit = await cryptoDepositsRepository.getById(id);
    if (!deposit) throw new Error('Deposit not found');
    if (deposit.status !== 'PENDING') throw new Error('Deposit is not pending');

    let updated;

    if (validated.action === 'approve') {
      // Approve deposit
      updated = await cryptoDepositsRepository.updateStatus(
        id,
        'COMPLETED',
        user.id,
      );

      // Update wallet balance
      await cryptoWalletsRepository.updateBalance(
        deposit.walletId,
        deposit.netAmount,
        'add',
      );

      // Unlock the amount
      await cryptoWalletsRepository.updateLockedBalance(
        deposit.walletId,
        deposit.amount,
        'subtract',
      );

      // Add to main wallet (FIAT equivalent)
      await walletService.addBalance(deposit.userId, deposit.usdAmount, {
        description: `Crypto deposit: ${deposit.amount} ${deposit.currency}`,
        referenceId: deposit.id,
        referenceType: 'crypto_deposit',
      });

      await AuditHelpers.logCryptoDepositApproved(
        user.id,
        id,
        deposit.amount,
        deposit.currency,
      );
    } else if (validated.action === 'reject') {
      // Reject deposit
      updated = await cryptoDepositsRepository.updateStatus(
        id,
        'FAILED',
        user.id,
      );

      // Unlock the amount
      await cryptoWalletsRepository.updateLockedBalance(
        deposit.walletId,
        deposit.amount,
        'subtract',
      );

      await AuditHelpers.logCryptoDepositRejected(
        user.id,
        id,
        validated.reason || 'Rejected by admin',
      );
    }

    return updated;
  }

  async getPendingDeposits() {
    await requirePermission(CryptoPermissions.DEPOSITS_READ);
    return await cryptoDepositsRepository.getPendingDeposits();
  }

  async getDepositStats() {
    await requirePermission(CryptoPermissions.DEPOSITS_READ);
    return await cryptoDepositsRepository.getStats();
  }

  // ============================================
  // WITHDRAWALS
  // ============================================

  async createWithdrawal(input: CreateWithdrawalInput) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const validated = createWithdrawalSchema.parse(input);

    // Get currency config
    const currency = await cryptoCurrenciesRepository.getBySymbol(
      validated.currency,
    );
    if (!currency) throw new Error('Currency not supported');
    if (!currency.isWithdrawalEnabled)
      throw new Error('Withdrawals are currently disabled for this currency');

    // Get wallet
    const wallet = await cryptoWalletsRepository.getByUserAndCurrency(
      user.id,
      validated.currency,
    );
    if (!wallet) throw new Error('No wallet found for this currency');

    // Check balance
    if (wallet.balance < validated.amount) {
      throw new Error('Insufficient balance');
    }

    // Check minimum
    if (currency.minWithdrawal && validated.amount < currency.minWithdrawal) {
      throw new Error(
        `Minimum withdrawal is ${currency.minWithdrawal} ${validated.currency}`,
      );
    }

    // Check maximum
    if (currency.maxWithdrawal && validated.amount > currency.maxWithdrawal) {
      throw new Error(
        `Maximum withdrawal is ${currency.maxWithdrawal} ${validated.currency}`,
      );
    }

    // Calculate fees
    const fee = currency.withdrawalFee || 0;
    const netAmount = validated.amount - fee;

    // Get USD rate
    const usdRate = await cryptoRatesRepository.getRateInUSD(
      validated.currency,
    );

    // Create withdrawal record
    const withdrawal = await cryptoWithdrawalsRepository.create({
      userId: user.id,
      walletId: wallet.id,
      currency: validated.currency,
      amount: validated.amount,
      usdAmount: validated.amount * usdRate,
      fee,
      netAmount,
      toAddress: validated.toAddress,
      memo: validated.memo || null,
      status: 'PENDING',
    });

    // Lock the amount
    await cryptoWalletsRepository.updateLockedBalance(
      wallet.id,
      validated.amount,
      'add',
    );

    await AuditHelpers.logCryptoWithdrawalCreated(
      user.id,
      withdrawal.id,
      withdrawal,
    );

    return withdrawal;
  }

  async getUserWithdrawals(
    userId?: string,
    filters?: {
      status?: CryptoWithdrawalStatus;
      currency?: CryptoCurrencyType;
      limit?: number;
      offset?: number;
    },
  ) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const targetUserId = userId || user.id;
    if (targetUserId !== user.id) {
      await requirePermission(CryptoPermissions.WITHDRAWALS_READ);
    }

    return await cryptoWithdrawalsRepository.getUserWithdrawals(
      targetUserId,
      filters,
    );
  }

  async processWithdrawal(id: string, input: ProcessWithdrawalInput) {
    await requirePermission(CryptoPermissions.WITHDRAWALS_PROCESS);
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const validated = processWithdrawalSchema.parse(input);
    const withdrawal = await cryptoWithdrawalsRepository.getById(id);
    if (!withdrawal) throw new Error('Withdrawal not found');
    if (withdrawal.status !== 'PENDING')
      throw new Error('Withdrawal is not pending');

    let updated;

    if (validated.action === 'approve') {
      updated = await cryptoWithdrawalsRepository.updateStatus(
        id,
        'PROCESSING',
        user.id,
      );

      await AuditHelpers.logCryptoWithdrawalApproved(
        user.id,
        id,
        withdrawal.amount,
        withdrawal.currency,
      );
    } else if (validated.action === 'process') {
      // Process the withdrawal (send to blockchain)
      updated = await cryptoWithdrawalsRepository.updateStatus(
        id,
        'COMPLETED',
        user.id,
      );

      // Update wallet balance (subtract)
      await cryptoWalletsRepository.updateBalance(
        withdrawal.walletId,
        withdrawal.amount,
        'subtract',
      );

      // Unlock the amount
      await cryptoWalletsRepository.updateLockedBalance(
        withdrawal.walletId,
        withdrawal.amount,
        'subtract',
      );

      // Update tx hash if provided
      if (validated.txHash) {
        await cryptoWithdrawalsRepository.updateTxHash(id, validated.txHash);
      }

      await AuditHelpers.logCryptoWithdrawalProcessed(
        user.id,
        id,
        withdrawal.amount,
        withdrawal.currency,
      );
    } else if (validated.action === 'reject') {
      updated = await cryptoWithdrawalsRepository.updateFailed(
        id,
        validated.reason || 'Rejected by admin',
      );

      // Unlock the amount
      await cryptoWalletsRepository.updateLockedBalance(
        withdrawal.walletId,
        withdrawal.amount,
        'subtract',
      );

      await AuditHelpers.logCryptoWithdrawalRejected(
        user.id,
        id,
        validated.reason || 'Rejected by admin',
      );
    }

    return updated;
  }

  async getPendingWithdrawals() {
    await requirePermission(CryptoPermissions.WITHDRAWALS_READ);
    return await cryptoWithdrawalsRepository.getPendingWithdrawals();
  }

  async getWithdrawalStats() {
    await requirePermission(CryptoPermissions.WITHDRAWALS_READ);
    return await cryptoWithdrawalsRepository.getStats();
  }

  // ============================================
  // RATES
  // ============================================

  async getRates() {
    return await cryptoRatesRepository.getAll();
  }

  async updateRates(
    rates: Array<{
      currency: CryptoCurrencyType;
      usdRate: number;
      change24h?: number;
      marketCap?: number;
    }>,
  ) {
    await requirePermission(CryptoPermissions.RATES_UPDATE);
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    await cryptoRatesRepository.updateRates(rates);

    await AuditHelpers.logCryptoRatesUpdated(user.id, rates);

    return rates;
  }

  async convertToUSD(currency: CryptoCurrencyType, amount: number) {
    const rate = await cryptoRatesRepository.getRateInUSD(currency);
    return amount * rate;
  }

  async convertFromUSD(currency: CryptoCurrencyType, usdAmount: number) {
    const rate = await cryptoRatesRepository.getRateInUSD(currency);
    if (rate === 0) throw new Error('Rate not available');
    return usdAmount / rate;
  }

  // ============================================
  // ADMIN STATS
  // ============================================

  async getAdminStats() {
    await requirePermission(CryptoPermissions.CURRENCIES_READ);

    const [currencies, rates, deposits, withdrawals] = await Promise.all([
      cryptoCurrenciesRepository.getAll(),
      cryptoRatesRepository.getAll(),
      cryptoDepositsRepository.getStats(),
      cryptoWithdrawalsRepository.getStats(),
    ]);

    return {
      currencies: {
        total: currencies.length,
        active: currencies.filter((c) => c.isActive).length,
      },
      rates: rates.length,
      deposits,
      withdrawals,
    };
  }
}

// ============================================
// EXPORT SERVICES
// ============================================
export const cryptoService = new CryptoService();

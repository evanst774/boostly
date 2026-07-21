// src/services/unified-wallet.service.ts

import { walletService } from '@/modules/wallet/service';
import { cryptoService } from '@/modules/crypto/service';
import { transactionsRepository } from '@/modules/wallet/repository';
import { exchangeRates } from '@/lib/db/schema/wallet';
import { cryptoDeposits, cryptoWithdrawals } from '@/lib/db/schema/crypto';
import { FiatCurrencyType, FIAT_CURRENCY_INFO } from '@/lib/db/schema/currency';
import { TransactionStatusEnum } from '@/lib/db/schema/wallet';
import { db } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';

export interface UnifiedWalletDTO {
  fiat: {
    balance: number;
    currency: string;
    totalEarned: number;
    totalWithdrawn: number;
    pendingWithdrawal: number;
  };
  crypto: Array<{
    currency: string;
    balance: number;
    address: string;
    network: string;
    usdValue: number;
    localValue: number;
    isDefault: boolean;
    totalDeposited: number;
    totalWithdrawn: number;
  }>;
  totals: {
    totalBalanceLocal: number;
    totalBalanceUSD: number;
    totalEarnedLocal: number;
    totalWithdrawnLocal: number;
    pendingWithdrawalLocal: number;
    cryptoTotalUSD: number;
    cryptoTotalLocal: number;
  };
  rates: Array<{
    currency: string;
    usdRate: number;
    localRate: number;
    change24h: number;
  }>;
  supportedCurrencies: Array<{
    code: string;
    symbol: string;
    name: string;
    country: string;
  }>;
}

export interface UnifiedTransactionDTO {
  id: string;
  type: 'fiat' | 'crypto';
  category: 'credit' | 'debit';
  amount: number;
  currency: string;
  amountInLocal: number;
  description: string;
  status: string;
  referenceId?: string;
  referenceType?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  completedAt?: string;
}

export class UnifiedWalletService {
  /**
   * Get user's preferred currency
   */
  async getUserCurrency(userId: string): Promise<FiatCurrencyType> {
    const wallet = await walletService.getOrCreateWallet(userId);
    return (wallet.defaultCurrency as FiatCurrencyType) || 'RWF';
  }

  /**
   * Get exchange rates for a specific currency
   */
  async getExchangeRates(
    baseCurrency: FiatCurrencyType = 'USD',
  ): Promise<Record<string, number>> {
    const rates = await db.query.exchangeRates.findMany({
      where: eq(exchangeRates.baseCurrency, baseCurrency),
    });

    return rates.reduce(
      (acc, r) => {
        acc[r.targetCurrency] = r.rate;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  /**
   * Convert amount between currencies
   */
  async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
  ): Promise<number> {
    if (fromCurrency === toCurrency) return amount;

    // Get rates in USD base
    const rates = await this.getExchangeRates('USD');
    const fromRate = rates[fromCurrency] || 1;
    const toRate = rates[toCurrency] || 1;

    // Convert to USD first, then to target
    const usdAmount = amount / fromRate;
    return usdAmount * toRate;
  }

  /**
   * Get unified wallet for a user
   */
  async getUnifiedWallet(userId: string): Promise<UnifiedWalletDTO> {
    // 1. Get user's preferred currency
    const userCurrency = await this.getUserCurrency(userId);

    // 2. Get fiat wallet stats
    const fiatStats = await walletService.getWalletStats(userId);
    const fiatWallet = {
      balance: fiatStats.balance,
      currency: userCurrency,
      totalEarned: fiatStats.totalEarned,
      totalWithdrawn: fiatStats.totalWithdrawn,
      pendingWithdrawal: fiatStats.pendingWithdrawal,
    };

    // 3. Get crypto wallets
    const cryptoWallets = await cryptoService.getUserWallets(userId);

    // 4. Get rates
    const usdRates = await this.getExchangeRates('USD');
    const localRates = await this.getExchangeRates(userCurrency);

    // 5. Calculate crypto values
    let cryptoTotalUSD = 0;
    let cryptoTotalLocal = 0;

    const cryptoWithValues = cryptoWallets.map((w) => {
      const usdRate = usdRates[w.currency] || 0;
      const localRate = localRates[w.currency] || 0;
      const usdValue = w.balance * usdRate;
      const localValue = w.balance * localRate;
      cryptoTotalUSD += usdValue;
      cryptoTotalLocal += localValue;

      return {
        currency: w.currency,
        balance: w.balance,
        address: w.address,
        network: 'Unknown',
        usdValue,
        localValue,
        isDefault: w.isDefault || false,
        totalDeposited: w.totalDeposited || 0,
        totalWithdrawn: w.totalWithdrawn || 0,
      };
    });

    // 6. Get rates for display
    const rates = await db.query.exchangeRates.findMany({
      where: eq(exchangeRates.baseCurrency, 'USD'),
    });

    return {
      fiat: fiatWallet,
      crypto: cryptoWithValues,
      totals: {
        totalBalanceLocal: fiatWallet.balance + cryptoTotalLocal,
        totalBalanceUSD:
          fiatWallet.balance / (localRates[userCurrency] || 1) + cryptoTotalUSD,
        totalEarnedLocal: fiatWallet.totalEarned,
        totalWithdrawnLocal: fiatWallet.totalWithdrawn,
        pendingWithdrawalLocal: fiatWallet.pendingWithdrawal,
        cryptoTotalUSD,
        cryptoTotalLocal,
      },
      rates: rates.map((r) => ({
        currency: r.targetCurrency,
        usdRate: r.rate,
        localRate: localRates[r.targetCurrency] || 0,
        change24h: r.change24h || 0,
      })),
      supportedCurrencies: Object.entries(FIAT_CURRENCY_INFO).map(
        ([code, info]) => ({
          code,
          symbol: info.symbol,
          name: info.name,
          country: info.country,
        }),
      ),
    };
  }

  /**
   * Get combined transactions (fiat + crypto) in user's currency
   */
  async getCombinedTransactions(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ transactions: UnifiedTransactionDTO[]; total: number }> {
    const userCurrency = await this.getUserCurrency(userId);
    const localRates = await this.getExchangeRates(userCurrency);

    // Get fiat transactions
    const fiatResult = await transactionsRepository.getUserTransactions(
      userId,
      {
        limit,
        offset,
      },
    );

    // Get crypto deposits
    const cryptoDepositsResult = await db.query.cryptoDeposits.findMany({
      where: eq(cryptoDeposits.userId, userId),
      orderBy: [desc(cryptoDeposits.createdAt)],
      limit,
      offset,
    });

    // Get crypto withdrawals
    const cryptoWithdrawalsResult = await db.query.cryptoWithdrawals.findMany({
      where: eq(cryptoWithdrawals.userId, userId),
      orderBy: [desc(cryptoWithdrawals.createdAt)],
      limit,
      offset,
    });

    // Combine all transactions
    const allTransactions: UnifiedTransactionDTO[] = [
      // Fiat transactions
      ...fiatResult.transactions.map((tx) => ({
        id: tx.id,
        type: 'fiat' as const,
        category:
          tx.type === 'CREDIT' ? ('credit' as const) : ('debit' as const),
        amount: tx.amount,
        currency: tx.currency || 'RWF',
        amountInLocal: tx.amountInBase || tx.amount,
        description: tx.description,
        status: tx.status,
        referenceId: tx.referenceId || undefined,
        referenceType: tx.referenceType || undefined,
        metadata: tx.metadata || undefined,
        createdAt: tx.createdAt,
        completedAt: tx.completedAt || undefined,
      })),
      // Crypto deposits
      ...cryptoDepositsResult.map((d) => {
        const localRate = localRates[d.currency] || 1;
        return {
          id: d.id,
          type: 'crypto' as const,
          category: 'credit' as const,
          amount: d.amount,
          currency: d.currency,
          amountInLocal: d.amount * localRate,
          description: `Crypto Deposit: ${d.currency}`,
          status: d.status,
          referenceId: d.txHash || undefined,
          referenceType: 'crypto_deposit',
          metadata: {
            fromAddress: d.fromAddress,
            toAddress: d.toAddress,
            confirmations: d.confirmations,
          },
          createdAt: d.createdAt,
          completedAt: d.completedAt || undefined,
        };
      }),
      // Crypto withdrawals
      ...cryptoWithdrawalsResult.map((w) => {
        const localRate = localRates[w.currency] || 1;
        return {
          id: w.id,
          type: 'crypto' as const,
          category: 'debit' as const,
          amount: w.amount,
          currency: w.currency,
          amountInLocal: w.amount * localRate,
          description: `Crypto Withdrawal: ${w.currency}`,
          status: w.status,
          referenceId: w.txHash || undefined,
          referenceType: 'crypto_withdrawal',
          metadata: {
            toAddress: w.toAddress,
            fee: w.fee,
          },
          createdAt: w.createdAt,
          completedAt: w.completedAt || undefined,
        };
      }),
    ];

    // Sort by createdAt descending
    allTransactions.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return {
      transactions: allTransactions.slice(0, limit),
      total: allTransactions.length,
    };
  }

  /**
   * Get wallet stats in user's currency
   */
  async getWalletStats(userId: string): Promise<{
    todayEarnings: number;
    monthlyEarnings: number;
    totalEarnings: number;
    currency: string;
  }> {
    const userCurrency = await this.getUserCurrency(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const monthStart = new Date(today);
    monthStart.setDate(1);

    // Get fiat earnings
    const fiatToday = await this.getFiatEarnings(userId, today.toISOString());
    const fiatMonth = await this.getFiatEarnings(
      userId,
      monthStart.toISOString(),
    );
    const fiatTotal = await walletService.getWalletStats(userId);

    // Get crypto earnings (deposits)
    const cryptoToday = await this.getCryptoEarnings(
      userId,
      today.toISOString(),
      userCurrency,
    );
    const cryptoMonth = await this.getCryptoEarnings(
      userId,
      monthStart.toISOString(),
      userCurrency,
    );
    const cryptoTotal = await this.getCryptoTotalEarnings(userId, userCurrency);

    return {
      todayEarnings: fiatToday + cryptoToday,
      monthlyEarnings: fiatMonth + cryptoMonth,
      totalEarnings: fiatTotal.totalEarned + cryptoTotal,
      currency: userCurrency,
    };
  }

  private async getFiatEarnings(
    userId: string,
    fromDate: string,
  ): Promise<number> {
    const result = await db.query.transactions.findMany({
      where: (transactions, { and, eq, gte }) =>
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'CREDIT'),
          eq(transactions.status, TransactionStatusEnum.COMPLETED),
          gte(transactions.createdAt, fromDate),
        ),
    });
    return result.reduce((sum, tx) => sum + (tx.amountInBase || tx.amount), 0);
  }

  private async getCryptoEarnings(
    userId: string,
    fromDate: string,
    userCurrency: string,
  ): Promise<number> {
    const result = await db.query.cryptoDeposits.findMany({
      where: (cryptoDeposits, { and, eq, gte }) =>
        and(
          eq(cryptoDeposits.userId, userId),
          eq(cryptoDeposits.status, 'COMPLETED'),
          gte(cryptoDeposits.createdAt, fromDate),
        ),
    });

    const localRates = await this.getExchangeRates(userCurrency as FiatCurrencyType);
    return result.reduce((sum, d) => {
      const localRate = localRates[d.currency] || 0;
      return sum + d.amount * localRate;
    }, 0);
  }

  private async getCryptoTotalEarnings(
    userId: string,
    userCurrency: string,
  ): Promise<number> {
    const result = await db.query.cryptoDeposits.findMany({
      where: (cryptoDeposits, { and, eq }) =>
        and(
          eq(cryptoDeposits.userId, userId),
          eq(cryptoDeposits.status, 'COMPLETED'),
        ),
    });

    const localRates = await this.getExchangeRates(userCurrency as FiatCurrencyType);
    return result.reduce((sum, d) => {
      const localRate = localRates[d.currency] || 0;
      return sum + d.amount * localRate;
    }, 0);
  }
}

export const unifiedWalletService = new UnifiedWalletService();

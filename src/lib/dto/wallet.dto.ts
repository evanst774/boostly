// src/lib/dto/wallet.dto.ts

export interface FiatWalletDTO {
  id: string;
  userId: string;
  balance: number;
  totalEarned: number;
  totalWithdrawn: number;
  pendingWithdrawal: number;
  lastActivityAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CryptoWalletDTO {
  id: string;
  userId: string;
  currency: string;
  balance: number;
  address: string;
  network: string;
  usdValue: number;
  rwfValue: number;
  isDefault: boolean;
  totalDeposited: number;
  totalWithdrawn: number;
  lastActivityAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CryptoRateDTO {
  currency: string;
  usdRate: number;
  rwfRate: number;
  change24h: number;
  lastUpdated: string;
}

export interface UnifiedWalletDTO {
  // Fiat wallet
  fiat: FiatWalletDTO;

  // Crypto wallets (array for multiple currencies)
  crypto: CryptoWalletDTO[];

  // Combined totals
  totals: {
    totalBalanceRWF: number;
    totalBalanceUSD: number;
    totalEarnedRWF: number;
    totalWithdrawnRWF: number;
    pendingWithdrawalRWF: number;
    cryptoTotalUSD: number;
    cryptoTotalRWF: number;
  };

  // Crypto rates for display
  rates: CryptoRateDTO[];
}

export interface UnifiedTransactionDTO {
  id: string;
  type: 'fiat' | 'crypto';
  category: 'credit' | 'debit';
  amount: number;
  currency: string;
  description: string;
  status: string;
  referenceId?: string;
  referenceType?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  completedAt?: string;
}

export interface UnifiedWalletResponse {
  wallet: UnifiedWalletDTO;
  transactions: UnifiedTransactionDTO[];
  stats: {
    todayEarnings: number;
    monthlyEarnings: number;
    totalEarnings: number;
  };
}

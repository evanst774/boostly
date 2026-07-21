// src/lib/db/schema/index.ts

// ============================================
// CORE & SECURITY
// ============================================
export * from './users';
export * from './auth';
export * from './audit';
export * from './notifications';
export * from './company';
export * from './oauth';

// ============================================
// RBAC
// ============================================
export * from './rbac';

// ============================================
// CURRENCY
// ============================================
export * from './currency';

// ============================================
// BOOSTLY BUSINESS MODULES
// ============================================

// Content
export * from './videos';
export * from './games';
export * from './surveys';

// Rewards & Earnings
export * from './rewards';

// Wallet (Fiat) - Multi-currency
export * from './wallet';

// Crypto
export {
  cryptoCurrencies,
  type CryptoCurrency,
  type NewCryptoCurrency,
  CryptoCurrencyEnum,
  type CryptoCurrencyType,
  CRYPTO_CURRENCY_LIST,
  CryptoNetworkEnum,
  type CryptoNetworkType,
  CRYPTO_NETWORK_LIST,
  cryptoWallets,
  type CryptoWallet,
  type NewCryptoWallet,
  cryptoDeposits,
  type CryptoDeposit,
  type NewCryptoDeposit,
  CryptoDepositStatusEnum,
  type CryptoDepositStatus,
  CRYPTO_DEPOSIT_STATUS_LIST,
  cryptoWithdrawals,
  type CryptoWithdrawal,
  type NewCryptoWithdrawal,
  CryptoWithdrawalStatusEnum,
  type CryptoWithdrawalStatus,
  CRYPTO_WITHDRAWAL_STATUS_LIST,
  cryptoRates,
  type CryptoRate,
  type NewCryptoRate,
  cryptoWalletsRelations,
  cryptoDepositsRelations,
  cryptoWithdrawalsRelations,
} from './crypto';

// Referrals
export * from './referrals';

// Badges & Subscriptions
export * from './badges';

// ============================================
// ADMIN/MONITORING
// ============================================
export * from './email';

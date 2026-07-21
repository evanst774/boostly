// src/lib/db/seeds/types.ts

import type {
  Video,
  Game,
  Survey,
  SurveyQuestion,
  Wallet,
  Transaction,
  Withdrawal,
  ExchangeRate,
  Referral,
  ReferralCode,
  Reward,
  DailyBonus,
  AdWatch,
  Badge,
  UserBadge,
  SubscriptionPlan,
  UserSubscription,
  CryptoCurrency,
  CryptoWallet,
  CryptoDeposit,
  CryptoWithdrawal,
  CryptoRate,
} from '@/lib/db/schema';
import type { User } from '@/lib/db/schema/users';
import type { Role, Permission } from '@/lib/db/schema/rbac';
import type { CompanySettings } from '@/lib/db/schema/company';
import type { SystemRole } from '@/modules/rbac/roles';
import type { PermissionKey } from '@/modules/rbac/permissions';

// Re-export types
export type {
  Video,
  Game,
  Survey,
  SurveyQuestion,
  Reward,
  DailyBonus,
  AdWatch,
  Wallet,
  Transaction,
  Withdrawal,
  ExchangeRate,
  Referral,
  ReferralCode,
  Badge,
  UserBadge,
  SubscriptionPlan,
  UserSubscription,
  CryptoCurrency,
  CryptoWallet,
  CryptoDeposit,
  CryptoWithdrawal,
  CryptoRate,
  User,
  Role,
  Permission,
  CompanySettings,
  SystemRole,
  PermissionKey,
};

// Role map type
export type RoleMap = Record<SystemRole, Role>;
export type PermissionMap = Record<PermissionKey, Permission>;

// Seed result types
export interface SeedRBACResult {
  roles: RoleMap;
  permissions: PermissionMap;
  adminUser: User;
  regularUser: User;
}

export interface SeedContentResult {
  videos: Video[];
  games: Game[];
  surveys: Survey[];
  surveyQuestions: SurveyQuestion[];
}

// Fixed name to match import
export interface SeedBadgesResult {
  badges: Badge[];
  subscriptionPlans: SubscriptionPlan[];
}

// this for backward compatibility
export interface SeedBadgesAndSubscriptionsResult {
  badges: Badge[];
  subscriptionPlans: SubscriptionPlan[];
}

export interface SeedCompanyResult {
  company: CompanySettings;
}

export interface SeedExchangeRatesResult {
  count: number;
  rates: ExchangeRate[];
}

export interface SeedCryptoResult {
  currencies: CryptoCurrency[];
  wallets: CryptoWallet[];
  rates: CryptoRate[];
  deposits: CryptoDeposit[];
  withdrawals: CryptoWithdrawal[];
}

export interface SeedReferralsResult {
  codes: ReferralCode[];
  referrals: Referral[];
}

export interface SeedWalletResult {
  wallets: Wallet[];
  transactions: Transaction[];
  withdrawals: Withdrawal[];
}

export interface SeedRewardsResult {
  rewards: Reward[];
  dailyBonuses: DailyBonus[];
  adWatches: AdWatch[];
}

export interface SeedUsersResult {
  count: number;
  users: User[];
  roleAssignments: {
    adminUsers: User[];
    managerUsers: User[];
    regularUsers: User[];
  };
}

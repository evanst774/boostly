// src/lib/audit/index.ts
import { db, type Transaction } from '@/lib/db';
import {
  auditLogs,
  type AuditAction,
  type AuditEntityType,
} from '@/lib/db/schema/audit';
import { headers } from 'next/headers';

// Re-export types for convenience
export type { AuditAction, AuditEntityType } from '@/lib/db/schema/audit';

// ============================================
// BASE AUDIT LOG DATA INTERFACE
// ============================================
export interface AuditLogData {
  userId: string;
  action: AuditAction;
  entityType?: AuditEntityType;
  entityId?: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

// ============================================
// TRANSACTION-SAFE AUDIT LOG DATA INTERFACE
// ============================================
export interface TransactionAuditLogData extends AuditLogData {
  ipAddress?: string;
  userAgent?: string;
}

// ============================================
// CORE AUDIT LOG FUNCTIONS
// ============================================

export async function createAuditLog(data: AuditLogData) {
  const headersList = await headers();
  const ipAddress =
    headersList.get('x-forwarded-for') ||
    headersList.get('x-real-ip') ||
    'unknown';
  const userAgent = headersList.get('user-agent') || 'unknown';

  await db.insert(auditLogs).values({
    id: crypto.randomUUID(),
    userId: data.userId,
    action: data.action,
    entityType: data.entityType,
    entityId: data.entityId,
    oldData: data.oldData ? JSON.stringify(data.oldData) : null,
    newData: data.newData ? JSON.stringify(data.newData) : null,
    ipAddress,
    userAgent,
  });
}

export async function createAuditLogInTransaction(
  data: TransactionAuditLogData,
  tx?: Transaction | typeof db,
) {
  const ipAddress = data.ipAddress || 'unknown';
  const userAgent = data.userAgent || 'unknown';
  const executor = tx ?? db;

  await executor.insert(auditLogs).values({
    id: crypto.randomUUID(),
    userId: data.userId,
    action: data.action,
    entityType: data.entityType,
    entityId: data.entityId,
    oldData: data.oldData ? JSON.stringify(data.oldData) : null,
    newData: data.newData ? JSON.stringify(data.newData) : null,
    ipAddress,
    userAgent,
  });
}

export function getRequestMetadata(request: Request) {
  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  return { ipAddress, userAgent };
}

// ============================================
// BOOSTLY AUDIT HELPERS
// ============================================

export const AuditHelpers = {
  // ==========================================
  // AUTH & USER MANAGEMENT
  // ==========================================
  logLogin: (userId: string) =>
    createAuditLog({
      userId,
      action: 'LOGIN',
      entityType: 'user',
      entityId: userId,
    }),

  logLoginFailed: (email: string) =>
    createAuditLog({
      userId: 'system',
      action: 'LOGIN_FAILED',
      entityType: 'user',
      newData: { email },
    }),

  logLogout: (userId: string) =>
    createAuditLog({
      userId,
      action: 'LOGOUT',
      entityType: 'user',
      entityId: userId,
    }),

  logPasswordChanged: (userId: string) =>
    createAuditLog({
      userId,
      action: 'PASSWORD_CHANGED',
      entityType: 'user',
      entityId: userId,
    }),

  logPasswordResetRequested: (userId: string) =>
    createAuditLog({
      userId,
      action: 'PASSWORD_RESET_REQUESTED',
      entityType: 'user',
      entityId: userId,
    }),

  logPasswordResetCompleted: (userId: string) =>
    createAuditLog({
      userId,
      action: 'PASSWORD_RESET_COMPLETED',
      entityType: 'user',
      entityId: userId,
    }),

  logEmailVerified: (userId: string) =>
    createAuditLog({
      userId,
      action: 'EMAIL_VERIFIED',
      entityType: 'user',
      entityId: userId,
    }),

  log2FAEnabled: (userId: string, method: string) =>
    createAuditLog({
      userId,
      action: 'TWO_FA_ENABLED',
      entityType: 'user',
      entityId: userId,
      newData: { method },
    }),

  log2FADisabled: (userId: string, method: string) =>
    createAuditLog({
      userId,
      action: 'TWO_FA_DISABLED',
      entityType: 'user',
      entityId: userId,
      newData: { method },
    }),

  log2FAVerified: (userId: string) =>
    createAuditLog({
      userId,
      action: 'TWO_FA_VERIFIED',
      entityType: 'user',
      entityId: userId,
    }),

  logAccountLocked: (userId: string, reason: string) =>
    createAuditLog({
      userId,
      action: 'ACCOUNT_LOCKED',
      entityType: 'user',
      entityId: userId,
      newData: { reason },
    }),

  logAccountUnlocked: (userId: string) =>
    createAuditLog({
      userId,
      action: 'ACCOUNT_UNLOCKED',
      entityType: 'user',
      entityId: userId,
    }),

  // ==========================================
  // USER MANAGEMENT
  // ==========================================
  logUserCreated: (
    userId: string,
    targetUserId: string,
    userData: Record<string, unknown>,
  ) =>
    createAuditLog({
      userId,
      action: 'USER_CREATED',
      entityType: 'user',
      entityId: targetUserId,
      newData: userData,
    }),

  logUserUpdated: (
    userId: string,
    targetUserId: string,
    oldData: Record<string, unknown>,
    newData: Record<string, unknown>,
  ) =>
    createAuditLog({
      userId,
      action: 'USER_UPDATED',
      entityType: 'user',
      entityId: targetUserId,
      oldData,
      newData,
    }),

  logUserActivated: (userId: string, targetUserId: string) =>
    createAuditLog({
      userId,
      action: 'USER_ACTIVATED',
      entityType: 'user',
      entityId: targetUserId,
    }),

  logUserDeactivated: (userId: string, targetUserId: string, reason?: string) =>
    createAuditLog({
      userId,
      action: 'USER_DEACTIVATED',
      entityType: 'user',
      entityId: targetUserId,
      newData: { reason },
    }),

  logUserDeleted: (
    userId: string,
    targetUserId: string,
    userData: Record<string, unknown>,
  ) =>
    createAuditLog({
      userId,
      action: 'USER_DELETED',
      entityType: 'user',
      entityId: targetUserId,
      oldData: userData,
    }),

  logUserRoleAssigned: (
    userId: string,
    targetUserId: string,
    roleName: string,
  ) =>
    createAuditLog({
      userId,
      action: 'USER_ROLE_ASSIGNED',
      entityType: 'user',
      entityId: targetUserId,
      newData: { assignedRole: roleName },
    }),

  logUserRoleRevoked: (
    userId: string,
    targetUserId: string,
    roleName: string,
  ) =>
    createAuditLog({
      userId,
      action: 'USER_ROLE_REVOKED',
      entityType: 'user',
      entityId: targetUserId,
      newData: { revokedRole: roleName },
    }),

  logProfileUpdated: (
    userId: string,
    oldData: Record<string, unknown>,
    newData: Record<string, unknown>,
  ) =>
    createAuditLog({
      userId,
      action: 'PROFILE_UPDATED',
      entityType: 'user',
      entityId: userId,
      oldData,
      newData,
    }),

  logEmailChanged: (userId: string, oldEmail: string, newEmail: string) =>
    createAuditLog({
      userId,
      action: 'EMAIL_CHANGED',
      entityType: 'user',
      entityId: userId,
      oldData: { email: oldEmail },
      newData: { email: newEmail },
    }),

  // ==========================================
  // CONTENT - VIDEOS
  // ==========================================
  logVideoCreated: (
    userId: string,
    videoId: string,
    videoData: Record<string, unknown>,
  ) =>
    createAuditLog({
      userId,
      action: 'VIDEO_CREATED',
      entityType: 'video',
      entityId: videoId,
      newData: videoData,
    }),

  logVideoUpdated: (
    userId: string,
    videoId: string,
    oldData: Record<string, unknown>,
    newData: Record<string, unknown>,
  ) =>
    createAuditLog({
      userId,
      action: 'VIDEO_UPDATED',
      entityType: 'video',
      entityId: videoId,
      oldData,
      newData,
    }),

  logVideoDeleted: (
    userId: string,
    videoId: string,
    videoData: Record<string, unknown>,
  ) =>
    createAuditLog({
      userId,
      action: 'VIDEO_DELETED',
      entityType: 'video',
      entityId: videoId,
      oldData: videoData,
    }),

  logVideoPublished: (userId: string, videoId: string) =>
    createAuditLog({
      userId,
      action: 'VIDEO_PUBLISHED',
      entityType: 'video',
      entityId: videoId,
    }),

  logVideoWatched: (
    userId: string,
    videoId: string,
    watchData: Record<string, unknown>,
  ) =>
    createAuditLog({
      userId,
      action: 'VIDEO_WATCHED',
      entityType: 'video',
      entityId: videoId,
      newData: watchData,
    }),

  logVideoWatchCompleted: (
    userId: string,
    videoId: string,
    rewardAmount: number,
  ) =>
    createAuditLog({
      userId,
      action: 'VIDEO_WATCH_COMPLETED',
      entityType: 'video',
      entityId: videoId,
      newData: { rewardAmount },
    }),

  // ==========================================
  // CONTENT - GAMES
  // ==========================================
  logGameCreated: (
    userId: string,
    gameId: string,
    gameData: Record<string, unknown>,
  ) =>
    createAuditLog({
      userId,
      action: 'GAME_CREATED',
      entityType: 'game',
      entityId: gameId,
      newData: gameData,
    }),

  logGameUpdated: (
    userId: string,
    gameId: string,
    oldData: Record<string, unknown>,
    newData: Record<string, unknown>,
  ) =>
    createAuditLog({
      userId,
      action: 'GAME_UPDATED',
      entityType: 'game',
      entityId: gameId,
      oldData,
      newData,
    }),

  logGameDeleted: (
    userId: string,
    gameId: string,
    gameData: Record<string, unknown>,
  ) =>
    createAuditLog({
      userId,
      action: 'GAME_DELETED',
      entityType: 'game',
      entityId: gameId,
      oldData: gameData,
    }),

  logGamePublished: (userId: string, gameId: string) =>
    createAuditLog({
      userId,
      action: 'GAME_PUBLISHED',
      entityType: 'game',
      entityId: gameId,
    }),

  logGamePlayed: (
    userId: string,
    gameId: string,
    playData: Record<string, unknown>,
  ) =>
    createAuditLog({
      userId,
      action: 'GAME_PLAYED',
      entityType: 'game',
      entityId: gameId,
      newData: playData,
    }),

  logGamePlayCompleted: (
    userId: string,
    gameId: string,
    rewardAmount: number,
  ) =>
    createAuditLog({
      userId,
      action: 'GAME_PLAY_COMPLETED',
      entityType: 'game',
      entityId: gameId,
      newData: { rewardAmount },
    }),

  // ==========================================
  // CONTENT - SURVEYS
  // ==========================================
  logSurveyCreated: (
    userId: string,
    surveyId: string,
    surveyData: Record<string, unknown>,
  ) =>
    createAuditLog({
      userId,
      action: 'SURVEY_CREATED',
      entityType: 'survey',
      entityId: surveyId,
      newData: surveyData,
    }),

  logSurveyUpdated: (
    userId: string,
    surveyId: string,
    oldData: Record<string, unknown>,
    newData: Record<string, unknown>,
  ) =>
    createAuditLog({
      userId,
      action: 'SURVEY_UPDATED',
      entityType: 'survey',
      entityId: surveyId,
      oldData,
      newData,
    }),

  logSurveyDeleted: (
    userId: string,
    surveyId: string,
    surveyData: Record<string, unknown>,
  ) =>
    createAuditLog({
      userId,
      action: 'SURVEY_DELETED',
      entityType: 'survey',
      entityId: surveyId,
      oldData: surveyData,
    }),

  logSurveyPublished: (userId: string, surveyId: string) =>
    createAuditLog({
      userId,
      action: 'SURVEY_PUBLISHED',
      entityType: 'survey',
      entityId: surveyId,
    }),

  logSurveyResponseSubmitted: (
    userId: string,
    surveyId: string,
    responseData: Record<string, unknown>,
  ) =>
    createAuditLog({
      userId,
      action: 'SURVEY_RESPONSE_SUBMITTED',
      entityType: 'survey',
      entityId: surveyId,
      newData: responseData,
    }),

  logSurveyResponseCompleted: (
    userId: string,
    surveyId: string,
    rewardAmount: number,
  ) =>
    createAuditLog({
      userId,
      action: 'SURVEY_RESPONSE_COMPLETED',
      entityType: 'survey',
      entityId: surveyId,
      newData: { rewardAmount },
    }),

  // ==========================================
  // REWARDS
  // ==========================================
  logRewardCreated: (
    userId: string,
    rewardId: string,
    rewardData: Record<string, unknown>,
  ) =>
    createAuditLog({
      userId,
      action: 'REWARD_CREATED',
      entityType: 'reward',
      entityId: rewardId,
      newData: rewardData,
    }),

  logRewardClaimed: (userId: string, rewardId: string, amount: number) =>
    createAuditLog({
      userId,
      action: 'REWARD_CLAIMED',
      entityType: 'reward',
      entityId: rewardId,
      newData: { amount },
    }),

  logRewardDeleted: (
    userId: string,
    rewardId: string,
    rewardData: Record<string, unknown>,
  ) =>
    createAuditLog({
      userId,
      action: 'REWARD_DELETED',
      entityType: 'reward',
      entityId: rewardId,
      oldData: rewardData,
    }),

  logRewardExpired: (userId: string, rewardId: string, reason: string) =>
    createAuditLog({
      userId,
      action: 'REWARD_EXPIRED',
      entityType: 'reward',
      entityId: rewardId,
      newData: { reason },
    }),

  // ==========================================
  // DAILY BONUS
  // ==========================================
  logDailyBonusClaimed: (
    userId: string,
    bonusId: string,
    streakDay: number,
    amount: number,
  ) =>
    createAuditLog({
      userId,
      action: 'DAILY_BONUS_CLAIMED',
      entityType: 'daily_bonus',
      entityId: bonusId,
      newData: { streakDay, amount },
    }),

  logDailyBonusMissed: (userId: string, streakDay: number) =>
    createAuditLog({
      userId,
      action: 'DAILY_BONUS_MISSED',
      entityType: 'user',
      entityId: userId,
      newData: { streakDay },
    }),

  logStreakBroken: (userId: string, streakLength: number) =>
    createAuditLog({
      userId,
      action: 'STREAK_BROKEN',
      entityType: 'user',
      entityId: userId,
      newData: { streakLength },
    }),

  // ==========================================
  // AD WATCHES
  // ==========================================
  logAdWatchStarted: (userId: string, adId: string, advertiser: string) =>
    createAuditLog({
      userId,
      action: 'AD_WATCH_STARTED',
      entityType: 'ad_watch',
      entityId: adId,
      newData: { advertiser },
    }),

  logAdWatchCompleted: (userId: string, adId: string, rewardAmount: number) =>
    createAuditLog({
      userId,
      action: 'AD_WATCH_COMPLETED',
      entityType: 'ad_watch',
      entityId: adId,
      newData: { rewardAmount },
    }),

  logAdWatchRewardClaimed: (
    userId: string,
    adId: string,
    rewardAmount: number,
  ) =>
    createAuditLog({
      userId,
      action: 'AD_WATCH_REWARD_CLAIMED',
      entityType: 'ad_watch',
      entityId: adId,
      newData: { rewardAmount },
    }),

  // ==========================================
  // WALLET & TRANSACTIONS
  // ==========================================
  logWalletCreated: (userId: string, walletId: string) =>
    createAuditLog({
      userId,
      action: 'WALLET_CREATED',
      entityType: 'wallet',
      entityId: walletId,
    }),

  logWalletBalanceAdded: (
    userId: string,
    walletId: string,
    amount: number,
    reason: string,
  ) =>
    createAuditLog({
      userId,
      action: 'WALLET_BALANCE_ADDED',
      entityType: 'wallet',
      entityId: walletId,
      newData: { amount, reason },
    }),

  logWalletBalanceDeducted: (
    userId: string,
    walletId: string,
    amount: number,
    reason: string,
  ) =>
    createAuditLog({
      userId,
      action: 'WALLET_BALANCE_DEDUCTED',
      entityType: 'wallet',
      entityId: walletId,
      newData: { amount, reason },
    }),

  logTransactionCreated: (
    userId: string,
    transactionId: string,
    transactionData: Record<string, unknown>,
  ) =>
    createAuditLog({
      userId,
      action: 'TRANSACTION_CREATED',
      entityType: 'transaction',
      entityId: transactionId,
      newData: transactionData,
    }),

  logTransactionCompleted: (
    userId: string,
    transactionId: string,
    amount: number,
  ) =>
    createAuditLog({
      userId,
      action: 'TRANSACTION_COMPLETED',
      entityType: 'transaction',
      entityId: transactionId,
      newData: { amount },
    }),

  logTransactionFailed: (
    userId: string,
    transactionId: string,
    reason: string,
  ) =>
    createAuditLog({
      userId,
      action: 'TRANSACTION_FAILED',
      entityType: 'transaction',
      entityId: transactionId,
      newData: { reason },
    }),

  // ==========================================
  // WITHDRAWALS
  // ==========================================
  logWithdrawalRequested: (
    userId: string,
    withdrawalId: string,
    amount: number,
    method: string,
  ) =>
    createAuditLog({
      userId,
      action: 'WITHDRAWAL_REQUESTED',
      entityType: 'withdrawal',
      entityId: withdrawalId,
      newData: { amount, method },
    }),

  logWithdrawalApproved: (
    userId: string,
    withdrawalId: string,
    processedBy: string,
  ) =>
    createAuditLog({
      userId,
      action: 'WITHDRAWAL_APPROVED',
      entityType: 'withdrawal',
      entityId: withdrawalId,
      newData: { processedBy },
    }),

  logWithdrawalRejected: (
    userId: string,
    withdrawalId: string,
    reason: string,
  ) =>
    createAuditLog({
      userId,
      action: 'WITHDRAWAL_REJECTED',
      entityType: 'withdrawal',
      entityId: withdrawalId,
      newData: { reason },
    }),

  logWithdrawalCompleted: (
    userId: string,
    withdrawalId: string,
    reference: string,
  ) =>
    createAuditLog({
      userId,
      action: 'WITHDRAWAL_COMPLETED',
      entityType: 'withdrawal',
      entityId: withdrawalId,
      newData: { reference },
    }),

  logWithdrawalFailed: (userId: string, withdrawalId: string, reason: string) =>
    createAuditLog({
      userId,
      action: 'WITHDRAWAL_FAILED',
      entityType: 'withdrawal',
      entityId: withdrawalId,
      newData: { reason },
    }),

  // ==========================================
  // CRYPTO
  // ==========================================
  logCryptoCurrencyCreated: (
    userId: string,
    currencyId: string,
    currencyData: Record<string, unknown>,
  ) =>
    createAuditLog({
      userId,
      action: 'CRYPTO_CURRENCY_CREATED',
      entityType: 'crypto_currency',
      entityId: currencyId,
      newData: currencyData,
    }),

  logCryptoCurrencyUpdated: (
    userId: string,
    currencyId: string,
    oldData: Record<string, unknown>,
    newData: Record<string, unknown>,
  ) =>
    createAuditLog({
      userId,
      action: 'CRYPTO_CURRENCY_UPDATED',
      entityType: 'crypto_currency',
      entityId: currencyId,
      oldData,
      newData,
    }),

  logCryptoCurrencyDeleted: (
    userId: string,
    currencyId: string,
    currencyData: Record<string, unknown>,
  ) =>
    createAuditLog({
      userId,
      action: 'CRYPTO_CURRENCY_DELETED',
      entityType: 'crypto_currency',
      entityId: currencyId,
      oldData: currencyData,
    }),

  logCryptoWalletCreated: (
    userId: string,
    walletId: string,
    walletData: Record<string, unknown>,
  ) =>
    createAuditLog({
      userId,
      action: 'CRYPTO_WALLET_CREATED',
      entityType: 'crypto_wallet',
      entityId: walletId,
      newData: walletData,
    }),

  logCryptoWalletUpdated: (
    userId: string,
    walletId: string,
    oldData: Record<string, unknown>,
    newData: Record<string, unknown>,
  ) =>
    createAuditLog({
      userId,
      action: 'CRYPTO_WALLET_UPDATED',
      entityType: 'crypto_wallet',
      entityId: walletId,
      oldData,
      newData,
    }),

  logCryptoWalletDeleted: (
    userId: string,
    walletId: string,
    walletData: Record<string, unknown>,
  ) =>
    createAuditLog({
      userId,
      action: 'CRYPTO_WALLET_DELETED',
      entityType: 'crypto_wallet',
      entityId: walletId,
      oldData: walletData,
    }),

  logCryptoDepositCreated: (
    userId: string,
    depositId: string,
    depositData: Record<string, unknown>,
  ) =>
    createAuditLog({
      userId,
      action: 'CRYPTO_DEPOSIT_CREATED',
      entityType: 'crypto_deposit',
      entityId: depositId,
      newData: depositData,
    }),

  logCryptoDepositUpdated: (
    userId: string,
    depositId: string,
    oldData: Record<string, unknown>,
    newData: Record<string, unknown>,
  ) =>
    createAuditLog({
      userId,
      action: 'CRYPTO_DEPOSIT_UPDATED',
      entityType: 'crypto_deposit',
      entityId: depositId,
      oldData,
      newData,
    }),

  logCryptoDepositApproved: (
    userId: string,
    depositId: string,
    amount: number,
    currency: string,
  ) =>
    createAuditLog({
      userId,
      action: 'CRYPTO_DEPOSIT_APPROVED',
      entityType: 'crypto_deposit',
      entityId: depositId,
      newData: { amount, currency },
    }),

  logCryptoDepositRejected: (
    userId: string,
    depositId: string,
    reason: string,
  ) =>
    createAuditLog({
      userId,
      action: 'CRYPTO_DEPOSIT_REJECTED',
      entityType: 'crypto_deposit',
      entityId: depositId,
      newData: { reason },
    }),

  logCryptoDepositCompleted: (
    userId: string,
    depositId: string,
    amount: number,
    currency: string,
  ) =>
    createAuditLog({
      userId,
      action: 'CRYPTO_DEPOSIT_COMPLETED',
      entityType: 'crypto_deposit',
      entityId: depositId,
      newData: { amount, currency },
    }),

  logCryptoDepositFailed: (userId: string, depositId: string, reason: string) =>
    createAuditLog({
      userId,
      action: 'CRYPTO_DEPOSIT_FAILED',
      entityType: 'crypto_deposit',
      entityId: depositId,
      newData: { reason },
    }),

  logCryptoWithdrawalCreated: (
    userId: string,
    withdrawalId: string,
    withdrawalData: Record<string, unknown>,
  ) =>
    createAuditLog({
      userId,
      action: 'CRYPTO_WITHDRAWAL_CREATED',
      entityType: 'crypto_withdrawal',
      entityId: withdrawalId,
      newData: withdrawalData,
    }),

  logCryptoWithdrawalUpdated: (
    userId: string,
    withdrawalId: string,
    oldData: Record<string, unknown>,
    newData: Record<string, unknown>,
  ) =>
    createAuditLog({
      userId,
      action: 'CRYPTO_WITHDRAWAL_UPDATED',
      entityType: 'crypto_withdrawal',
      entityId: withdrawalId,
      oldData,
      newData,
    }),

  logCryptoWithdrawalApproved: (
    userId: string,
    withdrawalId: string,
    amount: number,
    currency: string,
  ) =>
    createAuditLog({
      userId,
      action: 'CRYPTO_WITHDRAWAL_APPROVED',
      entityType: 'crypto_withdrawal',
      entityId: withdrawalId,
      newData: { amount, currency },
    }),

  logCryptoWithdrawalRejected: (
    userId: string,
    withdrawalId: string,
    reason: string,
  ) =>
    createAuditLog({
      userId,
      action: 'CRYPTO_WITHDRAWAL_REJECTED',
      entityType: 'crypto_withdrawal',
      entityId: withdrawalId,
      newData: { reason },
    }),

  logCryptoWithdrawalCompleted: (
    userId: string,
    withdrawalId: string,
    amount: number,
    currency: string,
  ) =>
    createAuditLog({
      userId,
      action: 'CRYPTO_WITHDRAWAL_COMPLETED',
      entityType: 'crypto_withdrawal',
      entityId: withdrawalId,
      newData: { amount, currency },
    }),

  logCryptoWithdrawalFailed: (
    userId: string,
    withdrawalId: string,
    reason: string,
  ) =>
    createAuditLog({
      userId,
      action: 'CRYPTO_WITHDRAWAL_FAILED',
      entityType: 'crypto_withdrawal',
      entityId: withdrawalId,
      newData: { reason },
    }),

  logCryptoWithdrawalProcessed: (
    userId: string,
    withdrawalId: string,
    amount: number,
    currency: string,
  ) =>
    createAuditLog({
      userId,
      action: 'CRYPTO_WITHDRAWAL_PROCESSED',
      entityType: 'crypto_withdrawal',
      entityId: withdrawalId,
      newData: { amount, currency },
    }),

  logCryptoRatesUpdated: (
    userId: string,
    rates: Array<{ currency: string; usdRate: number }>,
  ) =>
    createAuditLog({
      userId,
      action: 'CRYPTO_RATES_UPDATED',
      entityType: 'crypto_rate',
      newData: { rates },
    }),

  // ==========================================
  // REFERRALS
  // ==========================================
  logReferralCreated: (
    userId: string,
    referralId: string,
    referrerId: string,
    code: string,
  ) =>
    createAuditLog({
      userId,
      action: 'REFERRAL_CREATED',
      entityType: 'referral',
      entityId: referralId,
      newData: { referrerId, code },
    }),

  logReferralActivated: (userId: string, referralId: string) =>
    createAuditLog({
      userId,
      action: 'REFERRAL_ACTIVATED',
      entityType: 'referral',
      entityId: referralId,
    }),

  logReferralRewardClaimed: (
    userId: string,
    referralId: string,
    amount: number,
    type: 'referrer' | 'referee',
  ) =>
    createAuditLog({
      userId,
      action: 'REFERRAL_REWARD_CLAIMED',
      entityType: 'referral',
      entityId: referralId,
      newData: { amount, type },
    }),

  logReferralCodeCreated: (userId: string, codeId: string, code: string) =>
    createAuditLog({
      userId,
      action: 'REFERRAL_CODE_CREATED',
      entityType: 'referral_code',
      entityId: codeId,
      newData: { code },
    }),

  logReferralCodeDeactivated: (userId: string, codeId: string, code: string) =>
    createAuditLog({
      userId,
      action: 'REFERRAL_CODE_DEACTIVATED',
      entityType: 'referral_code',
      entityId: codeId,
      newData: { code },
    }),

  logReferralCodeUsed: (
    userId: string,
    codeId: string,
    code: string,
    usedBy: string,
  ) =>
    createAuditLog({
      userId,
      action: 'REFERRAL_CODE_USED',
      entityType: 'referral_code',
      entityId: codeId,
      newData: { code, usedBy },
    }),

  // ==========================================
  // BADGES
  // ==========================================
  logBadgeCreated: (
    userId: string,
    badgeId: string,
    badgeData: Record<string, unknown>,
  ) =>
    createAuditLog({
      userId,
      action: 'BADGE_CREATED',
      entityType: 'badge',
      entityId: badgeId,
      newData: badgeData,
    }),

  logBadgePurchased: (
    userId: string,
    userBadgeId: string,
    badgeId: string,
    price: number,
  ) =>
    createAuditLog({
      userId,
      action: 'BADGE_PURCHASED',
      entityType: 'user_badge',
      entityId: userBadgeId,
      newData: { badgeId, price },
    }),

  logBadgeActivated: (userId: string, userBadgeId: string, badgeId: string) =>
    createAuditLog({
      userId,
      action: 'BADGE_ACTIVATED',
      entityType: 'user_badge',
      entityId: userBadgeId,
      newData: { badgeId },
    }),

  logBadgeDeactivated: (userId: string, userBadgeId: string, badgeId: string) =>
    createAuditLog({
      userId,
      action: 'BADGE_DEACTIVATED',
      entityType: 'user_badge',
      entityId: userBadgeId,
      newData: { badgeId },
    }),

  logBadgeBonusClaimed: (userId: string, badgeId: string, amount: number) =>
    createAuditLog({
      userId,
      action: 'BADGE_BONUS_CLAIMED',
      entityType: 'badge',
      entityId: badgeId,
      newData: { amount },
    }),

  // ==========================================
  // SUBSCRIPTIONS
  // ==========================================
  logSubscriptionCreated: (
    userId: string,
    subscriptionId: string,
    planId: string,
    billingCycle: string,
  ) =>
    createAuditLog({
      userId,
      action: 'SUBSCRIPTION_CREATED',
      entityType: 'user_subscription',
      entityId: subscriptionId,
      newData: { planId, billingCycle },
    }),

  logSubscriptionCancelled: (userId: string, subscriptionId: string) =>
    createAuditLog({
      userId,
      action: 'SUBSCRIPTION_CANCELLED',
      entityType: 'user_subscription',
      entityId: subscriptionId,
    }),

  logSubscriptionRenewed: (
    userId: string,
    subscriptionId: string,
    expiresAt: string,
  ) =>
    createAuditLog({
      userId,
      action: 'SUBSCRIPTION_RENEWED',
      entityType: 'user_subscription',
      entityId: subscriptionId,
      newData: { expiresAt },
    }),

  logSubscriptionExpired: (userId: string, subscriptionId: string) =>
    createAuditLog({
      userId,
      action: 'SUBSCRIPTION_EXPIRED',
      entityType: 'user_subscription',
      entityId: subscriptionId,
    }),

  logSubscriptionUpgraded: (
    userId: string,
    subscriptionId: string,
    fromPlan: string,
    toPlan: string,
  ) =>
    createAuditLog({
      userId,
      action: 'SUBSCRIPTION_UPGRADED',
      entityType: 'user_subscription',
      entityId: subscriptionId,
      newData: { fromPlan, toPlan },
    }),

  // ==========================================
  // ADMIN ACTIONS
  // ==========================================
  logAdminAction: (
    userId: string,
    action: string,
    details: Record<string, unknown>,
  ) =>
    createAuditLog({
      userId,
      action: 'ADMIN_ACTION',
      entityType: 'admin',
      newData: { action, details },
    }),

  logAdminImpersonateStart: (userId: string, targetUserId: string) =>
    createAuditLog({
      userId,
      action: 'ADMIN_IMPERSONATE_START',
      entityType: 'user',
      entityId: targetUserId,
      newData: { impersonatedBy: userId },
    }),

  logAdminImpersonateEnd: (userId: string, targetUserId: string) =>
    createAuditLog({
      userId,
      action: 'ADMIN_IMPERSONATE_END',
      entityType: 'user',
      entityId: targetUserId,
      newData: { impersonatedBy: userId },
    }),

  logAdminContentModeration: (
    userId: string,
    contentType: string,
    contentId: string,
    action: string,
    reason: string,
  ) =>
    createAuditLog({
      userId,
      action: 'ADMIN_CONTENT_MODERATION',
      entityType: contentType as AuditEntityType,
      entityId: contentId,
      newData: { action, reason },
    }),

  logAdminUserSuspended: (
    userId: string,
    targetUserId: string,
    reason: string,
  ) =>
    createAuditLog({
      userId,
      action: 'ADMIN_USER_SUSPENDED',
      entityType: 'user',
      entityId: targetUserId,
      newData: { reason },
    }),

  logAdminUserUnsuspended: (userId: string, targetUserId: string) =>
    createAuditLog({
      userId,
      action: 'ADMIN_USER_UNSUSPENDED',
      entityType: 'user',
      entityId: targetUserId,
    }),

  // ==========================================
  // SECURITY
  // ==========================================
  logSecurityEvent: (
    userId: string,
    event: string,
    details: Record<string, unknown>,
  ) =>
    createAuditLog({
      userId,
      action: 'SECURITY_EVENT',
      entityType: 'user',
      entityId: userId,
      newData: { event, details },
    }),

  logSuspiciousActivityDetected: (
    userId: string,
    activity: string,
    details: Record<string, unknown>,
  ) =>
    createAuditLog({
      userId,
      action: 'SUSPICIOUS_ACTIVITY_DETECTED',
      entityType: 'user',
      entityId: userId,
      newData: { activity, details },
    }),

  logRateLimitExceeded: (userId: string, endpoint: string, attempts: number) =>
    createAuditLog({
      userId,
      action: 'RATE_LIMIT_EXCEEDED',
      entityType: 'user',
      entityId: userId,
      newData: { endpoint, attempts },
    }),

  // ==========================================
  // SYSTEM
  // ==========================================
  logSystemConfigChanged: (
    userId: string,
    configKey: string,
    oldValue: unknown,
    newValue: unknown,
  ) =>
    createAuditLog({
      userId,
      action: 'SYSTEM_CONFIG_CHANGED',
      entityType: 'setting',
      newData: { configKey, oldValue, newValue },
    }),

  logSettingsUpdated: (
    userId: string,
    oldData: Record<string, unknown>,
    newData: Record<string, unknown>,
  ) =>
    createAuditLog({
      userId,
      action: 'SETTINGS_UPDATED',
      entityType: 'setting',
      oldData,
      newData,
    }),

  logCompanyProfileUpdated: (
    userId: string,
    oldData: Record<string, unknown>,
    newData: Record<string, unknown>,
  ) =>
    createAuditLog({
      userId,
      action: 'COMPANY_PROFILE_UPDATED',
      entityType: 'company',
      oldData,
      newData,
    }),

  logDatabaseBackup: (userId: string, backupInfo: Record<string, unknown>) =>
    createAuditLog({
      userId,
      action: 'DATABASE_BACKUP',
      entityType: 'system',
      newData: backupInfo,
    }),

  logDatabaseRestore: (userId: string, restoreInfo: Record<string, unknown>) =>
    createAuditLog({
      userId,
      action: 'DATABASE_RESTORE',
      entityType: 'system',
      newData: restoreInfo,
    }),

  // ==========================================
  // COMMUNICATIONS
  // ==========================================
  logEmailSent: (userId: string, emailData: Record<string, unknown>) =>
    createAuditLog({
      userId,
      action: 'EMAIL_SENT',
      entityType: 'email',
      newData: emailData,
    }),

  logEmailFailed: (
    userId: string,
    emailData: Record<string, unknown>,
    error: string,
  ) =>
    createAuditLog({
      userId,
      action: 'EMAIL_FAILED',
      entityType: 'email',
      newData: { ...emailData, error },
    }),

  logNotificationSent: (
    userId: string,
    notificationData: Record<string, unknown>,
  ) =>
    createAuditLog({
      userId,
      action: 'NOTIFICATION_SENT',
      entityType: 'notification',
      newData: notificationData,
    }),

  // ==========================================
  // SUDO MODE
  // ==========================================
  logSudoModeActivated: (userId: string) =>
    createAuditLog({
      userId,
      action: 'SUDO_MODE_ACTIVATED',
      entityType: 'user',
      entityId: userId,
    }),

  logSudoModeDeactivated: (userId: string) =>
    createAuditLog({
      userId,
      action: 'SUDO_MODE_DEACTIVATED',
      entityType: 'user',
      entityId: userId,
    }),

  logSudoModeFailed: (userId: string, reason: string) =>
    createAuditLog({
      userId,
      action: 'SUDO_MODE_FAILED',
      entityType: 'user',
      entityId: userId,
      newData: { reason },
    }),

  // ==========================================
  // AUDIT
  // ==========================================
  logAuditExported: (userId: string, exportData: Record<string, unknown>) =>
    createAuditLog({
      userId,
      action: 'AUDIT_EXPORTED',
      entityType: 'audit',
      newData: exportData,
    }),

  logAuditCleared: (userId: string, beforeDate: string, reason: string) =>
    createAuditLog({
      userId,
      action: 'AUDIT_CLEARED',
      entityType: 'audit',
      newData: { beforeDate, reason },
    }),
};

// ============================================
// TRANSACTION-SAFE AUDIT HELPERS
// ============================================

export const AuditHelpersInTransaction = {
  // Content
  logVideoCreated: (
    userId: string,
    videoId: string,
    videoData: Record<string, unknown>,
    context: { ipAddress: string; userAgent: string },
  ) =>
    createAuditLogInTransaction({
      userId,
      action: 'VIDEO_CREATED',
      entityType: 'video',
      entityId: videoId,
      newData: videoData,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    }),

  logGameCreated: (
    userId: string,
    gameId: string,
    gameData: Record<string, unknown>,
    context: { ipAddress: string; userAgent: string },
  ) =>
    createAuditLogInTransaction({
      userId,
      action: 'GAME_CREATED',
      entityType: 'game',
      entityId: gameId,
      newData: gameData,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    }),

  logSurveyCreated: (
    userId: string,
    surveyId: string,
    surveyData: Record<string, unknown>,
    context: { ipAddress: string; userAgent: string },
  ) =>
    createAuditLogInTransaction({
      userId,
      action: 'SURVEY_CREATED',
      entityType: 'survey',
      entityId: surveyId,
      newData: surveyData,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    }),

  // Wallet
  logTransactionCreated: (
    userId: string,
    transactionId: string,
    transactionData: Record<string, unknown>,
    context: { ipAddress: string; userAgent: string },
  ) =>
    createAuditLogInTransaction({
      userId,
      action: 'TRANSACTION_CREATED',
      entityType: 'transaction',
      entityId: transactionId,
      newData: transactionData,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    }),

  logWithdrawalRequested: (
    userId: string,
    withdrawalId: string,
    amount: number,
    method: string,
    context: { ipAddress: string; userAgent: string },
  ) =>
    createAuditLogInTransaction({
      userId,
      action: 'WITHDRAWAL_REQUESTED',
      entityType: 'withdrawal',
      entityId: withdrawalId,
      newData: { amount, method },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    }),

  // Referrals
  logReferralCreated: (
    userId: string,
    referralId: string,
    referrerId: string,
    code: string,
    context: { ipAddress: string; userAgent: string },
  ) =>
    createAuditLogInTransaction({
      userId,
      action: 'REFERRAL_CREATED',
      entityType: 'referral',
      entityId: referralId,
      newData: { referrerId, code },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    }),

  // Badges
  logBadgePurchased: (
    userId: string,
    userBadgeId: string,
    badgeId: string,
    price: number,
    context: { ipAddress: string; userAgent: string },
  ) =>
    createAuditLogInTransaction({
      userId,
      action: 'BADGE_PURCHASED',
      entityType: 'user_badge',
      entityId: userBadgeId,
      newData: { badgeId, price },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    }),

  // Subscriptions
  logSubscriptionCreated: (
    userId: string,
    subscriptionId: string,
    planId: string,
    billingCycle: string,
    context: { ipAddress: string; userAgent: string },
  ) =>
    createAuditLogInTransaction({
      userId,
      action: 'SUBSCRIPTION_CREATED',
      entityType: 'user_subscription',
      entityId: subscriptionId,
      newData: { planId, billingCycle },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    }),

  // Crypto
  logCryptoDepositCreated: (
    userId: string,
    depositId: string,
    depositData: Record<string, unknown>,
    context: { ipAddress: string; userAgent: string },
  ) =>
    createAuditLogInTransaction({
      userId,
      action: 'CRYPTO_DEPOSIT_CREATED',
      entityType: 'crypto_deposit',
      entityId: depositId,
      newData: depositData,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    }),

  logCryptoWithdrawalCreated: (
    userId: string,
    withdrawalId: string,
    withdrawalData: Record<string, unknown>,
    context: { ipAddress: string; userAgent: string },
  ) =>
    createAuditLogInTransaction({
      userId,
      action: 'CRYPTO_WITHDRAWAL_CREATED',
      entityType: 'crypto_withdrawal',
      entityId: withdrawalId,
      newData: withdrawalData,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    }),
};

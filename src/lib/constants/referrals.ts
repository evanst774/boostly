// src/lib/constants/referrals.ts
//
// Referral commission rules, shared by the server and every screen so the
// percentage shown to members is always the one actually paid.

/**
 * Direct referrals only: the member who invited the buyer earns this share
 * of EVERY plan or badge purchase the invited member makes (first purchase
 * and renewals). Nothing is paid further up the chain.
 */
export const REFERRAL_COMMISSION_RATE = 0.13;

/** "13%" */
export const REFERRAL_COMMISSION_LABEL = `${Math.round(REFERRAL_COMMISSION_RATE * 100)}%`;

/** Example: commission on a given purchase amount (RWF, whole francs). */
export function referralCommissionFor(amount: number): number {
  return Math.round(amount * REFERRAL_COMMISSION_RATE);
}

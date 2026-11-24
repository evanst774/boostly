// src/modules/badges/service.ts
import {
  badgesRepository,
  userBadgesRepository,
  subscriptionPlansRepository,
  userSubscriptionsRepository,
} from './repository';
import {
  purchaseBadgeSchema,
  createBadgeSchema,
  updateBadgeSchema,
  createSubscriptionPlanSchema,
  updateSubscriptionPlanSchema,
  subscribeToPlanSchema,
  type PurchaseBadgeInput,
  type CreateBadgeInput,
  type UpdateBadgeInput,
  type CreateSubscriptionPlanInput,
  type UpdateSubscriptionPlanInput,
  type SubscribeToPlanInput,
} from './validation';
import { createAuditLog } from '@/lib/audit';
import { getCurrentUser } from '@/lib/auth/session.server';
import { requirePermission } from '@/lib/auth/permissions';
import { BadgesPermissions } from './permissions';
import { walletService } from '../wallet/service';
import { rewardsService } from '../rewards/service';
import {
  RewardTypeEnum,
  TransactionStatusEnum,
  TransactionTypeEnum,
  transactions,
  userSubscriptions,
  wallets,
  type SubscriptionPlan,
} from '@/lib/db/schema';
import { quotePlan } from './plan-quote';
import { db } from '@/lib/db';
import { and, eq, gte, sql } from 'drizzle-orm';
import { notificationsService } from '@/lib/notifications';
import {
  referralsService,
  QualifyingPurchaseEnum,
} from '../referrals/service';

// ============================================
// BADGES SERVICE
// ============================================
export class BadgesService {
  async createBadge(input: CreateBadgeInput) {
    await requirePermission(BadgesPermissions.CREATE);
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const validated = createBadgeSchema.parse(input);

    const badge = await badgesRepository.create(validated);

    await createAuditLog({
      userId: user.id,
      action: 'BADGE_CREATED',
      entityType: 'badge',
      entityId: badge.id,
      newData: badge,
    });

    return badge;
  }

  async getBadge(id: string) {
    await requirePermission(BadgesPermissions.READ);
    const badge = await badgesRepository.getById(id);
    if (!badge) throw new Error('Badge not found');
    return badge;
  }

  async getAllBadges() {
    await requirePermission(BadgesPermissions.READ);
    return await badgesRepository.getAll();
  }

  async updateBadge(id: string, input: UpdateBadgeInput) {
    await requirePermission(BadgesPermissions.UPDATE);
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const existing = await badgesRepository.getById(id);
    if (!existing) throw new Error('Badge not found');

    const validated = updateBadgeSchema.parse(input);
    const updated = await badgesRepository.update(id, validated);

    await createAuditLog({
      userId: user.id,
      action: 'BADGE_UPDATED',
      entityType: 'badge',
      entityId: id,
      oldData: existing,
      newData: updated,
    });

    return updated;
  }

  async deleteBadge(id: string) {
    await requirePermission(BadgesPermissions.DELETE);
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const existing = await badgesRepository.getById(id);
    if (!existing) throw new Error('Badge not found');

    await badgesRepository.delete(id);

    await createAuditLog({
      userId: user.id,
      action: 'BADGE_DELETED',
      entityType: 'badge',
      entityId: id,
      oldData: existing,
    });
  }

  // ============================================
  // USER BADGES
  // ============================================

  async purchaseBadge(input: PurchaseBadgeInput) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const validated = purchaseBadgeSchema.parse(input);

    const badge = await badgesRepository.getById(validated.badgeId);
    if (!badge) throw new Error('Badge not found');

    // Check if user already has this badge
    const existing = await userBadgesRepository.getByUserAndBadge(
      user.id,
      badge.id,
    );
    if (existing && existing.isActive) {
      throw new Error('You already have this badge');
    }

    // Check balance - ensure price is not null
    const price = badge.price ?? 0;
    if (price <= 0) {
      throw new Error('Invalid badge price');
    }

    const balance = await walletService.getWalletBalance(user.id);
    if (balance < price) {
      throw new Error(`Insufficient balance. Need Rwf ${price}`);
    }

    // FIX: `status: 'COMPLETED'` removed — deductBalance always hardcodes
    // COMPLETED internally and never reads a status from its caller, so
    // this field was silently ignored. The wallet service's type has been
    // narrowed to match what it actually consumes (see WalletCreditMeta in
    // wallet/service.ts), which is what surfaced this as a compile error.
    await walletService.deductBalance(user.id, price, {
      description: `Purchased ${badge.name}`,
      referenceId: badge.id,
      referenceType: 'badge',
    });

    // Deactivate all existing badges (only one active at a time)
    await userBadgesRepository.deactivateAllUserBadges(user.id);

    // Create user badge
    const userBadge = await userBadgesRepository.create({
      userId: user.id,
      badgeId: badge.id,
      isActive: true,
      purchasedAt: new Date().toISOString(),
    });

    // Get one-time reward amount (default to 0 if null)
    const oneTimeReward = badge.oneTimeReward ?? 0;

    // Create reward for badge bonus
    if (oneTimeReward > 0) {
      // FIX (double payment): rewardsService.createReward() already credits
      // the wallet atomically as part of creating the reward row — see its
      // docstring: it's "the ONLY place money enters a wallet from earning
      // activity." A `walletService.addBalance()` call used to follow this,
      // crediting the SAME oneTimeReward a second time — every badge
      // purchase with a nonzero oneTimeReward was paying out 2x. That call
      // has been removed; do not re-add a balance credit here.
      //
      // Also fixed: `amount` -> `baseAmount`, and a `scope` is now supplied.
      // Without a scope, createReward's dedupeKey collapses to a value that
      // doesn't distinguish repeat purchases of the same badge, and — more
      // importantly — this call previously didn't even compile against
      // CreateRewardInput, which requires baseAmount and scope.
      await rewardsService.createReward({
        userId: user.id,
        type: RewardTypeEnum.BADGE_BONUS,
        baseAmount: oneTimeReward,
        description: `${badge.name} one-time reward`,
        sourceId: badge.id,
        sourceType: 'badge',
        scope: userBadge.id, // tied to this specific purchase record
      });
    }

    // Pays the referrer the referral commission on what Boostly keeps from this purchase, if the
    // buyer was referred and hasn't already been credited for this purchase.
    // No-op (qualified: false) if there's no referral — never throws.
    await referralsService.recordPurchaseCommission(user.id, {
      type: QualifyingPurchaseEnum.BADGE_PURCHASE,
      referenceId: userBadge.id,
      netAmount: price,
      label: badge.name,
    });

    await createAuditLog({
      userId: user.id,
      action: 'BADGE_PURCHASED',
      entityType: 'user_badge',
      entityId: userBadge.id,
      newData: { badgeId: badge.id, price },
    });

    return { userBadge, badge };
  }

  async getMyBadges() {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const userBadges = await userBadgesRepository.getUserBadgesWithDetails(
      user.id,
    );
    const activeBadge = userBadges.find((b) => b.isActive);

    return {
      badges: userBadges,
      active: activeBadge || null,
      hasActive: !!activeBadge,
    };
  }

  async getActiveBadge(userId?: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const targetUserId = userId || user.id;

    if (targetUserId !== user.id) {
      await requirePermission(BadgesPermissions.READ);
    }

    const activeBadge =
      await userBadgesRepository.getActiveByUserId(targetUserId);
    return activeBadge || null;
  }

  async getBadgeStats(userId?: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const targetUserId = userId || user.id;

    if (targetUserId !== user.id) {
      await requirePermission(BadgesPermissions.READ);
    }

    return await userBadgesRepository.getStats(targetUserId);
  }

  async getGlobalBadgeStats() {
    await requirePermission(BadgesPermissions.MANAGE);
    return await badgesRepository.getStats();
  }

  // ============================================
  // SUBSCRIPTION PLANS
  // ============================================

  async createSubscriptionPlan(input: CreateSubscriptionPlanInput) {
    await requirePermission(BadgesPermissions.SUBSCRIPTIONS_CREATE);
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const validated = createSubscriptionPlanSchema.parse(input);
    await this.assertPlanRules(validated);

    const plan = await subscriptionPlansRepository.create(validated);

    await createAuditLog({
      userId: user.id,
      action: 'SUBSCRIPTION_PLAN_CREATED',
      entityType: 'subscription_plan',
      entityId: plan.id,
      newData: plan,
    });

    return plan;
  }

  async getSubscriptionPlan(id: string) {
    await requirePermission(BadgesPermissions.SUBSCRIPTIONS_READ);
    const plan = await subscriptionPlansRepository.getById(id);
    if (!plan) throw new Error('Subscription plan not found');
    return plan;
  }

  /** Active plans for members (public). */
  async getAllSubscriptionPlans() {
    return await subscriptionPlansRepository.getAll();
  }

  /** Every plan, hidden ones included, with subscriber counts (admin). */
  async getAllSubscriptionPlansForAdmin() {
    await requirePermission(BadgesPermissions.SUBSCRIPTIONS_READ);
    const [plans, counts] = await Promise.all([
      subscriptionPlansRepository.getAll({ includeInactive: true }),
      subscriptionPlansRepository.getSubscriberCounts(),
    ]);
    return plans.map((p) => ({ ...p, activeSubscribers: counts[p.id] ?? 0 }));
  }

  /**
   * Rules that keep admin-made plans workable: unique keys, the FREE plan
   * stays free and visible (it's the default for everyone), paid plans cost
   * something (a 0 RWF payment can't be verified).
   */
  private async assertPlanRules(
    next: { tier?: string; priceMonthly?: number; isActive?: boolean },
    existing?: { id: string; tier: string; priceMonthly: number; isActive: boolean },
  ) {
    const tier = next.tier ?? existing?.tier;
    const price = next.priceMonthly ?? existing?.priceMonthly ?? 0;
    if (next.tier && next.tier !== existing?.tier) {
      const clash = await subscriptionPlansRepository.getByTier(next.tier);
      if (clash) throw new Error(`A plan with key ${next.tier} already exists`);
      if (existing?.tier === 'FREE') throw new Error("The FREE plan's key can't be changed");
    }
    if (tier === 'FREE') {
      if (price !== 0) throw new Error('The FREE plan must cost 0 RWF');
      if (next.isActive === false) throw new Error("The FREE plan can't be hidden: it's the default plan");
    } else if (price <= 0) {
      throw new Error('Paid plans need a monthly price above 0 RWF');
    }
  }

  async updateSubscriptionPlan(id: string, input: UpdateSubscriptionPlanInput) {
    await requirePermission(BadgesPermissions.SUBSCRIPTIONS_UPDATE);
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const existing = await subscriptionPlansRepository.getById(id);
    if (!existing) throw new Error('Subscription plan not found');

    const validated = updateSubscriptionPlanSchema.parse(input);
    await this.assertPlanRules(validated, existing);
    const updated = await subscriptionPlansRepository.update(id, validated);

    await createAuditLog({
      userId: user.id,
      action: 'SUBSCRIPTION_PLAN_UPDATED',
      entityType: 'subscription_plan',
      entityId: id,
      oldData: existing,
      newData: updated,
    });

    return updated;
  }

  async deleteSubscriptionPlan(id: string) {
    await requirePermission(BadgesPermissions.SUBSCRIPTIONS_DELETE);
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const existing = await subscriptionPlansRepository.getById(id);
    if (!existing) throw new Error('Subscription plan not found');
    if (existing.tier === 'FREE') {
      throw new Error("The FREE plan can't be deleted: it's the default plan");
    }

    try {
      await subscriptionPlansRepository.delete(id);
    } catch (err) {
      // user_subscriptions.planId is ON DELETE RESTRICT.
      const text = `${err instanceof Error ? err.message : ''} ${
        (err as { cause?: { message?: string } })?.cause?.message ?? ''
      }`;
      if (/FOREIGN KEY|SQLITE_CONSTRAINT/i.test(text)) {
        throw new Error(
          'This plan has subscribers, so it cannot be deleted. Deactivate it instead.',
        );
      }
      throw err;
    }

    await createAuditLog({
      userId: user.id,
      action: 'SUBSCRIPTION_PLAN_DELETED',
      entityType: 'subscription_plan',
      entityId: id,
      oldData: existing,
    });
  }

  // ============================================
  // USER SUBSCRIPTIONS
  // ============================================

  async subscribeToPlan(input: SubscribeToPlanInput) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const validated = subscribeToPlanSchema.parse(input);

    const plan = await subscriptionPlansRepository.getById(validated.planId);
    if (!plan) throw new Error('Subscription plan not found');

    if (!plan.isActive || plan.tier === 'FREE') throw new Error('This plan cannot be bought');

    // Same rules as the mobile money checkout: renewals pay full price,
    // upgrades get credit for unused days, downgrades wait for the plan to end.
    const quote = await quotePlan(user.id, plan, validated.billingCycle);
    if (quote.kind === 'DOWNGRADE_BLOCKED') throw new Error(quote.message ?? 'You cannot switch to this plan yet');
    const due = quote.due;

    // Take the money atomically: the balance check and the debit are one
    // UPDATE, so two purchases at once can never overdraw the wallet.
    let transactionId: string | null = null;
    if (due > 0) {
      const [debited] = await db
        .update(wallets)
        .set({ balance: sql`${wallets.balance} - ${due}`, updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))` })
        .where(and(eq(wallets.userId, user.id), gte(wallets.balance, due)))
        .returning();
      if (!debited) throw new Error(`Insufficient balance. You need ${due.toLocaleString()} RWF.`);
      const [tx] = await db
        .insert(transactions)
        .values({
          userId: user.id,
          walletId: debited.id,
          type: TransactionTypeEnum.DEBIT,
          amount: due,
          currency: debited.defaultCurrency,
          amountInBase: due,
          description:
            quote.kind === 'UPGRADE'
              ? `Upgrade to ${plan.name} (${quote.credit.toLocaleString()} RWF credit applied)`
              : `${plan.name} subscription (${validated.billingCycle})`,
          referenceId: plan.id,
          referenceType: 'subscription',
          status: TransactionStatusEnum.COMPLETED,
          completedAt: new Date().toISOString(),
        })
        .returning();
      transactionId = tx?.id ?? null;
    }

    let subscription;
    try {
      subscription = await activateSubscription({
        userId: user.id,
        plan,
        billingCycle: validated.billingCycle,
        autoRenew: validated.autoRenew || false,
        amountPaid: due,
        source: 'WALLET',
        actorId: user.id,
      });
    } catch (error) {
      // Activation failed after paying: give the money back.
      if (due > 0) {
        await db
          .update(wallets)
          .set({ balance: sql`${wallets.balance} + ${due}` })
          .where(eq(wallets.userId, user.id));
        if (transactionId) {
          await db
            .update(transactions)
            .set({ status: TransactionStatusEnum.FAILED, description: `Refunded: ${plan.name} could not be activated` })
            .where(eq(transactions.id, transactionId));
        }
      }
      throw error;
    }

    return { subscription, plan, quote };
  }

  async getMySubscription() {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const subscription = await userSubscriptionsRepository.getActiveByUserId(
      user.id,
    );
    if (!subscription) return null;

    // Get the plan details
    const plan = await subscriptionPlansRepository.getById(subscription.planId);

    return {
      subscription,
      plan,
      daysRemaining: subscription.expiresAt
        ? Math.ceil(
            (new Date(subscription.expiresAt).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24),
          )
        : null,
    };
  }

  async cancelMySubscription() {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const subscription = await userSubscriptionsRepository.getActiveByUserId(
      user.id,
    );
    if (!subscription) throw new Error('No active subscription found');

    const cancelled = await userSubscriptionsRepository.cancelSubscription(
      subscription.id,
    );

    await createAuditLog({
      userId: user.id,
      action: 'SUBSCRIPTION_CANCELLED',
      entityType: 'user_subscription',
      entityId: subscription.id,
      newData: { cancelledAt: new Date().toISOString() },
    });

    return cancelled;
  }

  async renewSubscription(id: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const subscription = await userSubscriptionsRepository.getById(id);
    if (!subscription) throw new Error('Subscription not found');
    if (subscription.userId !== user.id) {
      await requirePermission(BadgesPermissions.SUBSCRIPTIONS_MANAGE);
    }

    // Get the plan details
    const plan = await subscriptionPlansRepository.getById(subscription.planId);
    if (!plan) throw new Error('Plan not found');

    // Check balance - ensure prices are not null
    const price =
      subscription.billingCycle === 'MONTHLY'
        ? (plan.priceMonthly ?? 0)
        : (plan.priceYearly ?? 0);

    if (price <= 0) {
      throw new Error('Invalid plan price');
    }

    const balance = await walletService.getWalletBalance(user.id);
    if (balance < price) {
      throw new Error(`Insufficient balance. Need Rwf ${price}`);
    }

    // FIX: `status: 'COMPLETED'` removed — see purchaseBadge() above for why.
    await walletService.deductBalance(user.id, price, {
      description: `${plan.name} subscription renewal (${subscription.billingCycle})`,
      referenceId: plan.id,
      referenceType: 'subscription',
    });

    // Extend expiry
    const newExpiry = new Date();
    if (subscription.billingCycle === 'MONTHLY') {
      newExpiry.setMonth(newExpiry.getMonth() + 1);
    } else {
      newExpiry.setFullYear(newExpiry.getFullYear() + 1);
    }

    const extended = await userSubscriptionsRepository.extendSubscription(
      id,
      newExpiry.toISOString(),
    );

    // Renewals don't currently qualify (COMMISSION_ON_RENEWALS = false in
    // referrals/service.ts) — this call is a harmless no-op today and stays
    // correct automatically if that flag is ever flipped.
    await referralsService.recordPurchaseCommission(user.id, {
      type: QualifyingPurchaseEnum.SUBSCRIPTION_PAYMENT,
      referenceId: id,
      netAmount: price,
      label: `${plan.name} subscription renewal`,
    });

    await createAuditLog({
      userId: user.id,
      action: 'SUBSCRIPTION_RENEWED',
      entityType: 'user_subscription',
      entityId: id,
      newData: { expiresAt: newExpiry.toISOString() },
    });

    return extended;
  }

  async getSubscriptionStats() {
    await requirePermission(BadgesPermissions.SUBSCRIPTIONS_READ);
    return await userSubscriptionsRepository.getStats();
  }

  async getPlanStats() {
    await requirePermission(BadgesPermissions.SUBSCRIPTIONS_READ);
    return await subscriptionPlansRepository.getStats();
  }
}

// ============================================
// EXPORT SERVICES
// ============================================
export const badgesService = new BadgesService();

// ============================================
// PLAN ACTIVATION (shared by wallet purchase and mobile money approval)
// ============================================

/**
 * Activates (or renews / switches) a member's plan after it has been paid.
 *
 * user_subscriptions.userId is UNIQUE, so a member has one row for life:
 * this updates it in place instead of inserting (inserting made anyone with
 * a past subscription unable to subscribe again).
 *
 * Renewing the SAME active plan extends from its current expiry, so paid
 * days are never lost; a different plan starts now.
 */
export async function activateSubscription(params: {
  userId: string;
  plan: SubscriptionPlan;
  billingCycle: 'MONTHLY' | 'YEARLY';
  autoRenew?: boolean;
  amountPaid: number;
  source: 'WALLET' | 'MOBILE_MONEY';
  /** Who triggered it (the member, or the approving admin). */
  actorId: string;
  /** Mobile money payment id, when applicable. */
  paymentId?: string;
}) {
  const { userId, plan, billingCycle } = params;
  const now = new Date();

  const current = await db.query.userSubscriptions.findFirst({
    where: eq(userSubscriptions.userId, userId),
  });

  const stillActive =
    current &&
    current.status === 'ACTIVE' &&
    (!current.expiresAt || new Date(current.expiresAt) > now);
  const base =
    stillActive && current.planId === plan.id && current.expiresAt
      ? new Date(current.expiresAt)
      : now;
  const expiresAt = new Date(base);
  if (billingCycle === 'MONTHLY') expiresAt.setMonth(expiresAt.getMonth() + 1);
  else expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  const values = {
    planId: plan.id,
    status: 'ACTIVE',
    startsAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    cancelledAt: null,
    billingCycle,
    autoRenew: params.autoRenew ?? false,
    updatedAt: now.toISOString(),
  };

  const [subscription] = current
    ? await db
        .update(userSubscriptions)
        .set(values)
        .where(eq(userSubscriptions.id, current.id))
        .returning()
    : await db
        .insert(userSubscriptions)
        .values({ userId, ...values })
        .returning();

  // Each activation is its own event (the row is reused across renewals).
  const activationKey = params.paymentId ?? `${subscription.id}:${values.startsAt}`;

  // No welcome bonus: paying for a plan unlocks tasks, it doesn't pay out
  // a fixed amount. Earnings come only from funded tasks.


  await referralsService.recordPurchaseCommission(userId, {
    type: QualifyingPurchaseEnum.SUBSCRIPTION_PAYMENT,
    referenceId: activationKey,
    netAmount: params.amountPaid,
    label: `${plan.name} subscription`,
  });

  await createAuditLog({
    userId: params.actorId,
    action: 'SUBSCRIPTION_ACTIVATED',
    entityType: 'user_subscription',
    entityId: subscription.id,
    newData: {
      memberId: userId,
      planId: plan.id,
      billingCycle,
      source: params.source,
      paymentId: params.paymentId,
      expiresAt: values.expiresAt,
    },
  });

  await notificationsService
    .notifySubscriptionStatus(userId, plan.name, stillActive && current?.planId === plan.id ? 'renewed' : 'activated')
    .catch(() => {});

  return subscription;
}


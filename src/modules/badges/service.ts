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
import { RewardTypeEnum } from '@/lib/db/schema';
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

    // Pays the referrer 18% of what Boostly keeps from this purchase, if the
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

  async getAllSubscriptionPlans() {
    return await subscriptionPlansRepository.getAll();
  }

  async updateSubscriptionPlan(id: string, input: UpdateSubscriptionPlanInput) {
    await requirePermission(BadgesPermissions.SUBSCRIPTIONS_UPDATE);
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const existing = await subscriptionPlansRepository.getById(id);
    if (!existing) throw new Error('Subscription plan not found');

    const validated = updateSubscriptionPlanSchema.parse(input);
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

    await subscriptionPlansRepository.delete(id);

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

    // Check if user already has active subscription
    const existing = await userSubscriptionsRepository.getActiveByUserId(
      user.id,
    );
    if (existing) {
      // Get the plan name from the existing subscription
      const existingPlan = await subscriptionPlansRepository.getById(
        existing.planId,
      );
      throw new Error(
        `You already have an active subscription: ${existingPlan?.name || 'Unknown plan'}`,
      );
    }

    // Check balance - ensure prices are not null
    const price =
      validated.billingCycle === 'MONTHLY'
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
      description: `${plan.name} subscription (${validated.billingCycle})`,
      referenceId: plan.id,
      referenceType: 'subscription',
    });

    // Calculate expiry
    const expiresAt = new Date();
    if (validated.billingCycle === 'MONTHLY') {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    }

    // Create subscription
    const subscription = await userSubscriptionsRepository.create({
      userId: user.id,
      planId: plan.id,
      status: 'ACTIVE',
      startsAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      billingCycle: validated.billingCycle,
      autoRenew: validated.autoRenew || false,
    });

    // Create subscription bonus reward (dailyEarnings * 30)
    const bonusAmount = (plan.dailyEarnings ?? 0) * 30;
    if (bonusAmount > 0) {
      // FIX: `amount` -> `baseAmount`, plus a required `scope`. This call
      // previously didn't compile against CreateRewardInput (same class of
      // error as purchaseBadge() above). Scoped to this subscription
      // instance so a later re-subscribe (new subscription row) can still
      // earn its own welcome bonus, but this exact subscription can't be
      // double-credited by a retried request.
      await rewardsService.createReward({
        userId: user.id,
        type: RewardTypeEnum.SUBSCRIPTION_BONUS,
        baseAmount: bonusAmount,
        description: `Welcome to ${plan.name} subscription`,
        sourceId: plan.id,
        sourceType: 'subscription',
        scope: subscription.id,
      });
    }

    // Same referral commission as purchaseBadge() — see comment there.
    await referralsService.recordPurchaseCommission(user.id, {
      type: QualifyingPurchaseEnum.SUBSCRIPTION_PAYMENT,
      referenceId: subscription.id,
      netAmount: price,
      label: `${plan.name} subscription`,
    });

    await createAuditLog({
      userId: user.id,
      action: 'SUBSCRIPTION_CREATED',
      entityType: 'user_subscription',
      entityId: subscription.id,
      newData: { planId: plan.id, billingCycle: validated.billingCycle },
    });

    return { subscription, plan };
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

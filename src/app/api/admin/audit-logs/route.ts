// src/app/api/admin/audit-logs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { requirePermission } from '@/lib/auth/permissions';
import { PermissionKeys } from '@/modules/rbac/permissions';
import { db } from '@/lib/db';
import {
  auditLogs,
  AuditEntityType,
  auditEntityTypes,
} from '@/lib/db/schema/audit';
import { users } from '@/lib/db/schema/users';
import { roles } from '@/lib/db/schema/rbac';
import { userRoles } from '@/lib/db/schema/rbac';
import { and, eq, like, or, sql, desc, SQL } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// ============================================
// BOOSTLY ACTION DESCRIPTION MAP
// ============================================

const actionDescriptionMap: Record<string, string> = {
  // Auth
  LOGIN: 'User logged in',
  LOGOUT: 'User logged out',
  LOGIN_FAILED: 'Login attempt failed',
  PASSWORD_CHANGED: 'Password changed',
  PASSWORD_RESET_REQUESTED: 'Password reset requested',
  PASSWORD_RESET_COMPLETED: 'Password reset completed',
  PASSWORD_RESET_FAILED: 'Password reset failed',
  EMAIL_VERIFIED: 'Email verified',
  VERIFICATION_FAILED: 'Verification failed',
  TWO_FA_ENABLED: '2FA enabled',
  TWO_FA_DISABLED: '2FA disabled',
  TWO_FA_VERIFIED: '2FA verified',

  // Users
  USER_CREATED: 'User created',
  USER_UPDATED: 'User updated',
  USER_ACTIVATED: 'User activated',
  USER_DEACTIVATED: 'User deactivated',
  USER_DELETED: 'User deleted',
  USER_ROLE_ASSIGNED: 'Role assigned to user',
  USER_ROLE_REVOKED: 'Role revoked from user',
  PROFILE_UPDATED: 'Profile updated',
  EMAIL_CHANGED: 'Email changed',
  AVATAR_UPDATED: 'Avatar updated',
  AVATAR_REMOVED: 'Avatar removed',

  // Roles & Permissions
  ROLE_CREATED: 'Role created',
  ROLE_UPDATED: 'Role updated',
  ROLE_DELETED: 'Role deleted',
  PERMISSION_ASSIGNED_TO_ROLE: 'Permission assigned to role',
  PERMISSION_REVOKED_FROM_ROLE: 'Permission revoked from role',

  // ========== BOOSTLY CONTENT ==========
  VIDEO_CREATED: 'Video added to library',
  VIDEO_UPDATED: 'Video updated',
  VIDEO_DELETED: 'Video removed from library',
  VIDEO_PUBLISHED: 'Video published',
  VIDEO_UNPUBLISHED: 'Video unpublished',
  VIDEO_WATCHED: 'Video watched by user',
  VIDEO_WATCH_COMPLETED: 'Video watch completed',

  GAME_CREATED: 'Game added to library',
  GAME_UPDATED: 'Game updated',
  GAME_DELETED: 'Game removed from library',
  GAME_PUBLISHED: 'Game published',
  GAME_UNPUBLISHED: 'Game unpublished',
  GAME_PLAYED: 'Game played by user',
  GAME_PLAY_COMPLETED: 'Game play completed',

  SURVEY_CREATED: 'Survey created',
  SURVEY_UPDATED: 'Survey updated',
  SURVEY_DELETED: 'Survey deleted',
  SURVEY_PUBLISHED: 'Survey published',
  SURVEY_UNPUBLISHED: 'Survey unpublished',
  SURVEY_RESPONSE_SUBMITTED: 'Survey response submitted',
  SURVEY_RESPONSE_COMPLETED: 'Survey response completed',

  // ========== BOOSTLY REWARDS ==========
  REWARD_CREATED: 'Reward created',
  REWARD_CLAIMED: 'Reward claimed by user',
  REWARD_EXPIRED: 'Reward expired',
  REWARD_CANCELLED: 'Reward cancelled',

  DAILY_BONUS_CLAIMED: 'Daily bonus claimed',
  DAILY_BONUS_MISSED: 'Daily bonus missed',
  STREAK_BROKEN: 'Streak broken',

  AD_WATCH_STARTED: 'Ad watch started',
  AD_WATCH_COMPLETED: 'Ad watch completed',
  AD_WATCH_REWARD_CLAIMED: 'Ad reward claimed',

  // ========== BOOSTLY WALLET ==========
  WALLET_CREATED: 'Wallet created',
  WALLET_BALANCE_ADDED: 'Balance added to wallet',
  WALLET_BALANCE_DEDUCTED: 'Balance deducted from wallet',
  TRANSACTION_CREATED: 'Transaction created',
  TRANSACTION_COMPLETED: 'Transaction completed',
  TRANSACTION_FAILED: 'Transaction failed',

  WITHDRAWAL_REQUESTED: 'Withdrawal requested',
  WITHDRAWAL_APPROVED: 'Withdrawal approved',
  WITHDRAWAL_REJECTED: 'Withdrawal rejected',
  WITHDRAWAL_COMPLETED: 'Withdrawal completed',
  WITHDRAWAL_FAILED: 'Withdrawal failed',

  // ========== BOOSTLY REFERRALS ==========
  REFERRAL_CREATED: 'Referral created',
  REFERRAL_ACTIVATED: 'Referral activated',
  REFERRAL_COMPLETED: 'Referral completed',
  REFERRAL_REWARD_CLAIMED: 'Referral reward claimed',
  REFERRAL_CODE_CREATED: 'Referral code created',
  REFERRAL_CODE_DEACTIVATED: 'Referral code deactivated',

  // ========== BOOSTLY BADGES & SUBSCRIPTIONS ==========
  BADGE_CREATED: 'Badge created',
  BADGE_UPDATED: 'Badge updated',
  BADGE_DELETED: 'Badge deleted',
  BADGE_PURCHASED: 'Badge purchased by user',
  BADGE_ACTIVATED: 'Badge activated',
  BADGE_DEACTIVATED: 'Badge deactivated',

  SUBSCRIPTION_CREATED: 'Subscription created',
  SUBSCRIPTION_CANCELLED: 'Subscription cancelled',
  SUBSCRIPTION_RENEWED: 'Subscription renewed',
  SUBSCRIPTION_EXPIRED: 'Subscription expired',
  SUBSCRIPTION_UPGRADED: 'Subscription upgraded',

  // ========== ADMIN ==========
  ADMIN_ACTION: 'Admin action performed',
  ADMIN_IMPERSONATE_START: 'Admin started impersonating user',
  ADMIN_IMPERSONATE_END: 'Admin ended impersonation',
  ADMIN_CONTENT_MODERATION: 'Content moderated by admin',
  ADMIN_USER_SUSPENDED: 'User suspended by admin',
  ADMIN_USER_UNSUSPENDED: 'User unsuspended by admin',

  // ========== SECURITY ==========
  SECURITY_EVENT: 'Security event logged',
  SUSPICIOUS_ACTIVITY_DETECTED: 'Suspicious activity detected',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',

  // ========== SYSTEM ==========
  SYSTEM_CONFIG_CHANGED: 'System configuration changed',
  DATABASE_BACKUP: 'Database backup created',
  DATABASE_RESTORE: 'Database restored',
  SYSTEM_MAINTENANCE: 'System maintenance performed',

  // ========== COMMUNICATIONS ==========
  EMAIL_SENT: 'Email sent',
  EMAIL_FAILED: 'Email delivery failed',
  NOTIFICATION_SENT: 'Notification sent',

  // ========== SUDO MODE ==========
  SUDO_MODE_ACTIVATED: 'Sudo mode activated',
  SUDO_MODE_DEACTIVATED: 'Sudo mode deactivated',
  SUDO_MODE_FAILED: 'Sudo mode verification failed',

  // ========== AUDIT ==========
  AUDIT_EXPORTED: 'Audit logs exported',
  AUDIT_CLEARED: 'Audit logs cleared',
};

// ============================================
// HELPER: Generate description from action and data
// ============================================

function generateDescription(action: string, newData: string | null): string {
  // Check if we have a custom description from the action map
  if (actionDescriptionMap[action]) {
    let description = actionDescriptionMap[action];

    // Try to add context from data
    if (newData) {
      try {
        const parsed = JSON.parse(newData);

        // ========== BOOSTLY CONTENT CONTEXT ==========
        if (action === 'VIDEO_CREATED' && parsed.title) {
          description = `Video "${parsed.title}" added to library`;
        }
        if (action === 'VIDEO_WATCH_COMPLETED' && parsed.rewardAmount) {
          description = `Video watched, earned Rwf ${parsed.rewardAmount}`;
        }

        if (action === 'GAME_CREATED' && parsed.name) {
          description = `Game "${parsed.name}" added to library`;
        }
        if (action === 'GAME_PLAY_COMPLETED' && parsed.rewardAmount) {
          description = `Game played, earned Rwf ${parsed.rewardAmount}`;
        }

        if (action === 'SURVEY_CREATED' && parsed.title) {
          description = `Survey "${parsed.title}" created`;
        }
        if (action === 'SURVEY_RESPONSE_COMPLETED' && parsed.rewardAmount) {
          description = `Survey completed, earned Rwf ${parsed.rewardAmount}`;
        }

        // ========== BOOSTLY REWARDS ==========
        if (action === 'REWARD_CLAIMED' && parsed.amount) {
          description = `Reward of Rwf ${parsed.amount} claimed`;
        }
        if (
          action === 'DAILY_BONUS_CLAIMED' &&
          parsed.streakDay &&
          parsed.amount
        ) {
          description = `Day ${parsed.streakDay} streak bonus of Rwf ${parsed.amount} claimed`;
        }
        if (action === 'AD_WATCH_COMPLETED' && parsed.rewardAmount) {
          description = `Ad watched, earned Rwf ${parsed.rewardAmount}`;
        }

        // ========== BOOSTLY WALLET ==========
        if (action === 'WITHDRAWAL_REQUESTED' && parsed.amount) {
          description = `Withdrawal of Rwf ${parsed.amount} requested`;
        }
        if (action === 'WITHDRAWAL_APPROVED' && parsed.processedBy) {
          description = `Withdrawal approved by ${parsed.processedBy}`;
        }
        if (action === 'WITHDRAWAL_REJECTED' && parsed.reason) {
          description = `Withdrawal rejected: ${parsed.reason}`;
        }

        // ========== BOOSTLY REFERRALS ==========
        if (action === 'REFERRAL_CREATED' && parsed.referrerId) {
          description = `New referral created by user ${parsed.referrerId}`;
        }

        // ========== BOOSTLY BADGES ==========
        if (action === 'BADGE_PURCHASED' && parsed.badgeId && parsed.price) {
          description = `Badge purchased for Rwf ${parsed.price}`;
        }

        // ========== BOOSTLY SUBSCRIPTIONS ==========
        if (action === 'SUBSCRIPTION_CREATED' && parsed.planId) {
          description = `Subscription to plan ${parsed.planId} created`;
        }

        // ========== ADMIN ACTIONS ==========
        if (
          action === 'ADMIN_CONTENT_MODERATION' &&
          parsed.action &&
          parsed.reason
        ) {
          description = `Content ${parsed.action}: ${parsed.reason}`;
        }
        if (action === 'ADMIN_USER_SUSPENDED' && parsed.reason) {
          description = `User suspended: ${parsed.reason}`;
        }

        // ========== SECURITY ==========
        if (action === 'SUSPICIOUS_ACTIVITY_DETECTED' && parsed.activity) {
          description = `Suspicious activity detected: ${parsed.activity}`;
        }

        // Use notes if provided
        if (parsed.notes) {
          description = parsed.notes;
        }
      } catch {
        // JSON parse failed, use the base description
      }
    }

    return description;
  }

  // Fallback: format the action string
  return action
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

// Type guard to validate entity type
function isValidEntityType(value: string): value is AuditEntityType {
  return (auditEntityTypes as readonly string[]).includes(value);
}

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await requirePermission(PermissionKeys.AUDIT_READ);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const search = url.searchParams.get('search') || '';
    const actionFilter = url.searchParams.get('action') || '';
    const moduleFilter = url.searchParams.get('module') || '';
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];

    if (search) {
      conditions.push(
        or(
          like(users.name, `%${search}%`),
          like(auditLogs.action, `%${search}%`),
          like(auditLogs.entityId, `%${search}%`),
        ) as SQL,
      );
    }

    // Action category filter - BOOSTLY UPDATED
    if (actionFilter === 'edit') {
      conditions.push(
        sql`(${auditLogs.action} LIKE '%CREATED%' OR ${auditLogs.action} LIKE '%UPDATED%' OR ${auditLogs.action} LIKE '%PUBLISHED%')`,
      );
    } else if (actionFilter === 'delete') {
      conditions.push(
        sql`(${auditLogs.action} LIKE '%DELETED%' OR ${auditLogs.action} LIKE '%CANCELLED%' OR ${auditLogs.action} LIKE '%REJECTED%')`,
      );
    } else if (actionFilter === 'reward') {
      conditions.push(
        sql`(${auditLogs.action} LIKE '%REWARD%' OR ${auditLogs.action} LIKE '%BONUS%' OR ${auditLogs.action} LIKE '%CLAIMED%')`,
      );
    } else if (actionFilter === 'content') {
      conditions.push(
        sql`(${auditLogs.action} LIKE '%VIDEO%' OR ${auditLogs.action} LIKE '%GAME%' OR ${auditLogs.action} LIKE '%SURVEY%')`,
      );
    } else if (actionFilter === 'wallet') {
      conditions.push(
        sql`(${auditLogs.action} LIKE '%WALLET%' OR ${auditLogs.action} LIKE '%TRANSACTION%' OR ${auditLogs.action} LIKE '%WITHDRAWAL%')`,
      );
    }

    if (moduleFilter && isValidEntityType(moduleFilter)) {
      conditions.push(eq(auditLogs.entityType, moduleFilter));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(whereClause);
    const total = Number(countResult[0]?.count ?? 0);

    const logEntries = await db
      .select({
        id: auditLogs.id,
        userId: auditLogs.userId,
        userName: users.name,
        userAvatar: users.avatar,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        oldData: auditLogs.oldData,
        newData: auditLogs.newData,
        ipAddress: auditLogs.ipAddress,
        userAgent: auditLogs.userAgent,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(whereClause)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);

    // Get roles for users in logs
    const logsWithRoles = await Promise.all(
      logEntries.map(async (log) => {
        let userRole = null;
        if (log.userId) {
          const roleData = await db
            .select({ roleName: roles.name })
            .from(userRoles)
            .innerJoin(roles, eq(userRoles.roleId, roles.id))
            .where(eq(userRoles.userId, log.userId))
            .limit(1);
          userRole = roleData[0]?.roleName || null;
        }

        // Generate human-readable description
        const description = generateDescription(log.action, log.newData);

        return {
          ...log,
          userRole: userRole?.replace(/_/g, ' ') || null,
          description,
        };
      }),
    );

    return NextResponse.json({ logs: logsWithRoles, total });
  } catch (error) {
    console.error('Audit logs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

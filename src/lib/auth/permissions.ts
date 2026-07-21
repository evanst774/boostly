// src/lib/auth/permissions.ts
import { db } from '@/lib/db';
import {
  userRoles,
  roles,
  rolePermissions,
  permissions,
  userPermissions,
} from '@/lib/db/schema/rbac';
import { eq, inArray } from 'drizzle-orm';
import type { PermissionKey } from '@/modules/rbac/permissions';
import { getCurrentUser } from './session.server';

// ==============================================
// Resolve effective permissions for a user
//
// Priority:
//   1. If userPermissions rows exist → use them (explicit override)
//   2. Otherwise → derive from userRoles → rolePermissions chain
//
// This means an empty override array = no permissions (intentional strip).
// Deleting all userPermissions rows = revert to role defaults.
// ============================================
export async function getUserPermissions(userId: string): Promise<string[]> {
  // ── 1. Check for a per-user override ─────────────────────────────────────
  const overrideRows = await db
    .select({ permissionKey: permissions.key })
    .from(userPermissions)
    .innerJoin(permissions, eq(userPermissions.permissionId, permissions.id))
    .where(eq(userPermissions.userId, userId));

  if (overrideRows.length > 0) {
    return overrideRows.map((r) => r.permissionKey);
  }

  // ── 2. Fall back to role-derived permissions ──────────────────────────────
  const userRolesList = await db
    .select({ roleId: userRoles.roleId })
    .from(userRoles)
    .where(eq(userRoles.userId, userId));

  if (userRolesList.length === 0) return [];

  const roleIds = userRolesList.map((r) => r.roleId);

  const result = await db
    .selectDistinct({ permissionKey: permissions.key })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(inArray(rolePermissions.roleId, roleIds));

  return result.map((r) => r.permissionKey);
}

// ============================================
// Check if a user has a specific permission
// ============================================
export async function hasPermission(
  userId: string,
  permissionKey: PermissionKey,
): Promise<boolean> {
  const userPerms = await getUserPermissions(userId);
  return userPerms.includes(permissionKey);
}

// ============================================
// Convenience wrapper for the current session user
// ============================================
export async function hasCurrentUserPermission(
  permissionKey: PermissionKey,
): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return hasPermission(user.id, permissionKey);
}

// ============================================
// Guard for API routes and server actions.
// Throws on failure - caller gets a 401/403 automatically.
// ============================================
export async function requirePermission(
  permissionKey: PermissionKey,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  // Super Admin bypass — full join, no raw sql`` strings
  const userRolesList = await db
    .select({ roleName: roles.name })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, user.id));

  if (userRolesList.some((r) => r.roleName === 'SUPER_ADMIN')) return;

  const hasAccess = await hasPermission(user.id, permissionKey);
  if (!hasAccess) {
    throw new Error(`Forbidden: Missing "${permissionKey}" permission`);
  }
}

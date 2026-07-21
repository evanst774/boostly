// src/modules/badges/permissions.ts
import { PermissionKeys } from '@/modules/rbac/permissions';

export const BadgesPermissions = {
  READ: PermissionKeys.BADGES_READ,
  CREATE: PermissionKeys.BADGES_CREATE,
  UPDATE: PermissionKeys.BADGES_UPDATE,
  DELETE: PermissionKeys.BADGES_DELETE,
  MANAGE: PermissionKeys.BADGES_MANAGE,
  SUBSCRIPTIONS_READ: PermissionKeys.SUBSCRIPTIONS_READ,
  SUBSCRIPTIONS_CREATE: PermissionKeys.SUBSCRIPTIONS_CREATE,
  SUBSCRIPTIONS_UPDATE: PermissionKeys.SUBSCRIPTIONS_UPDATE,
  SUBSCRIPTIONS_DELETE: PermissionKeys.SUBSCRIPTIONS_DELETE,
  SUBSCRIPTIONS_MANAGE: PermissionKeys.SUBSCRIPTIONS_MANAGE,
} as const;

export type BadgesPermission =
  (typeof BadgesPermissions)[keyof typeof BadgesPermissions];

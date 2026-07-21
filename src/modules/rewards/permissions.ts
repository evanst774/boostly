// src/modules/rewards/permissions.ts
import { PermissionKeys } from '@/modules/rbac/permissions';

export const RewardsPermissions = {
  READ: PermissionKeys.REWARDS_READ,
  CREATE: PermissionKeys.REWARDS_CREATE,
  UPDATE: PermissionKeys.REWARDS_UPDATE,
  DELETE: PermissionKeys.REWARDS_DELETE,
  MANAGE: PermissionKeys.REWARDS_MANAGE,
} as const;

export type RewardsPermission =
  (typeof RewardsPermissions)[keyof typeof RewardsPermissions];
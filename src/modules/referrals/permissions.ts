// src/modules/referrals/permissions.ts
import { PermissionKeys } from '@/modules/rbac/permissions';

export const ReferralsPermissions = {
  READ: PermissionKeys.REFERRALS_READ,
  CREATE: PermissionKeys.REFERRALS_CREATE,
  UPDATE: PermissionKeys.REFERRALS_UPDATE,
  DELETE: PermissionKeys.REFERRALS_DELETE,
  MANAGE: PermissionKeys.REFERRALS_MANAGE,
} as const;

export type ReferralsPermission =
  (typeof ReferralsPermissions)[keyof typeof ReferralsPermissions];

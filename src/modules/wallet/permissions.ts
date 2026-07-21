// src/modules/wallet/permissions.ts
import { PermissionKeys } from '@/modules/rbac/permissions';

export const WalletPermissions = {
  READ: PermissionKeys.WALLET_READ,
  UPDATE: PermissionKeys.WALLET_UPDATE,
  TRANSACTIONS_READ: PermissionKeys.TRANSACTIONS_READ,
  TRANSACTIONS_CREATE: PermissionKeys.TRANSACTIONS_CREATE,
  WITHDRAWALS_READ: PermissionKeys.WITHDRAWALS_READ,
  WITHDRAWALS_CREATE: PermissionKeys.WITHDRAWALS_CREATE,
  WITHDRAWALS_APPROVE: PermissionKeys.WITHDRAWALS_APPROVE,
  WITHDRAWALS_REJECT: PermissionKeys.WITHDRAWALS_REJECT,
  WITHDRAWALS_PROCESS: PermissionKeys.WITHDRAWALS_PROCESS,
  MANAGE: PermissionKeys.TRANSACTIONS_MANAGE,
} as const;

export type WalletPermission =
  (typeof WalletPermissions)[keyof typeof WalletPermissions];

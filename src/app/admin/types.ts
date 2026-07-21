// src/app/admin/types.ts
import type { ReactNode } from 'react';

// ============================================
// PERMISSIONS
// ============================================

export interface PermissionOption {
  key: string;
  module: string;
  description: string;
}

export interface AuditLogPermissions {
  canExport: boolean;
}

// ============================================
// ROLES
// ============================================

export interface RoleConfig {
  bg: string;
  color: string;
  label: string;
  icon: ReactNode;
  gradient: string;
  borderColor?: string;
}

export interface RoleOption {
  id: string;
  name: string;
  description?: string | null;
}

export interface RoleData {
  id: string;
  name: string;
  isSystem: boolean;
  permissions: string[];
  userCount?: number;
}

// ============================================
// USERS
// ============================================

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  roleName: string;
  permissions: PermissionOption[];
}

/** UserRecord plus whether their permissions are a custom override of the role default. */
export interface UserDetailData extends UserRecord {
  hasOverride: boolean;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  admins: number;
}

export interface EditUserFormData {
  name: string;
  email: string;
  password: string;
  phone: string;
  roleId: string;
  isActive: boolean;
}

export interface CreateUserFormData {
  name: string;
  email: string;
  password: string;
  phone: string;
  roleId: string;
}

// ============================================
// AUDIT LOGS
// ============================================

export interface AuditLogEntry {
  id: string;
  createdAt: string;
  userName?: string | null;
  userRole?: string | null;
  action: string;
  entityId?: string | null;
  entityType?: string | null;
  ipAddress?: string | null;
  oldData?: string | null;
  newData?: string | null;
}

export interface AuditStats {
  edits: number;
  deletes: number;
  payments: number;
  inventory: number;
}

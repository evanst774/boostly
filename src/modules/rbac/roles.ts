// src/modules/rbac/roles.ts

// ============================================
// SYSTEM ROLES
// ============================================
export const SystemRoles = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  USER: 'USER',
} as const;

export type SystemRole = (typeof SystemRoles)[keyof typeof SystemRoles];

// For validation
export const ALL_ROLES = Object.values(SystemRoles);

// For display
export const RoleLabels: Record<SystemRole, string> = {
  [SystemRoles.SUPER_ADMIN]: 'Super Admin',
  [SystemRoles.ADMIN]: 'Admin',
  [SystemRoles.USER]: 'User',
};

// For descriptions
export const RoleDescriptions: Record<SystemRole, string> = {
  [SystemRoles.SUPER_ADMIN]:
    'Full system control, user management, and configuration',
  [SystemRoles.ADMIN]: 'Content management, user moderation, and analytics',
  [SystemRoles.USER]:
    'Default consumer role - earn rewards, watch videos, play games',
};

// Helper function to validate role name
export function isValidRole(role: string): role is SystemRole {
  return ALL_ROLES.includes(role as SystemRole);
}

// Helper to check if user is admin
export function isAdmin(role: SystemRole): boolean {
  return role === SystemRoles.SUPER_ADMIN || role === SystemRoles.ADMIN;
}

// Helper to check if user has elevated privileges
export function isElevated(role: SystemRole): boolean {
  return role === SystemRoles.SUPER_ADMIN || role === SystemRoles.ADMIN;
}

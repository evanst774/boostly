// src/modules/rbac/index.ts

export * from './roles';
export * from './permissions';

// Re-export from schema for convenience
export {
  roles,
  permissions,
  rolePermissions,
  userRoles,
  userPermissions,
  type Role,
  type Permission,
} from '@/lib/db/schema/rbac';

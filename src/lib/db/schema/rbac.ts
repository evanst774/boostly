// src/lib/db/schema/rbac.ts
import { relations, sql } from 'drizzle-orm';
import {
  integer,
  sqliteTable,
  text,
  index,
  unique,
} from 'drizzle-orm/sqlite-core';
import { users } from './users';

// ============================================
// ROLES TABLE - SIMPLIFIED FOR BOOSTLY
// ============================================
export const roleNames = [
  'SUPER_ADMIN', // Full system access
  'ADMIN', // Content management, user management
  'USER', // Default consumer role
] as const;

export type RoleName = (typeof roleNames)[number];

export const roles = sqliteTable(
  'roles',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text('name').$type<RoleName>().notNull().unique(),
    description: text('description'),
    isSystem: integer('isSystem', { mode: 'boolean' }).notNull().default(true),
    createdAt: text('createdAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    updatedAt: text('updatedAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => [index('roles_name_idx').on(table.name)],
);

// ============================================
// PERMISSIONS TABLE - BOOSTLY SPECIFIC
// ============================================
export const permissions = sqliteTable(
  'permissions',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    key: text('key').notNull().unique(),
    module: text('module').notNull(),
    description: text('description'),
    createdAt: text('createdAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => [
    index('permissions_key_idx').on(table.key),
    index('permissions_module_idx').on(table.module),
  ],
);

// ============================================
// ROLE-PERMISSIONS JUNCTION
// ============================================
export const rolePermissions = sqliteTable(
  'role_permissions',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    roleId: text('roleId')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: text('permissionId')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
    createdAt: text('createdAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => [
    index('role_permissions_role_idx').on(table.roleId),
    index('role_permissions_permission_idx').on(table.permissionId),
    unique().on(table.roleId, table.permissionId),
  ],
);

// ============================================
// USER-ROLES JUNCTION
// ============================================
export const userRoles = sqliteTable(
  'user_roles',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: text('roleId')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    assignedBy: text('assignedBy'),
    assignedAt: text('assignedAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => [
    index('user_roles_user_idx').on(table.userId),
    index('user_roles_role_idx').on(table.roleId),
    unique().on(table.userId, table.roleId),
  ],
);

// ============================================
// USER-PERMISSIONS OVERRIDE JUNCTION
// When ANY row exists for a user, this set REPLACES role-derived permissions.
// When empty, the user's role permissions apply as normal.
// ============================================
export const userPermissions = sqliteTable(
  'user_permissions',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    permissionId: text('permissionId')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
    grantedBy: text('grantedBy'),
    grantedAt: text('grantedAt')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => [
    index('user_permissions_user_idx').on(table.userId),
    unique().on(table.userId, table.permissionId),
  ],
);

// ============================================
// RELATIONS
// ============================================
export const rolesRelations = relations(roles, ({ many }) => ({
  rolePermissions: many(rolePermissions),
  userRoles: many(userRoles),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
  userPermissions: many(userPermissions),
}));

export const rolePermissionsRelations = relations(
  rolePermissions,
  ({ one }) => ({
    role: one(roles, {
      fields: [rolePermissions.roleId],
      references: [roles.id],
    }),
    permission: one(permissions, {
      fields: [rolePermissions.permissionId],
      references: [permissions.id],
    }),
  }),
);

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
}));

export const userPermissionsRelations = relations(
  userPermissions,
  ({ one }) => ({
    user: one(users, {
      fields: [userPermissions.userId],
      references: [users.id],
    }),
    permission: one(permissions, {
      fields: [userPermissions.permissionId],
      references: [permissions.id],
    }),
  }),
);

// ============================================
// TYPES
// ============================================
export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type UserRole = typeof userRoles.$inferSelect;
export type UserPermission = typeof userPermissions.$inferSelect;

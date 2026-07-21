// src/lib/db/seeds/rbac-seed.ts

import { db } from '@/lib/db';
import {
  ALL_ROLES,
  SystemRoles,
  RoleDescriptions,
  type SystemRole,
} from '@/modules/rbac/roles';
import {
  ALL_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  type PermissionKey,
} from '@/modules/rbac/permissions';
import { eq, and } from 'drizzle-orm';
import {
  permissions,
  rolePermissions,
  roles,
  userRoles,
  users,
} from '../schema';
import type { RoleMap, PermissionMap, User } from './types';
import { hashPassword } from '../auth-utils';

interface StandaloneRBACSeedResult {
  roles: RoleMap;
  permissions: PermissionMap;
  adminUser: User;
}

export async function seedRBAC(): Promise<StandaloneRBACSeedResult> {
  console.log('🌱 Seeding Boostly RBAC...');

  // ============================================
  // 1. Create Roles
  // ============================================
  const roleMap = {} as RoleMap;

  for (const roleName of ALL_ROLES) {
    let role = await db.query.roles.findFirst({
      where: eq(roles.name, roleName),
    });

    if (!role) {
      const [newRole] = await db
        .insert(roles)
        .values({
          name: roleName,
          description: RoleDescriptions[roleName as SystemRole],
          isSystem: true,
        })
        .returning();
      role = newRole;
      console.log(`  ✅ Created role: ${roleName}`);
    } else {
      console.log(`  ⚠️ Role already exists: ${roleName}`);
    }
    roleMap[roleName as SystemRole] = role;
  }

  // ============================================
  // 2. Create Permissions
  // ============================================
  const permissionMap = {} as PermissionMap;

  for (const perm of ALL_PERMISSIONS) {
    let permission = await db.query.permissions.findFirst({
      where: eq(permissions.key, perm.key),
    });

    if (!permission) {
      const [newPermission] = await db
        .insert(permissions)
        .values({
          key: perm.key,
          module: perm.module,
          description: perm.description,
        })
        .returning();
      permission = newPermission;
    }
    permissionMap[perm.key as PermissionKey] = permission;
  }
  console.log(`  ✅ Created ${ALL_PERMISSIONS.length} permissions`);

  // ============================================
  // 3. Assign Permissions to Roles
  // ============================================
  for (const [roleName, permissionKeys] of Object.entries(
    DEFAULT_ROLE_PERMISSIONS,
  )) {
    const role = roleMap[roleName as SystemRole];
    if (!role) continue;

    // Clear existing assignments
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, role.id));

    // Assign new permissions
    let assignedCount = 0;
    for (const permKey of permissionKeys) {
      const permission = permissionMap[permKey as PermissionKey];
      if (permission) {
        await db
          .insert(rolePermissions)
          .values({
            roleId: role.id,
            permissionId: permission.id,
          })
          .onConflictDoNothing();
        assignedCount++;
      }
    }
    console.log(`  ✅ Assigned ${assignedCount} permissions to ${roleName}`);
  }

  // ============================================
  // 4. Get or create Super Admin User (real credentials from env)
  // ============================================
  const adminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@boostly.rw';
  const adminPassword = process.env.SUPER_ADMIN_PASSWORD || 'BoostlyAdmin123!';
  let adminUser = await db.query.users.findFirst({
    where: eq(users.email, adminEmail),
  });

  if (!adminUser) {
    const [newAdmin] = await db
      .insert(users)
      .values({
        email: adminEmail,
        passwordHash: await hashPassword(adminPassword),
        name: 'Boostly System Administrator',
        isActive: true,
        emailVerifiedAt: new Date().toISOString(),
        failedLoginAttempts: 0,
        is2FAEnabled: false,
        twoFAEnabledMethods: [],
      })
      .returning();
    adminUser = newAdmin;
    console.log(`  ✅ Created super admin: ${adminEmail}`);
  }

  // Ensure SUPER_ADMIN role is assigned
  const superAdminRole = roleMap[SystemRoles.SUPER_ADMIN];
  if (superAdminRole) {
    const existingAssignment = await db.query.userRoles.findFirst({
      where: and(
        eq(userRoles.userId, adminUser.id),
        eq(userRoles.roleId, superAdminRole.id),
      ),
    });

    if (!existingAssignment) {
      await db.insert(userRoles).values({
        userId: adminUser.id,
        roleId: superAdminRole.id,
        assignedBy: adminUser.id,
      });
      console.log(`  ✅ Assigned SUPER_ADMIN role to ${adminEmail}`);
    }
  }

  console.log('🎉 Boostly RBAC seeding complete!');

  return {
    roles: roleMap,
    permissions: permissionMap,
    adminUser,
  };
}

// Run if executed directly
if (require.main === module) {
  seedRBAC().catch(console.error);
}

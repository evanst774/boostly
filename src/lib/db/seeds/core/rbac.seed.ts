// src/lib/db/seeds/core/rbac.seed.ts
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
} from '@/lib/db/schema';
import type { SeedRBACResult, RoleMap, PermissionMap } from '../types';
import { hashPassword } from '@/lib/db/auth-utils';
import { SEED_CONFIG } from '../config';

export async function seedRBAC(): Promise<SeedRBACResult> {
  console.log('🌱 Seeding RBAC...');

  // 1. Create Roles
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

  // 2. Create Permissions
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

  // 3. Assign Permissions to Roles
  for (const [roleName, permissionKeys] of Object.entries(
    DEFAULT_ROLE_PERMISSIONS,
  )) {
    const role = roleMap[roleName as SystemRole];
    if (!role) continue;

    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, role.id));
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

  // 4. Create Super Admin if not exists
  const { email, password, name, phone } = SEED_CONFIG.superAdmin;
  let adminUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!adminUser) {
    const hashedPassword = await hashPassword(password);
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        passwordHash: hashedPassword,
        name,
        phone,
        isActive: true,
        emailVerifiedAt: new Date().toISOString(),
        failedLoginAttempts: 0,
        is2FAEnabled: false,
        twoFAEnabledMethods: [],
      })
      .returning();
    adminUser = newUser;
    console.log(`  ✅ Created super admin: ${email}`);

    // Assign SUPER_ADMIN role
    const superAdminRole = roleMap[SystemRoles.SUPER_ADMIN];
    if (superAdminRole) {
      await db.insert(userRoles).values({
        userId: adminUser.id,
        roleId: superAdminRole.id,
        assignedBy: adminUser.id,
      });
      console.log(`  ✅ Assigned SUPER_ADMIN role`);
    }
  }

  // 5. Create default user
  let regularUser = await db.query.users.findFirst({
    where: eq(users.email, SEED_CONFIG.defaultUser.email),
  });

  if (!regularUser) {
    const hashedPassword = await hashPassword(SEED_CONFIG.defaultUser.password);
    const [newUser] = await db
      .insert(users)
      .values({
        email: SEED_CONFIG.defaultUser.email,
        passwordHash: hashedPassword,
        name: SEED_CONFIG.defaultUser.name,
        phone: SEED_CONFIG.defaultUser.phone,
        isActive: true,
        emailVerifiedAt: new Date().toISOString(),
        failedLoginAttempts: 0,
        is2FAEnabled: false,
        twoFAEnabledMethods: [],
      })
      .returning();
    regularUser = newUser;
    console.log(`  ✅ Created default user: ${SEED_CONFIG.defaultUser.email}`);

    // Assign USER role
    const userRole = roleMap[SystemRoles.USER];
    if (userRole) {
      await db.insert(userRoles).values({
        userId: regularUser.id,
        roleId: userRole.id,
        assignedBy: adminUser.id,
      });
      console.log(`  ✅ Assigned USER role`);
    }
  }

  console.log('🎉 RBAC seeding complete!');
  return { roles: roleMap, permissions: permissionMap, adminUser, regularUser };
}

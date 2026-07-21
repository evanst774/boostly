// src/lib/db/seeds/users/users.seed.ts
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { userRoles } from '@/lib/db/schema/rbac';
import { wallets } from '@/lib/db/schema/wallet';
import { referralCodes } from '@/lib/db/schema/referrals';
import { hashPassword } from '@/lib/db/auth-utils';
import { eq, and } from 'drizzle-orm';
import type { SeedUsersResult, User } from '../types';

interface UserSeedData {
  name: string;
  email: string;
  phone: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
  isActive?: boolean;
}

export async function seedUsers(): Promise<SeedUsersResult> {
  console.log('  👤 Seeding users with roles...');

  // Define users with their roles
  const userData: UserSeedData[] = [
    // Super Admin (already created in rbac-seed, but we'll ensure it exists)
    {
      name: 'Boostly System Administrator',
      email: process.env.SUPER_ADMIN_EMAIL || 'admin@boostly.rw',
      phone: '+250788000000',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
    // Admin users
    {
      name: 'Alice Mukamana',
      email: 'alice@boostly.rw',
      phone: '+250788123001',
      role: 'ADMIN',
      isActive: true,
    },
    {
      name: 'Jean Niyonzima',
      email: 'jean@boostly.rw',
      phone: '+250788123002',
      role: 'ADMIN',
      isActive: true,
    },
    // Regular users
    {
      name: 'Grace Kagabo',
      email: 'grace@boostly.buzz',
      phone: '+250788123003',
      role: 'USER',
      isActive: true,
    },
    {
      name: 'Patrick Manzi',
      email: 'patrick@boostly.buzz',
      phone: '+250788123004',
      role: 'USER',
      isActive: true,
    },
    {
      name: 'Sarah Rugira',
      email: 'sarah@boostly.buzz',
      phone: '+250788123005',
      role: 'USER',
      isActive: true,
    },
    {
      name: 'John Doe',
      email: 'user@boostly.rw',
      phone: '+250788123456',
      role: 'USER',
      isActive: true,
    },
  ];

  const userList: User[] = [];
  const adminUsers: User[] = [];
  const managerUsers: User[] = [];
  const regularUsers: User[] = [];

  // Get all roles from database
  const roles = await db.query.roles.findMany();
  const roleMap = roles.reduce(
    (acc, role) => {
      acc[role.name] = role;
      return acc;
    },
    {} as Record<string, any>,
  );

  for (const data of userData) {
    let user = await db.query.users.findFirst({
      where: eq(users.email, data.email),
    });

    if (!user) {
      const hashedPassword = await hashPassword(
        data.role === 'SUPER_ADMIN'
          ? process.env.SUPER_ADMIN_PASSWORD || 'BoostlyAdmin123!'
          : 'User123!',
      );

      const [newUser] = await db
        .insert(users)
        .values({
          name: data.name,
          email: data.email,
          phone: data.phone,
          passwordHash: hashedPassword,
          isActive: data.isActive ?? true,
          emailVerifiedAt: new Date().toISOString(),
          failedLoginAttempts: 0,
          is2FAEnabled: false,
          twoFAEnabledMethods: [],
        })
        .returning();
      user = newUser;
      console.log(`    ✅ Created user: ${data.name} (${data.email})`);

      // Create wallet for user
      await db.insert(wallets).values({
        userId: user.id,
        balance:
          data.role === 'SUPER_ADMIN'
            ? 0
            : Math.floor(Math.random() * 10000) + 1000,
        totalEarned:
          data.role === 'SUPER_ADMIN'
            ? 0
            : Math.floor(Math.random() * 20000) + 5000,
        totalWithdrawn: 0,
        pendingWithdrawal: 0,
        defaultCurrency: 'RWF',
      });
      console.log(`      ✅ Created wallet for ${data.name}`);

      // Create referral code for user
      const code = `REF${user.id.substring(0, 4).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      await db.insert(referralCodes).values({
        userId: user.id,
        code: code,
        isActive: true,
        timesUsed: 0,
      });
      console.log(`      ✅ Created referral code for ${data.name}`);
    } else {
      console.log(`    ⚠️ User already exists: ${data.email}`);
    }

    // Assign role to user
    const role = roleMap[data.role];
    if (role && user) {
      const existingAssignment = await db.query.userRoles.findFirst({
        where: and(
          eq(userRoles.userId, user.id),
          eq(userRoles.roleId, role.id),
        ),
      });

      if (!existingAssignment) {
        // Get admin user for assignedBy
        const adminUser = await db.query.users.findFirst({
          where: eq(
            users.email,
            process.env.SUPER_ADMIN_EMAIL || 'admin@boostly.rw',
          ),
        });

        await db.insert(userRoles).values({
          userId: user.id,
          roleId: role.id,
          assignedBy: adminUser?.id || user.id,
        });
        console.log(`      ✅ Assigned ${data.role} role to ${data.name}`);
      }
    }

    // Categorize users by role
    if (user) {
      userList.push(user);
      if (data.role === 'SUPER_ADMIN' || data.role === 'ADMIN') {
        adminUsers.push(user);
      } else {
        regularUsers.push(user);
      }
    }
  }

  console.log(`    ✅ Seeded ${userList.length} users with proper roles`);
  console.log(`       - ${adminUsers.length} admin users`);
  console.log(`       - ${regularUsers.length} regular users`);

  return {
    count: userList.length,
    users: userList,
    roleAssignments: {
      adminUsers,
      managerUsers: [], // No manager role in Boostly
      regularUsers,
    },
  };
}

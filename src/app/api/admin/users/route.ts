// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { requirePermission } from '@/lib/auth/permissions';
import { PermissionKeys } from '@/modules/rbac/permissions';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import {
  roles,
  permissions,
  rolePermissions,
  userRoles,
} from '@/lib/db/schema/rbac';
import { eq, and, or, like, sql, desc, inArray, SQL } from 'drizzle-orm';
import { hashPassword } from '@/lib/db/auth-utils';
import { buildWelcomeEmailHTML, sendEmail } from '@/lib/mail';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await requirePermission(PermissionKeys.USERS_MANAGE);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const search = url.searchParams.get('search') || '';
    const roleFilter = url.searchParams.get('role') || '';
    const statusFilter = url.searchParams.get('status') || '';
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];
    if (search) {
      conditions.push(
        or(
          like(users.name, `%${search}%`),
          like(users.email, `%${search}%`),
          like(sql`COALESCE(${users.phone}, '')`, `%${search}%`),
        ) as SQL,
      );
    }
    if (statusFilter === 'active') conditions.push(eq(users.isActive, true));
    if (statusFilter === 'inactive') conditions.push(eq(users.isActive, false));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(whereClause);
    let total = Number(countResult[0]?.count ?? 0);

    // Get users WITHOUT passwordHash
    const userList = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        avatar: users.avatar,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    // Fetch roles and permissions for each user from the junction tables
    const usersWithRoles = await Promise.all(
      userList.map(async (u) => {
        // Get roles from userRoles junction table
        const userRoleList = await db
          .select({ roleName: roles.name, roleId: roles.id })
          .from(userRoles)
          .innerJoin(roles, eq(userRoles.roleId, roles.id))
          .where(eq(userRoles.userId, u.id));

        const roleNames = userRoleList.map((r) => r.roleName);
        const primaryRole = roleNames[0] || null;

        // Get permissions through roles
        let userPerms: { key: string; module: string; description: string }[] =
          [];
        if (userRoleList.length > 0) {
          const roleIds = userRoleList.map((r) => r.roleId);
          const rawPerms = await db
            .select({
              key: permissions.key,
              module: permissions.module,
              description: permissions.description,
            })
            .from(permissions)
            .innerJoin(
              rolePermissions,
              eq(permissions.id, rolePermissions.permissionId),
            )
            .where(inArray(rolePermissions.roleId, roleIds))
            .limit(20);

          userPerms = rawPerms.map((p) => ({
            key: p.key,
            module: p.module,
            description: p.description || p.key,
          }));
        }

        return {
          ...u,
          roleName: primaryRole || 'No Role',
          roleId: userRoleList[0]?.roleId || null,
          permissions: userPerms,
        };
      }),
    );

    // Apply role filter after fetching (since role comes from junction table)
    let filteredUsers = usersWithRoles;
    if (roleFilter) {
      filteredUsers = usersWithRoles.filter((u) => u.roleName === roleFilter);
      total = filteredUsers.length;
    }

    return NextResponse.json({ users: filteredUsers, total });
  } catch (error) {
    console.error('Users list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await requirePermission(PermissionKeys.USERS_MANAGE);

    const body = await request.json();
    const {
      name,
      email,
      password,
      roleId,
      phone,
      permissions: selectedPermissions,
    } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email and password are required' },
        { status: 400 },
      );
    }

    // Check if email already exists
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 409 },
      );
    }

    const hashedPassword = await hashPassword(password);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email,
        passwordHash: hashedPassword,
        phone: phone || null,
        roleId: roleId || null,
        isActive: true,
        emailVerifiedAt: new Date().toISOString(),
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        avatar: users.avatar,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        roleId: users.roleId,
      });

    // Assign role through userRoles junction table
    if (roleId) {
      await db.insert(userRoles).values({
        userId: newUser.id,
        roleId: roleId,
        assignedBy: currentUser.id,
      });
    }

    // If custom permissions are provided (without a role), create a personal role
    if (
      selectedPermissions &&
      Array.isArray(selectedPermissions) &&
      selectedPermissions.length > 0 &&
      !roleId
    ) {
      const personalRoleName =
        `USER_${newUser.id.substring(0, 8)}` as (typeof roles.$inferInsert)['name'];

      const [personalRole] = await db
        .insert(roles)
        .values({
          name: personalRoleName,
          description: `Personal role for ${name}`,
          isSystem: false,
        })
        .returning();

      await db.insert(userRoles).values({
        userId: newUser.id,
        roleId: personalRole.id,
        assignedBy: currentUser.id,
      });

      const permRecords = await db
        .select({ id: permissions.id })
        .from(permissions)
        .where(inArray(permissions.key, selectedPermissions));

      if (permRecords.length > 0) {
        await db.insert(rolePermissions).values(
          permRecords.map((p) => ({
            roleId: personalRole.id,
            permissionId: p.id,
          })),
        );
      }
    }

    // Send welcome email - using the correct function name
    if (body.sendWelcomeEmail !== false) {
      const welcomeHtml = buildWelcomeEmailHTML(name, email);
      await sendEmail({
        to: email,
        subject: `Welcome to Boostly, ${name}!`,
        html: welcomeHtml,
        type: 'WELCOME',
      });
    }

    // Also send a notification email with login credentials if password was set
    if (password) {
      // Build credentials email using the email helper
      const credentialsHtml = `
        <div class="greeting">Your Account is Ready, ${name}!</div>
        <div class="text">
          Your Boostly account has been created. You can log in using the credentials below:
        </div>
        <div class="info-box">
          <div class="info-box-item"><strong>Email:</strong> ${email}</div>
          <div class="info-box-item"><strong>Password:</strong> ${password}</div>
          <div style="padding: 8px 0; color: #ef4444; font-size: 12px;">⚠️ Please change your password after your first login.</div>
        </div>
        <div class="btn-wrap">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login" class="btn">Login to Boostly</a>
        </div>
      `;

      // We need to use the email template builder directly
      // Since createBaseEmail doesn't exist, we'll use the sendEmail function with the full HTML
      await sendEmail({
        to: email,
        subject: `Your Boostly Account Credentials`,
        html: credentialsHtml, // This will be wrapped in the email template by sendEmail
        type: 'WELCOME',
      });
    }

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

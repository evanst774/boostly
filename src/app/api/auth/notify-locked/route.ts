// src/app/api/auth/notify-locked/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { auditLogs } from '@/lib/db/schema/audit';
import { eq } from 'drizzle-orm';
import {
  sendEmail,
  buildAccountLockedUserNotificationHTML,
} from '@/lib/mail';

// Admin email addresses (can be configured via environment variables)
const ADMIN_EMAILS = process.env.ADMIN_NOTIFICATION_EMAILS?.split(',') || [
  'admin@boostly.buzz',
  'support@boostly.buzz',
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, reason, details } = body;

    // Try to get user info if userId is provided but email is not
    let userEmail = email;
    let userName = 'Unknown User';
    let userPhone = null;

    if (userId && !userEmail) {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });
      if (user) {
        userEmail = user.email;
        userName = user.name;
        userPhone = user.phone;
      }
    }

    // If we still don't have email, return error
    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 },
      );
    }

    // Get user details if not already fetched
    let userDetails = { name: userName, phone: userPhone, email: userEmail };
    if (!userName || userName === 'Unknown User') {
      const user = await db.query.users.findFirst({
        where: eq(users.email, userEmail),
      });
      if (user) {
        userDetails = {
          name: user.name,
          phone: user.phone,
          email: user.email,
        };
      }
    }

    // Build notification data
    const notificationData = {
      userName: userDetails.name,
      userEmail: userDetails.email,
      userPhone: userDetails.phone,
      reason: reason || 'account_locked',
      details: details || {},
      timestamp: new Date().toISOString(),
      ipAddress:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    };

    // Log to audit trail
    await db.insert(auditLogs).values({
      userId: userId || null,
      action: 'ACCOUNT_LOCKED_NOTIFICATION',
      entityType: 'user',
      entityId: userId || null,
      newData: JSON.stringify(notificationData),
      ipAddress: notificationData.ipAddress,
      userAgent: notificationData.userAgent,
    });

    // Send email notification to all admins
    const emailPromises = ADMIN_EMAILS.map(
      async (adminEmail) =>
        await sendEmail({
          to: adminEmail,
          subject: `Account Locked: ${userDetails.name} - Action Required`,
          html: buildAccountLockedUserNotificationHTML(notificationData),
          type: 'SECURITY',
        }),
    );

    // Also send a confirmation email to the user (optional)
    const userEmailPromise = sendEmail({
      to: userDetails.email,
      subject: 'Your Boostly Account Has Been Locked',
      html: buildAccountLockedUserNotificationHTML(notificationData),
      type: 'SECURITY',
    });

    await Promise.all([...emailPromises, userEmailPromise]);

    return NextResponse.json({
      success: true,
      message: `Notification sent to ${ADMIN_EMAILS.length} admin(s) and user`,
      notifiedAdmins: ADMIN_EMAILS.length,
    });
  } catch (error) {
    console.error('Failed to send locked account notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 },
    );
  }
}

// endpoint to check if user is locked (used by frontend)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
      columns: {
        isActive: true,
        accountLockedUntil: true,
        failedLoginAttempts: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isLocked =
      !user.isActive ||
      (user.accountLockedUntil &&
        new Date(user.accountLockedUntil) > new Date());

    return NextResponse.json({
      isLocked,
      isActive: user.isActive,
      accountLockedUntil: user.accountLockedUntil,
      failedLoginAttempts: user.failedLoginAttempts,
    });
  } catch (error) {
    console.error('Failed to check lock status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

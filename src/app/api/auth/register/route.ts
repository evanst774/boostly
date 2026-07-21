// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import crypto from 'crypto';

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { roles, userRoles } from '@/lib/db/schema/rbac';
import { auditLogs } from '@/lib/db/schema/audit';
import { referralCodes } from '@/lib/db/schema/referrals';
import { wallets } from '@/lib/db/schema/wallet';
import { otpVerifications } from '@/lib/db/schema/auth';
import { hashPassword } from '@/lib/db/auth-utils';
import {
  referralsService,
  REFERRAL_COMMISSION_RATE,
} from '@/modules/referrals/service';

// ─── Validation ─────────────────────────────────────────────

const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  referralCode: z.string().trim().max(32).optional(),
});

// ─── Helpers ────────────────────────────────────────────────

function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function generateOTP(): string {
  // randomInt, not Math.random — an OTP from a predictable PRNG is guessable.
  return crypto.randomInt(100_000, 1_000_000).toString();
}

function generateReferralCode(userId: string): string {
  const prefix = userId.substring(0, 4).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}${random}`;
}

async function sendVerificationEmail(
  email: string,
  name: string,
  token: string,
  otp: string,
): Promise<void> {
  try {
    const { sendEmail, buildVerificationEmailHTML } =
      await import('@/lib/mail');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://boostly.buzz';
    const verificationUrl = `${appUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

    await sendEmail({
      to: email,
      subject: 'Verify Your Email - Boostly',
      html: buildVerificationEmailHTML(name, verificationUrl, email, otp),
      type: 'VERIFICATION',
    });
  } catch (error) {
    // Non-fatal: the account exists and the user can request a resend.
    console.error('[REGISTER] Failed to send verification email:', error);
  }
}

// ─── POST ───────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    const validated = registerSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        {
          message: 'Validation error',
          errors: validated.error.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 },
      );
    }

    const { name, password, referralCode } = validated.data;
    const email = validated.data.email.toLowerCase();

    // ── Duplicate check ────────────────────────────────────
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 409 },
      );
    }

    /**
     * Validate the referral code BEFORE creating anything.
     *
     * The old flow created the user first, then returned 400 for a bad code —
     * leaving an orphaned account behind. The user then retried and hit
     * "email already exists" with no way forward. Check first, fail clean.
     */
    if (referralCode) {
      const code = referralCode.toUpperCase();
      const found = await db.query.referralCodes.findFirst({
        where: eq(referralCodes.code, code),
      });

      if (!found || !found.isActive) {
        return NextResponse.json(
          {
            message: 'Invalid referral code. Please check and try again.',
            code: 'INVALID_REFERRAL',
          },
          { status: 400 },
        );
      }
    }

    const hashedPassword = await hashPassword(password);
    const verificationToken = generateVerificationToken();
    const otpCode = generateOTP();

    /**
     * One transaction for the whole account.
     *
     * These used to be seven sequential writes. A failure after `users` but
     * before `wallets` left an account with no wallet, and every subsequent
     * reward credit threw for that user forever.
     */
    const newUser = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(users)
        .values({
          name,
          email,
          passwordHash: hashedPassword,
          isActive: true,
          emailVerifiedAt: null,
          emailVerificationToken: verificationToken,
          failedLoginAttempts: 0,
          is2FAEnabled: false,
          twoFAEnabledMethods: [],
        })
        .returning();

      const userRole = await tx.query.roles.findFirst({
        where: eq(roles.name, 'USER'),
      });
      if (userRole) {
        await tx.insert(userRoles).values({
          userId: created.id,
          roleId: userRole.id,
          assignedBy: created.id,
        });
      }

      await tx.insert(wallets).values({ userId: created.id });

      await tx.insert(referralCodes).values({
        userId: created.id,
        code: generateReferralCode(created.id),
        isActive: true,
        timesUsed: 0,
      });

      await tx.insert(otpVerifications).values({
        userId: created.id,
        code: otpCode,
        type: 'EMAIL_VERIFICATION',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        used: false,
      });

      return created;
    });

    /**
     * Referral is RECORDED, not PAID.
     *
     * Both bonuses now fire from referralsService.qualifyReferral() when the
     * referee makes a qualifying deposit. Paying at signup meant a bot farm
     * could mint 250 RWF per throwaway email at zero cost — the single most
     * common way referral programmes get drained.
     */
    let referralAttached = false;
    if (referralCode) {
      const result = await referralsService.attachPendingReferral(
        newUser.id,
        referralCode,
      );
      referralAttached = result.attached;
    }

    await sendVerificationEmail(email, name, verificationToken, otpCode);

    await db.insert(auditLogs).values({
      userId: newUser.id,
      action: 'USER_CREATED',
      entityType: 'user',
      entityId: newUser.id,
      newData: JSON.stringify({
        email: newUser.email,
        name: newUser.name,
        referralCode: referralCode ?? null,
        referralAttached,
      }),
      ipAddress: request.headers.get('x-forwarded-for') ?? 'unknown',
      userAgent: request.headers.get('user-agent') ?? 'unknown',
    });

    return NextResponse.json(
      {
        message: 'Account created successfully! Please verify your email.',
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
        },
        referral: referralAttached
          ? {
              status: 'PENDING',
              commissionRate: REFERRAL_COMMISSION_RATE,
              // Be explicit that nothing has been paid. A user told they
              // "earned a bonus" who then sees a zero balance assumes theft.
              message: `Your referral is registered. Whoever invited you earns ${Math.round(REFERRAL_COMMISSION_RATE * 100)}% when you buy a badge or subscription.`,
            }
          : null,
        needsVerification: true,
        verificationMethod: 'link_and_otp',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('[REGISTER] Error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    );
  }
}

// src/lib/mail.ts

import { db } from '../db';
import {
  emailLogs,
  type EmailType,
  type EmailStatus,
} from '../db/schema/email';
import { transporter } from './transporter';
import { waitUntil } from '@vercel/functions';

// ============================================
// BOOSTLY BRAND CONSTANTS
// ============================================

const LOGO_URL = 'https://cdn.boostly.buzz/assets/logo.png';
const COMPANY_NAME = 'Boostly';
const COMPANY_TAGLINE = 'Earn Rewards. Get Paid. Every Day.';
const COMPANY_ADDRESS = 'KG 120 St, Kigali, Rwanda';
const COMPANY_WEBSITE = 'https://boostly.buzz';
const SUPPORT_EMAIL = 'support@boostly.buzz';
const PRIVACY_URL = 'https://boostly.buzz/privacy';
const TERMS_URL = 'https://boostly.buzz/terms';

// Brand Colors
const BRAND_PRIMARY = '#2563EB';
const BRAND_PRIMARY_DARK = '#1D4ED8';
const BRAND_GOLD = '#FBBF24';

interface EmailParams {
  to: string;
  subject: string;
  html: string;
  type: EmailType;
  attachments?: { filename: string; content: Buffer; contentType: string }[];
}

async function logEmail(
  to: string,
  subject: string,
  type: EmailType,
  status: EmailStatus,
  error?: string,
) {
  try {
    await db.insert(emailLogs).values({
      to,
      subject,
      type,
      status,
      error: error || null,
      sentAt: status === 'SENT' ? new Date().toISOString() : null,
    });
  } catch (err) {
    console.error('Failed to log email:', err);
  }
}

// ============================================
// SEND EMAIL - Nodemailer Only
// ============================================

export async function sendEmail({
  to,
  subject,
  html,
  type = 'WELCOME',
  attachments,
}: {
  to: string;
  subject: string;
  html: string;
  type?: EmailType;
  attachments?: { filename: string; content: Buffer; contentType: string }[];
}): Promise<void> {
  const params: EmailParams = { to, subject, html, type, attachments };

  const sendPromise = (async () => {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.error('SMTP credentials missing');
      await logEmail(
        params.to,
        params.subject,
        params.type,
        'FAILED',
        'SMTP credentials missing',
      );
      return;
    }

    try {
      const info = await transporter.sendMail({
        from: `"${COMPANY_NAME}" <${process.env.SMTP_USER}>`,
        to: params.to,
        subject: params.subject,
        html: params.html,
        replyTo: SUPPORT_EMAIL,
        attachments: params.attachments,
      });

      await logEmail(params.to, params.subject, params.type, 'SENT');
      console.log(`Email sent to ${params.to}: ${info.messageId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to send email to ${params.to}:`, message);
      await logEmail(params.to, params.subject, params.type, 'FAILED', message);
    }
  })();

  try {
    waitUntil(sendPromise);
  } catch {
    // Fall through
  }

  return sendPromise;
}

// ============================================
// BOOSTLY EMAIL TEMPLATE BUILDER
// ============================================

function createBoostlyEmail(
  content: string,
  title: string,
  subtitle?: string,
  recipientEmail?: string,
): string {
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title} — ${COMPANY_NAME}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #F8FAFC;
      padding: 40px 20px;
      -webkit-font-smoothing: antialiased;
    }

    .container {
      max-width: 560px;
      margin: 0 auto;
      background: #FFFFFF;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
    }

    /* ── Header ── */
    .header {
      background: linear-gradient(160deg, #0B1220 0%, #111C33 55%, #182544 100%);
      padding: 40px 32px 32px;
      text-align: center;
      border-bottom: 3px solid ${BRAND_GOLD};
    }

    .header-logo {
      display: inline-block;
      margin-bottom: 16px;
    }

    .header-logo-img {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: rgba(255,255,255,0.05);
      padding: 4px;
      object-fit: contain;
    }

    .header-title {
      font-size: 24px;
      font-weight: 700;
      color: #FFFFFF;
      letter-spacing: -0.3px;
      margin-top: 8px;
    }

    .header-subtitle {
      color: rgba(255,255,255,0.6);
      font-size: 14px;
      margin-top: 4px;
      font-weight: 400;
    }

    /* ── Body ── */
    .body {
      padding: 36px 32px;
      background: #FFFFFF;
    }

    .greeting {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 12px;
    }

    .text {
      font-size: 15px;
      color: #6B7280;
      line-height: 1.7;
      margin-bottom: 16px;
    }

    .text strong {
      color: #111827;
    }

    /* ── Divider ── */
    .divider {
      border: none;
      border-top: 1px solid #F3F4F6;
      margin: 24px 0;
    }

    /* ── Code Box ── */
    .code-box {
      background: #F8FAFC;
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin: 24px 0;
    }

    .code-box-label {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #9CA3AF;
      margin-bottom: 12px;
    }

    .code-box-digits {
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 36px;
      font-weight: 700;
      letter-spacing: 8px;
      color: #111827;
      line-height: 1.2;
    }

    .code-box-expiry {
      display: inline-block;
      font-size: 12px;
      font-weight: 500;
      color: #92400E;
      background: #FFFBEB;
      padding: 4px 14px;
      border-radius: 20px;
      margin-top: 12px;
      border: 1px solid #FDE68A;
    }

    /* ── Button ── */
    .btn-wrap {
      text-align: center;
      margin: 28px 0;
    }

    .btn {
      display: inline-block;
      background: ${BRAND_PRIMARY};
      color: #FFFFFF !important;
      text-decoration: none;
      padding: 14px 40px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 16px;
      transition: background 0.2s;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
    }

    .btn:hover {
      background: ${BRAND_PRIMARY_DARK};
    }

    .btn-gold {
      background: ${BRAND_GOLD};
      color: #0B1220 !important;
      box-shadow: 0 4px 12px rgba(251, 191, 36, 0.35);
    }

    .btn-gold:hover {
      background: #F59E0B;
    }

    .btn-outline {
      background: transparent;
      color: ${BRAND_PRIMARY} !important;
      border: 2px solid ${BRAND_PRIMARY};
      box-shadow: none;
    }

    .btn-outline:hover {
      background: #EFF6FF;
    }

    /* ── Info Box ── */
    .info-box {
      background: #F8FAFC;
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      padding: 16px 20px;
      margin: 20px 0;
    }

    .info-box-title {
      font-size: 13px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 8px;
    }

    .info-box-item {
      font-size: 14px;
      color: #6B7280;
      padding: 4px 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .info-box-item::before {
      content: "•";
      color: ${BRAND_PRIMARY};
      font-weight: 700;
    }

    /* ── Warning Box ── */
    .warning-box {
      background: #FFFBEB;
      border: 1px solid #FDE68A;
      border-radius: 12px;
      padding: 14px 18px;
      margin: 20px 0;
    }

    .warning-box-text {
      font-size: 14px;
      color: #78350F;
      line-height: 1.6;
    }

    .warning-box-text strong {
      color: #92400E;
    }

    /* ── Earnings Highlight ── */
    .earnings-box {
      background: linear-gradient(135deg, #EFF6FF, #DBEAFE);
      border: 1px solid #BFDBFE;
      border-radius: 12px;
      padding: 16px 20px;
      margin: 20px 0;
      text-align: center;
    }

    .earnings-box-amount {
      font-size: 28px;
      font-weight: 800;
      color: ${BRAND_PRIMARY};
    }

    .earnings-box-label {
      font-size: 13px;
      color: #6B7280;
      margin-top: 4px;
    }

    /* ── Footer ── */
    .footer {
      background: #F8FAFC;
      padding: 24px 32px;
      text-align: center;
      border-top: 1px solid #F3F4F6;
    }

    .footer-brand {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      text-decoration: none;
      margin-bottom: 12px;
    }

    .footer-brand-logo {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      object-fit: contain;
    }

    .footer-brand-name {
      font-size: 16px;
      font-weight: 700;
      color: #111827;
    }

    .footer-tagline {
      font-size: 13px;
      color: #9CA3AF;
      margin-bottom: 12px;
    }

    .footer-links {
      margin-bottom: 12px;
    }

    .footer-links a {
      font-size: 13px;
      color: #6B7280;
      text-decoration: none;
      margin: 0 10px;
    }

    .footer-links a:hover {
      color: ${BRAND_PRIMARY};
    }

    .footer-links span {
      color: #E5E7EB;
    }

    .footer-copy {
      font-size: 12px;
      color: #9CA3AF;
      padding-top: 12px;
      border-top: 1px solid #E5E7EB;
    }

    .footer-address {
      font-size: 12px;
      color: #9CA3AF;
      margin-bottom: 8px;
    }

    /* ── Mobile ── */
    @media (max-width: 480px) {
      body { padding: 16px 12px; }
      .header { padding: 28px 20px; }
      .body { padding: 24px 20px; }
      .footer { padding: 20px; }
      .header-title { font-size: 20px; }
      .code-box-digits { font-size: 28px; letter-spacing: 4px; }
      .btn { display: block; text-align: center; padding: 14px 20px; }
      .footer-links a { display: inline-block; margin: 4px 6px; }
    }
  </style>
</head>
<body>
  <div class="container">

    <!-- Header -->
    <div class="header">
      <div class="header-logo">
        <img src="${LOGO_URL}" alt="${COMPANY_NAME}" class="header-logo-img">
      </div>
      <div class="header-title">${title}</div>
      ${subtitle ? `<div class="header-subtitle">${subtitle}</div>` : ''}
    </div>

    <!-- Body -->
    <div class="body">
      ${content}
    </div>

    <!-- Footer -->
    <div class="footer">
      <a href="${COMPANY_WEBSITE}" class="footer-brand">
        <img src="${LOGO_URL}" alt="${COMPANY_NAME}" class="footer-brand-logo">
        <span class="footer-brand-name">${COMPANY_NAME}</span>
      </a>
      <p class="footer-tagline">${COMPANY_TAGLINE}</p>
      <p class="footer-address">${COMPANY_ADDRESS}</p>
      ${recipientEmail ? `<p style="font-size:12px;color:#9CA3AF;margin-bottom:12px;">This email was sent to ${recipientEmail}</p>` : ''}
      <div class="footer-links">
        <a href="${COMPANY_WEBSITE}">Website</a>
        <span>|</span>
        <a href="mailto:${SUPPORT_EMAIL}">Support</a>
        <span>|</span>
        <a href="${PRIVACY_URL}">Privacy</a>
        <span>|</span>
        <a href="${TERMS_URL}">Terms</a>
      </div>
      <p class="footer-copy">&copy; ${year} ${COMPANY_NAME}. All rights reserved.</p>
    </div>

  </div>
</body>
</html>`;
}

// ============================================
// BUILDING BLOCKS
// ============================================

function buildCodeBox(code: string, label: string, expiryText: string): string {
  return `
    <div class="code-box">
      <div class="code-box-label">${label}</div>
      <div class="code-box-digits">${code}</div>
      <div class="code-box-expiry">${expiryText}</div>
    </div>`;
}

function buildInfoBox(title: string, items: string[]): string {
  const listItems = items
    .map(
      (item) => `
    <div class="info-box-item">${item}</div>
  `,
    )
    .join('');
  return `
    <div class="info-box">
      <div class="info-box-title">${title}</div>
      ${listItems}
    </div>`;
}

function buildWarningBox(message: string): string {
  return `
    <div class="warning-box">
      <div class="warning-box-text">${message}</div>
    </div>`;
}

function buildEarningsBox(
  amount: number,
  currency: string = 'RWF',
  label: string = 'Earnings',
): string {
  return `
    <div class="earnings-box">
      <div class="earnings-box-amount">${amount.toLocaleString()} ${currency}</div>
      <div class="earnings-box-label">${label}</div>
    </div>`;
}

// ============================================
// EMAIL BUILDERS
// ============================================

export function buildVerificationEmailHTML(
  userName: string,
  verificationUrl: string,
  recipientEmail?: string,
  otpCode?: string,
): string {
  const otpSection = otpCode
    ? `
    <hr class="divider">
    <p class="text" style="font-size:14px;font-weight:600;">Or enter this code manually:</p>
    <div class="code-box">
      <div class="code-box-label">Verification Code</div>
      <div class="code-box-digits">${otpCode}</div>
      <div class="code-box-expiry">Expires in 24 hours</div>
    </div>
  `
    : '';

  const content = `
    <div class="greeting">Hello ${userName || 'there'},</div>
    <p class="text">Thanks for joining <strong>Boostly</strong> - the platform where you earn real rewards by watching videos, playing games, and completing tasks.</p>
    <p class="text">To get started, please verify your email address.</p>
    
    <div class="btn-wrap">
      <a href="${verificationUrl}" class="btn">Verify Email Address</a>
    </div>
    
    ${otpSection}
    
    <hr class="divider">
    <p class="text" style="font-size:13px;color:#9CA3AF;">
      Or copy this link into your browser:<br>
      <a href="${verificationUrl}" style="color:${BRAND_PRIMARY};word-break:break-all;">${verificationUrl}</a>
    </p>
    <p class="text" style="font-size:13px;color:#9CA3AF;">This link and code expire in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
    <hr class="divider">
    <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:16px;text-align:center;">
      <p style="font-size:14px;color:#166534;font-weight:600;">Start earning today — it's free!</p>
    </div>`;

  return createBoostlyEmail(
    content,
    'Welcome to Boostly',
    'Verify your email to start earning',
    recipientEmail,
  );
}

export function buildWelcomeEmailHTML(
  userName: string,
  recipientEmail?: string,
): string {
  const content = `
    <div class="greeting">Welcome to Boostly, ${userName || 'there'}!</div>
    <p class="text">Your account is ready. Start earning real rewards by completing simple activities — watch videos, play games, complete surveys, and more.</p>
    <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:16px;text-align:center;margin:20px 0;">
      <p style="font-size:28px;font-weight:800;color:#22C55E;">+50 RWF</p>
      <p style="font-size:13px;color:#166534;">Welcome bonus added to your wallet</p>
    </div>
    ${buildInfoBox('How to get started', [
      'Watch videos and earn up to 40 RWF each',
      'Play games and earn up to 150 RWF per session',
      'Complete surveys for up to 500 RWF',
      'Invite friends and earn 200 RWF per referral',
    ])}
    <div class="btn-wrap">
      <a href="${COMPANY_WEBSITE}/dashboard" class="btn btn-gold">Start Earning Now</a>
    </div>
    <hr class="divider">
    <p class="text" style="font-size:13px;color:#9CA3AF;">Need help? Reach us at <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND_PRIMARY};">${SUPPORT_EMAIL}</a></p>`;

  return createBoostlyEmail(
    content,
    'Welcome to Boostly',
    'Start earning rewards today',
    recipientEmail,
  );
}

export function build2FAOTPEmailHTML(
  userName: string,
  otp: string,
  recipientEmail?: string,
): string {
  const content = `
    <div class="greeting">Hello ${userName || 'there'},</div>
    <p class="text">Your two-factor authentication code is ready. Enter this code to complete your sign-in.</p>
    ${buildCodeBox(otp, 'Verification Code', 'Expires in 10 minutes')}
    ${buildWarningBox("If you didn't request this code, please secure your account immediately and contact support.")}
    <hr class="divider">
    <p class="text" style="font-size:13px;color:#9CA3AF;">This is an automated security notification from Boostly. Do not reply to this email.</p>`;

  return createBoostlyEmail(
    content,
    'Two-Factor Authentication',
    'Secure your account',
    recipientEmail,
  );
}

export function buildSudoOTPEmailHTML(
  userName: string,
  otp: string,
  isResend: boolean,
  expiryMinutes: number,
): string {
  const content = `
    <div class="greeting">Hello ${userName || 'there'},</div>
    <p class="text">${isResend ? "Here's your new" : 'You requested'} elevated (sudo) access to perform a sensitive action. Enter this code to confirm it's you.</p>
    ${buildCodeBox(otp, 'Sudo Verification Code', `Expires in ${expiryMinutes} minutes`)}
    ${buildWarningBox("If you didn't request this code, please secure your account immediately and contact support.")}
    <hr class="divider">
    <p class="text" style="font-size:13px;color:#9CA3AF;">This is an automated security notification from Boostly. Do not reply to this email.</p>`;

  return createBoostlyEmail(
    content,
    'Sudo Mode Verification',
    'Confirm your elevated access request',
  );
}

export function buildPasswordResetEmailHTML(
  userName: string,
  resetUrl: string,
  recipientEmail?: string,
): string {
  const content = `
    <div class="greeting">Hello ${userName || 'there'},</div>
    <p class="text">We received a request to reset your <strong>Boostly</strong> account password. Click the button below to set a new password.</p>
    ${buildWarningBox("If you didn't request this, ignore this email. Your password will not change.")}
    <div class="btn-wrap">
      <a href="${resetUrl}" class="btn">Reset Password</a>
    </div>
    <hr class="divider">
    <p class="text" style="font-size:13px;color:#9CA3AF;">
      Or copy this link:<br>
      <a href="${resetUrl}" style="color:${BRAND_PRIMARY};word-break:break-all;">${resetUrl}</a>
    </p>
    <p class="text" style="font-size:13px;color:#9CA3AF;">This link expires in 1 hour for security reasons.</p>`;

  return createBoostlyEmail(
    content,
    'Reset Your Password',
    'Secure your account',
    recipientEmail,
  );
}

export function buildReferralRewardEmailHTML(
  userName: string,
  referrerName: string,
  rewardAmount: number,
  recipientEmail?: string,
): string {
  const content = `
    <div class="greeting">Hello ${userName || 'there'},</div>
    <p class="text">Great news! <strong>${referrerName}</strong> just joined Boostly using your referral code.</p>
    ${buildEarningsBox(rewardAmount, 'RWF', 'Referral Bonus Earned')}
    <p class="text">Keep sharing your referral code and earn <strong>200 RWF</strong> for every friend who joins Boostly.</p>
    <div class="btn-wrap">
      <a href="${COMPANY_WEBSITE}/referrals" class="btn btn-gold">View Your Referrals</a>
    </div>
    <hr class="divider">
    <p class="text" style="font-size:13px;color:#9CA3AF;">Share your code: <strong style="color:#111827;">BOOSTLY123</strong></p>`;

  return createBoostlyEmail(
    content,
    'Referral Bonus Earned',
    'You earned rewards',
    recipientEmail,
  );
}

export function buildDailyBonusEmailHTML(
  userName: string,
  streakDay: number,
  bonusAmount: number,
  nextStreakReward: number,
  recipientEmail?: string,
): string {
  const content = `
    <div class="greeting">Hello ${userName || 'there'}!</div>
    <p class="text">You've claimed your daily bonus for <strong>Day ${streakDay}</strong> of your streak! Keep it going.</p>
    ${buildEarningsBox(bonusAmount, 'RWF', 'Daily Bonus Claimed')}
    <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:12px;padding:16px;text-align:center;margin:20px 0;">
      <p style="font-size:14px;color:#92400E;">
        <strong>${streakDay}-Day Streak</strong>
      </p>
      <p style="font-size:13px;color:#78350F;">
        Next milestone: Day ${streakDay + 1} — <strong>${nextStreakReward.toLocaleString()} RWF</strong>
      </p>
    </div>
    <div class="btn-wrap">
      <a href="${COMPANY_WEBSITE}/dashboard" class="btn btn-gold">Continue Earning</a>
    </div>`;

  return createBoostlyEmail(
    content,
    'Daily Bonus Claimed',
    'Keep your streak alive',
    recipientEmail,
  );
}

export function buildAccountLockedUserNotificationHTML(data: {
  userName: string;
  userEmail: string;
  reason: string;
  timestamp: string;
}): string {
  const content = `
    <div class="greeting">Dear ${data.userName},</div>
    <p class="text">Your Boostly account has been temporarily locked as a security precaution.</p>
    ${buildWarningBox(`Reason: ${data.reason === 'account_locked' ? 'Multiple failed login attempts were detected.' : data.reason}`)}
    ${buildInfoBox('What to do next', [
      'Contact our support team to verify your identity',
      'An administrator will review and restore access',
      'Enable two-factor authentication for extra security',
    ])}
    <div class="btn-wrap">
      <a href="mailto:${SUPPORT_EMAIL}" class="btn">Contact Support</a>
    </div>
    <hr class="divider">
    <p class="text" style="font-size:13px;color:#9CA3AF;">
      If this was you, please reach out and we'll help restore access quickly.
    </p>`;

  return createBoostlyEmail(
    content,
    'Account Temporarily Locked',
    'Security alert',
    data.userEmail,
  );
}

// ============================================
// EXPORTS
// ============================================

export const emailHelpers = {
  buildCodeBox,
  buildInfoBox,
  buildWarningBox,
  buildEarningsBox,
};

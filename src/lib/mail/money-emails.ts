// src/lib/mail/money-emails.ts
//
// Emails for money events: withdrawals and plan payments.
//   - members get a receipt and every status change
//   - admins (ADMIN_ALERT_EMAILS) get an alert for anything waiting on them
//
// Admin addresses come ONLY from the ADMIN_ALERT_EMAILS env var (comma
// separated). They are never hard-coded, logged, or shown in the UI.
//
// Every function here swallows its own errors: an email problem must never
// break a withdrawal or an approval.
import { eq } from 'drizzle-orm';
import { waitUntil } from '@vercel/functions';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { buildInfoBox, createBoostlyEmail, sendEmail } from '@/lib/mail';
import {
  MOBILE_MONEY_PROVIDERS,
  PAYOUT_TIME_LABEL,
  formatPayoutDay,
  formatRwandaPhone,
  getNextPayoutAt,
  type MobileMoneyProvider,
} from '@/lib/constants/payouts';

/**
 * Send without delaying the response. Registered with waitUntil so a
 * serverless function isn't frozen before the email goes out.
 */
export function inBackground(task: Promise<unknown>) {
  const safe = task.catch((e) => console.error('Background email failed:', e));
  try {
    waitUntil(safe);
  } catch {
    /* not on Vercel: the promise still runs */
  }
}

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://boostly.buzz').replace(/\/$/, '');
const rwf = (n: number) => `${Math.round(n).toLocaleString('en-US')} RWF`;

/** Escape member-supplied text before it goes into HTML. */
function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function adminRecipients(): string[] {
  return (process.env.ADMIN_ALERT_EMAILS || '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s));
}

async function member(userId: string) {
  return db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { name: true, email: true },
  });
}

function rows(pairs: [string, string][]) {
  return `<table role="presentation" style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">${pairs
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 0;color:#6B7280;border-bottom:1px solid #F3F4F6;">${esc(k)}</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#111827;border-bottom:1px solid #F3F4F6;">${esc(v)}</td></tr>`,
    )
    .join('')}</table>`;
}

const button = (href: string, label: string) =>
  `<div class="btn-wrap"><a href="${APP_URL}${href}" class="btn">${esc(label)}</a></div>`;

async function toMember(userId: string, subject: string, title: string, body: string, type: 'WITHDRAWAL_UPDATE' | 'PLAN_PAYMENT') {
  try {
    const m = await member(userId);
    if (!m?.email) return;
    const html = createBoostlyEmail(
      `<div class="greeting">Hi ${esc(m.name?.split(' ')[0] || 'there')},</div>${body}`,
      title,
      undefined,
      m.email,
    );
    await sendEmail({ to: m.email, subject, html, type });
  } catch (e) {
    console.error('Member email failed:', e instanceof Error ? e.message : e);
  }
}

async function toAdmins(subject: string, title: string, body: string) {
  const to = adminRecipients();
  if (to.length === 0) {
    console.warn('ADMIN_ALERT_EMAILS is not set; admin alert skipped:', subject);
    return;
  }
  try {
    const html = createBoostlyEmail(body, title);
    await Promise.all(to.map((addr) => sendEmail({ to: addr, subject, html, type: 'ADMIN_ALERT' })));
  } catch (e) {
    console.error('Admin alert failed:', e instanceof Error ? e.message : e);
  }
}

// ─── Withdrawals ──────────────────────────────────────────────────

export async function emailWithdrawalRequested(w: {
  userId: string;
  amount: number;
  phoneNumber: string | null;
  provider?: MobileMoneyProvider | null;
}) {
  const payout = formatPayoutDay(getNextPayoutAt());
  const to = `${formatRwandaPhone(w.phoneNumber)}${w.provider ? ` (${MOBILE_MONEY_PROVIDERS[w.provider].label})` : ''}`;

  await Promise.all([
    toMember(
      w.userId,
      `Withdrawal request received: ${rwf(w.amount)}`,
      'Withdrawal requested',
      `<p class="text">We've received your withdrawal request. The amount is reserved from your balance.</p>
       ${rows([['Amount', rwf(w.amount)], ['Paid to', to], ['Paid', payout]])}
       <p class="text">All withdrawals are sent together every day at ${PAYOUT_TIME_LABEL}.</p>
       ${button('/wallet', 'View wallet')}`,
      'WITHDRAWAL_UPDATE',
    ),
    (async () => {
      const m = await member(w.userId);
      await toAdmins(
        `New withdrawal: ${rwf(w.amount)} for the ${PAYOUT_TIME_LABEL} run`,
        'New withdrawal request',
        `<p class="text">A member requested a withdrawal for the next payout run.</p>
         ${rows([['Member', m?.name || 'Member'], ['Amount', rwf(w.amount)], ['Pay to', to], ['Payout run', payout]])}
         ${button('/admin/withdrawals', 'Open payout run')}`,
      );
    })(),
  ]);
}

export async function emailWithdrawalPaid(w: { userId: string; amount: number; phoneNumber: string | null; reference?: string | null }) {
  await toMember(
    w.userId,
    `Paid: ${rwf(w.amount)} sent to your mobile money`,
    'Withdrawal paid',
    `<p class="text">Your withdrawal has been sent. You'll also get an SMS from your mobile money provider.</p>
     ${rows([['Amount', rwf(w.amount)], ['Sent to', formatRwandaPhone(w.phoneNumber)], ...(w.reference ? [['Reference', w.reference] as [string, string]] : [])])}
     ${button('/wallet', 'View wallet')}`,
    'WITHDRAWAL_UPDATE',
  );
}

export async function emailWithdrawalRejected(w: { userId: string; amount: number; reason: string }) {
  await toMember(
    w.userId,
    `Withdrawal not sent: ${rwf(w.amount)} returned to your balance`,
    'Withdrawal not sent',
    `<p class="text">We couldn't send your withdrawal. The full amount is back in your Boostly balance.</p>
     ${rows([['Amount', rwf(w.amount)], ['Reason', w.reason]])}
     <p class="text">Check your mobile money number and request again.</p>
     ${button('/wallet/withdraw', 'Withdraw again')}`,
    'WITHDRAWAL_UPDATE',
  );
}

// ─── Plan payments ────────────────────────────────────────────────

export async function emailPlanPaymentSubmitted(p: {
  userId: string;
  planName: string;
  amount: number;
  transactionRef: string;
  payerPhone: string;
}) {
  await Promise.all([
    toMember(
      p.userId,
      `Payment received: ${p.planName}`,
      'We’re checking your payment',
      `<p class="text">Thanks! We've received your payment details and will activate ${esc(p.planName)} as soon as it's confirmed.</p>
       ${rows([['Plan', p.planName], ['Amount', rwf(p.amount)], ['Transaction ID', p.transactionRef]])}
       ${button('/plans', 'View plans')}`,
      'PLAN_PAYMENT',
    ),
    (async () => {
      const m = await member(p.userId);
      await toAdmins(
        `Payment to review: ${p.planName} (${rwf(p.amount)})`,
        'New plan payment to review',
        `<p class="text">Check this against the MoMo statement, then approve or reject it.</p>
         ${rows([['Member', m?.name || 'Member'], ['Plan', p.planName], ['Amount', rwf(p.amount)], ['Transaction ID', p.transactionRef], ['Paid from', formatRwandaPhone(p.payerPhone)]])}
         ${button('/admin/payments', 'Review payment')}`,
      );
    })(),
  ]);
}

export async function emailPlanActivated(p: { userId: string; planName: string; expiresAt: string | null }) {
  const until = p.expiresAt
    ? new Date(p.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Kigali' })
    : null;
  await toMember(
    p.userId,
    `${p.planName} is active`,
    'Your plan is active',
    `<p class="text">Your payment is confirmed and ${esc(p.planName)} is now active. Your new daily limits and withdrawal schedule apply right away.</p>
     ${until ? rows([['Plan', p.planName], ['Active until', until]]) : ''}
     ${buildInfoBox('What changes now', ['Your plan\'s daily tasks and earning maximum', `Withdrawals paid at ${PAYOUT_TIME_LABEL}`])}
     ${button('/dashboard', 'Start earning')}`,
    'PLAN_PAYMENT',
  );
}

export async function emailPlanPaymentRejected(p: { userId: string; planName: string; transactionRef: string; reason: string }) {
  await toMember(
    p.userId,
    `We couldn't confirm your ${p.planName} payment`,
    'Payment not confirmed',
    `<p class="text">We couldn't confirm your payment, so your plan hasn't changed.</p>
     ${rows([['Plan', p.planName], ['Transaction ID', p.transactionRef], ['Reason', p.reason]])}
     <p class="text">If you paid, reply to this email with your MoMo confirmation and we'll check again.</p>
     ${button('/plans', 'Try again')}`,
    'PLAN_PAYMENT',
  );
}

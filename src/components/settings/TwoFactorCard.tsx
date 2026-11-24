// src/components/settings/TwoFactorCard.tsx
//
// Settings > Security: two-step verification (email codes and authenticator
// app). Talks to /api/user/2fa/*. Every turn-off needs a code; nothing is
// disabled on a single click.
'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Fingerprint,
  Loader2,
  Mail,
  RefreshCw,
  Smartphone,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import { twofactor } from '@/lib/i18n/messages/twofactor';

export type TwoFAMethod = 'EMAIL' | 'TOTP';

export interface TwoFactorStatus {
  available: TwoFAMethod[];
  enabled: TwoFAMethod[];
  defaultMethod: TwoFAMethod | null;
  is2FAEnabled: boolean;
}

export interface TwoFactorCardProps {
  /** Called after the status loads and after every change (enable, disable, default). */
  onStatusChange?: (status: TwoFactorStatus) => void;
  className?: string;
}

type Flow =
  | { kind: 'emailSetup' }
  | { kind: 'totpSetup'; secret: string; uri: string; backupCodes: string[] }
  | { kind: 'disable'; method: TwoFAMethod; codeSent: boolean };

type Busy =
  | 'status'
  | 'emailSend'
  | 'emailVerify'
  | 'totpSetup'
  | 'totpVerify'
  | 'disableSend'
  | 'disable'
  | 'default'
  | null;

const RESEND_COOLDOWN = 30;

class ApiError extends Error {}

async function api<T = Record<string, unknown>>(url: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: body === undefined ? 'GET' : 'POST',
      cache: 'no-store',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('');
  }
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* empty or non-JSON body */
  }
  if (!res.ok) {
    const msg =
      data && typeof data === 'object' && 'error' in data && typeof (data as { error: unknown }).error === 'string'
        ? (data as { error: string }).error
        : '';
    throw new ApiError(msg);
  }
  return (data ?? {}) as T;
}

function parseStatus(raw: unknown): TwoFactorStatus {
  const r = (raw ?? {}) as Partial<Record<keyof TwoFactorStatus, unknown>>;
  const isMethod = (m: unknown): m is TwoFAMethod => m === 'EMAIL' || m === 'TOTP';
  const enabled = Array.isArray(r.enabled) ? r.enabled.filter(isMethod) : [];
  return {
    available: Array.isArray(r.available) ? r.available.filter(isMethod) : ['EMAIL', 'TOTP'],
    enabled,
    defaultMethod: isMethod(r.defaultMethod) ? r.defaultMethod : (enabled[0] ?? null),
    is2FAEnabled: Boolean(r.is2FAEnabled) || enabled.length > 0,
  };
}

const btnBase =
  'inline-flex items-center justify-center gap-1.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40';
const btnPrimary = cn(btnBase, 'bg-[#2563EB] text-white px-4 py-2.5 hover:bg-[#1D4ED8]');
const btnDanger = cn(btnBase, 'bg-[#EF4444] text-white px-4 py-2.5 hover:bg-[#DC2626]');
const btnGhost = cn(
  btnBase,
  'px-3 py-2 border border-[#E2E8F0] dark:border-[#334155] text-[#0F172A] dark:text-white hover:bg-[#F8FAFC] dark:hover:bg-[#0F172A]',
);
const btnLink = cn(btnBase, 'px-1 py-1 text-[#2563EB] hover:text-[#1D4ED8] dark:text-[#60A5FA]');

export function TwoFactorCard({ onStatusChange, className }: TwoFactorCardProps) {
  const t = useT(twofactor);

  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [flow, setFlow] = useState<Flow | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [savedAck, setSavedAck] = useState(false);
  const [copied, setCopied] = useState<'key' | 'codes' | null>(null);

  const onStatusChangeRef = useRef(onStatusChange);
  onStatusChangeRef.current = onStatusChange;
  const codeInputRef = useRef<HTMLInputElement>(null);

  const methodName = useCallback(
    (m: TwoFAMethod) => (m === 'EMAIL' ? t('emailMethod') : t('appMethod')),
    [t],
  );

  const failMessage = useCallback(
    (e: unknown) => (e instanceof ApiError && e.message ? e.message : t('genericError')),
    [t],
  );

  const loadStatus = useCallback(async () => {
    setBusy('status');
    setLoadError(false);
    try {
      const s = parseStatus(await api('/api/user/2fa/status'));
      setStatus(s);
      onStatusChangeRef.current?.(s);
    } catch {
      setLoadError(true);
    } finally {
      setBusy(null);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  // Resend cooldown ticker.
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  // Focus the code field when a step that needs one appears.
  const needsCode =
    flow?.kind === 'emailSetup' ||
    (flow?.kind === 'totpSetup' && savedAck) ||
    (flow?.kind === 'disable' && (flow.method === 'TOTP' || flow.codeSent));
  useEffect(() => {
    if (needsCode) codeInputRef.current?.focus();
  }, [needsCode]);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(null), 2000);
    return () => window.clearTimeout(id);
  }, [copied]);

  const resetFlow = () => {
    setFlow(null);
    setCode('');
    setError('');
    setSavedAck(false);
    setCooldown(0);
  };

  const startFlow = (f: Flow) => {
    setFlow(f);
    setCode('');
    setError('');
    setNotice('');
    setSavedAck(false);
  };

  // ── Email setup ─────────────────────────────────────────────
  const sendEmailSetupCode = async (isResend: boolean) => {
    setBusy('emailSend');
    setError('');
    try {
      await api('/api/user/2fa/email/setup', {});
      if (!isResend) startFlow({ kind: 'emailSetup' });
      setNotice(t('emailSent'));
      setCooldown(RESEND_COOLDOWN);
    } catch (e) {
      setError(failMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const verifyEmail = async () => {
    setBusy('emailVerify');
    setError('');
    try {
      await api('/api/user/2fa/email/verify', { code });
      resetFlow();
      setNotice(t('emailEnabled'));
      await loadStatus();
    } catch (e) {
      setError(failMessage(e));
    } finally {
      setBusy(null);
    }
  };

  // ── Authenticator setup ─────────────────────────────────────
  const startTotp = async () => {
    setBusy('totpSetup');
    setError('');
    setNotice('');
    try {
      const d = await api<{ secret?: unknown; uri?: unknown; backupCodes?: unknown }>(
        '/api/user/2fa/totp/setup',
        {},
      );
      if (typeof d.secret !== 'string' || typeof d.uri !== 'string') throw new ApiError('');
      const backupCodes = Array.isArray(d.backupCodes)
        ? d.backupCodes.filter((c): c is string => typeof c === 'string')
        : [];
      startFlow({ kind: 'totpSetup', secret: d.secret, uri: d.uri, backupCodes });
    } catch (e) {
      setError(failMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const verifyTotp = async () => {
    setBusy('totpVerify');
    setError('');
    try {
      await api('/api/user/2fa/totp/verify', { code });
      resetFlow();
      setNotice(t('appEnabled'));
      await loadStatus();
    } catch (e) {
      setError(failMessage(e));
    } finally {
      setBusy(null);
    }
  };

  // ── Turn off ────────────────────────────────────────────────
  const sendDisableCode = async () => {
    setBusy('disableSend');
    setError('');
    try {
      await api('/api/user/2fa/disable/send-otp', {});
      setFlow({ kind: 'disable', method: 'EMAIL', codeSent: true });
      setNotice(t('emailSent'));
      setCooldown(RESEND_COOLDOWN);
    } catch (e) {
      setError(failMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const confirmDisable = async (method: TwoFAMethod) => {
    if (!code) return; // never disable without a code
    setBusy('disable');
    setError('');
    try {
      const d = await api<{ twoFAEnabled?: unknown }>('/api/user/2fa/disable', { method, code });
      resetFlow();
      setNotice(d.twoFAEnabled === false ? t('disabledAllMsg') : t('disabledMsg', { method: methodName(method) }));
      await loadStatus();
    } catch (e) {
      setError(failMessage(e));
    } finally {
      setBusy(null);
    }
  };

  // ── Default method ─────────────────────────────────────────
  const makeDefault = async (method: TwoFAMethod) => {
    setBusy('default');
    setError('');
    setNotice('');
    try {
      await api('/api/user/2fa/default', { method });
      setNotice(t('defaultChanged', { method: methodName(method) }));
      await loadStatus();
    } catch (e) {
      setError(failMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const copy = async (text: string, which: 'key' | 'codes') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
    } catch {
      setError(t('copyFailed'));
    }
  };

  // ── Render helpers ─────────────────────────────────────────
  const inFlight = busy !== null;
  const isOn = Boolean(status?.is2FAEnabled);
  const bothEnabled = status?.enabled.length === 2;

  const codeMax = flow?.kind === 'disable' && flow.method === 'TOTP' ? 8 : 6;
  const codeValid = code.length === 6 || (codeMax === 8 && code.length === 8);

  const codeField = (label: string, id: string) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-[#64748B] dark:text-[#94A3B8]">
        {label}
      </label>
      <input
        ref={codeInputRef}
        id={id}
        name="code"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={codeMax}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, codeMax))}
        disabled={inFlight}
        className="mt-1 w-full max-w-[16rem] px-4 py-3 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white text-lg font-mono tracking-[0.4em] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all disabled:opacity-60"
        placeholder="••••••"
        aria-describedby={error ? 'twofa-error' : undefined}
      />
    </div>
  );

  const spinner = <Loader2 size={16} className="animate-spin" aria-hidden="true" />;

  const methodRow = (method: TwoFAMethod) => {
    const enabled = status?.enabled.includes(method) ?? false;
    const isDefault = enabled && status?.defaultMethod === method;
    const Icon = method === 'EMAIL' ? Mail : Smartphone;
    const activeHere =
      (flow?.kind === 'emailSetup' && method === 'EMAIL') ||
      (flow?.kind === 'totpSetup' && method === 'TOTP') ||
      (flow?.kind === 'disable' && flow.method === method);
    const setupBusy = method === 'EMAIL' ? busy === 'emailSend' && !flow : busy === 'totpSetup';

    return (
      <li key={method} className="py-4 first:pt-0 last:pb-0">
        <div className="flex flex-wrap items-center gap-3">
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
              enabled
                ? 'bg-[#DCFCE7] text-[#16A34A] dark:bg-[#22C55E]/15 dark:text-[#4ADE80]'
                : 'bg-[#F1F5F9] text-[#64748B] dark:bg-[#0F172A] dark:text-[#94A3B8]',
            )}
            aria-hidden="true"
          >
            <Icon size={18} />
          </div>
          <div className="flex-1 min-w-[10rem]">
            <p className="text-sm font-bold text-[#0F172A] dark:text-white flex flex-wrap items-center gap-2">
              {methodName(method)}
              {isDefault && bothEnabled && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#EFF6FF] dark:bg-[#2563EB]/20 text-[#2563EB] dark:text-[#93C5FD] px-2 py-0.5 text-[11px] font-bold">
                  <Star size={11} aria-hidden="true" />
                  {t('defaultBadge')}
                </span>
              )}
            </p>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              <span className={cn('font-semibold', enabled ? 'text-[#16A34A] dark:text-[#4ADE80]' : '')}>
                {enabled ? t('enabled') : t('notSetUp')}
              </span>
              {' · '}
              {method === 'EMAIL' ? t('emailMethodHint') : t('appMethodHint')}
            </p>
          </div>
          {!activeHere && status && (
            <div className="flex flex-wrap items-center gap-2">
              {enabled && bothEnabled && !isDefault && (
                <button
                  type="button"
                  className={btnLink}
                  disabled={inFlight || flow !== null}
                  onClick={() => void makeDefault(method)}
                >
                  {busy === 'default' && spinner}
                  {t('makeDefault')}
                </button>
              )}
              {enabled ? (
                <button
                  type="button"
                  className={btnGhost}
                  disabled={inFlight || flow !== null}
                  onClick={() => startFlow({ kind: 'disable', method, codeSent: false })}
                >
                  {t('turnOff')}
                </button>
              ) : (
                <button
                  type="button"
                  className={btnPrimary}
                  disabled={inFlight || flow !== null}
                  onClick={() => void (method === 'EMAIL' ? sendEmailSetupCode(false) : startTotp())}
                >
                  {setupBusy && spinner}
                  {t('setUp')}
                </button>
              )}
            </div>
          )}
        </div>
        {activeHere && <div className="mt-4 ml-0 sm:ml-[3.25rem]">{renderFlow()}</div>}
      </li>
    );
  };

  const resendButton = (onClick: () => void, sendBusy: boolean) => (
    <button
      type="button"
      className={btnLink}
      disabled={inFlight || cooldown > 0}
      onClick={onClick}
    >
      {sendBusy ? spinner : <RefreshCw size={14} aria-hidden="true" />}
      {cooldown > 0 ? t('resendIn', { seconds: cooldown }) : t('resend')}
    </button>
  );

  const cancelButton = (
    <button type="button" className={btnGhost} disabled={inFlight} onClick={resetFlow}>
      {t('cancel')}
    </button>
  );

  function renderFlow() {
    if (!flow) return null;

    if (flow.kind === 'emailSetup') {
      return (
        <form
          className="space-y-3"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            if (codeValid && !inFlight) void verifyEmail();
          }}
        >
          {codeField(t('codeLabel'), 'twofa-email-code')}
          <div className="flex flex-wrap items-center gap-2">
            <button type="submit" className={btnPrimary} disabled={inFlight || !codeValid}>
              {busy === 'emailVerify' && spinner}
              {t('verify')}
            </button>
            {cancelButton}
            {resendButton(() => void sendEmailSetupCode(true), busy === 'emailSend')}
          </div>
        </form>
      );
    }

    if (flow.kind === 'totpSetup') {
      return (
        <div className="space-y-5">
          <section className="space-y-3">
            <h4 className="text-sm font-bold text-[#0F172A] dark:text-white">{t('appStep1')}</h4>
            <div className="flex flex-wrap items-start gap-4">
              <div className="keep-light bg-white p-3 rounded-xl border border-[#E2E8F0]" role="img" aria-label={t('qrLabel')}>
                <QRCodeSVG value={flow.uri} size={168} level="M" bgColor="#FFFFFF" fgColor="#0F172A" />
              </div>
              <div className="flex-1 min-w-[12rem] space-y-2">
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">{t('appStep1Alt')}</p>
                <p className="font-mono text-sm font-bold break-all rounded-lg bg-[#F8FAFC] dark:bg-[#0F172A] text-[#0F172A] dark:text-white px-3 py-2 select-all">
                  {flow.secret.replace(/(.{4})(?=.)/g, '$1 ')}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={btnGhost} onClick={() => void copy(flow.secret, 'key')}>
                    {copied === 'key' ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                    {copied === 'key' ? t('copied') : t('copyKey')}
                  </button>
                  <a href={flow.uri} className={btnGhost}>
                    <ExternalLink size={14} aria-hidden="true" />
                    {t('openInApp')}
                  </a>
                </div>
              </div>
            </div>
          </section>

          {flow.backupCodes.length > 0 && (
            <section className="space-y-3">
              <h4 className="text-sm font-bold text-[#0F172A] dark:text-white">{t('appStep2')}</h4>
              <p className="flex gap-2 rounded-xl bg-[#FFFBEB] dark:bg-[#F59E0B]/10 border border-[#FDE68A] dark:border-[#F59E0B]/30 text-[#92400E] dark:text-[#FCD34D] text-xs font-medium px-3 py-2.5">
                <AlertTriangle size={16} className="shrink-0" aria-hidden="true" />
                {t('backupWarning')}
              </p>
              <ul className="grid grid-cols-2 gap-2 font-mono text-sm text-[#0F172A] dark:text-white">
                {flow.backupCodes.map((c) => (
                  <li key={c} className="rounded-lg bg-[#F8FAFC] dark:bg-[#0F172A] px-3 py-1.5 text-center select-all">
                    {c}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className={btnGhost}
                  onClick={() => void copy(flow.backupCodes.join('\n'), 'codes')}
                >
                  {copied === 'codes' ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                  {copied === 'codes' ? t('copied') : t('copyCodes')}
                </button>
                <label className="inline-flex items-center gap-2 text-sm text-[#0F172A] dark:text-white cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-[#2563EB]"
                    checked={savedAck}
                    onChange={(e) => setSavedAck(e.target.checked)}
                  />
                  {t('savedCodes')}
                </label>
              </div>
            </section>
          )}

          <form
            className="space-y-3"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              if (codeValid && !inFlight && (savedAck || flow.backupCodes.length === 0)) void verifyTotp();
            }}
          >
            <h4 className="text-sm font-bold text-[#0F172A] dark:text-white">{t('appStep3')}</h4>
            {(savedAck || flow.backupCodes.length === 0) && codeField(t('codeLabel'), 'twofa-app-code')}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                className={btnPrimary}
                disabled={inFlight || !codeValid || (!savedAck && flow.backupCodes.length > 0)}
              >
                {busy === 'totpVerify' && spinner}
                {t('verify')}
              </button>
              {cancelButton}
            </div>
          </form>
        </div>
      );
    }

    // Turn off
    const isLast = status?.enabled.length === 1;
    const showInput = flow.method === 'TOTP' || flow.codeSent;
    return (
      <form
        className="space-y-3 rounded-xl border border-[#FECACA] dark:border-[#EF4444]/30 bg-[#FEF2F2] dark:bg-[#EF4444]/10 p-4"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          if (showInput && codeValid && !inFlight) void confirmDisable(flow.method);
        }}
      >
        <h4 className="text-sm font-bold text-[#0F172A] dark:text-white">
          {t('disableTitle', { method: methodName(flow.method) })}
        </h4>
        <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
          {flow.method === 'EMAIL' ? t('disableEmailHint') : t('disableAppHint')}
        </p>
        {isLast && (
          <p className="flex gap-2 text-xs font-semibold text-[#B91C1C] dark:text-[#FCA5A5]">
            <AlertTriangle size={14} className="shrink-0 mt-px" aria-hidden="true" />
            {t('disableLastWarning')}
          </p>
        )}
        {showInput && codeField(flow.method === 'TOTP' ? t('codeOrBackupLabel') : t('codeLabel'), 'twofa-disable-code')}
        <div className="flex flex-wrap items-center gap-2">
          {showInput ? (
            <button type="submit" className={btnDanger} disabled={inFlight || !codeValid}>
              {busy === 'disable' && spinner}
              {t('turnOff')}
            </button>
          ) : (
            <button type="button" className={btnPrimary} disabled={inFlight} onClick={() => void sendDisableCode()}>
              {busy === 'disableSend' ? spinner : <Mail size={14} aria-hidden="true" />}
              {t('sendCode')}
            </button>
          )}
          {cancelButton}
          {flow.method === 'EMAIL' &&
            flow.codeSent &&
            resendButton(() => void sendDisableCode(), busy === 'disableSend')}
        </div>
      </form>
    );
  }

  return (
    <section
      aria-labelledby="twofa-title"
      className={cn(
        'bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F3F4F6] dark:border-[#334155] shadow-sm overflow-hidden',
        className,
      )}
    >
      <div className="px-5 py-4 border-b border-[#F3F4F6] dark:border-[#334155]">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl bg-[#FFFBEB] dark:bg-[#F59E0B]/15 flex items-center justify-center text-[#F59E0B] shrink-0"
            aria-hidden="true"
          >
            <Fingerprint size={18} />
          </div>
          <h3 id="twofa-title" className="flex-1 text-sm font-bold text-[#0F172A] dark:text-white">
            {t('title')}
          </h3>
          {status && (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold',
                isOn
                  ? 'bg-[#DCFCE7] text-[#16A34A] dark:bg-[#22C55E]/15 dark:text-[#4ADE80]'
                  : 'bg-[#F1F5F9] text-[#64748B] dark:bg-[#0F172A] dark:text-[#94A3B8]',
              )}
            >
              {isOn && <CheckCircle2 size={12} aria-hidden="true" />}
              {isOn ? t('on') : t('off')}
            </span>
          )}
        </div>
        <p className="mt-2 text-xs text-[#64748B] dark:text-[#94A3B8]">{t('explain')}</p>
      </div>

      <div className="px-5 py-4">
        <div aria-live="polite" role="status" className="empty:hidden mb-3">
          {notice && (
            <p className="flex gap-2 rounded-xl bg-[#F0FDF4] dark:bg-[#22C55E]/10 text-[#15803D] dark:text-[#4ADE80] text-sm font-medium px-3 py-2.5">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
              {notice}
            </p>
          )}
        </div>
        <div aria-live="assertive" role="alert" className="empty:hidden mb-3">
          {error && (
            <p
              id="twofa-error"
              className="flex gap-2 rounded-xl bg-[#FEF2F2] dark:bg-[#EF4444]/10 text-[#B91C1C] dark:text-[#FCA5A5] text-sm font-medium px-3 py-2.5"
            >
              <AlertTriangle size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
              {error}
            </p>
          )}
        </div>

        {!status && busy === 'status' && (
          <p className="flex items-center gap-2 text-sm text-[#64748B] dark:text-[#94A3B8]">
            {spinner}
            {t('loading')}
          </p>
        )}
        {!status && loadError && busy !== 'status' && (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-[#B91C1C] dark:text-[#FCA5A5]">{t('loadFailed')}</p>
            <button type="button" className={btnGhost} onClick={() => void loadStatus()}>
              <RefreshCw size={14} aria-hidden="true" />
              {t('retry')}
            </button>
          </div>
        )}
        {status && (
          <ul className="divide-y divide-[#F3F4F6] dark:divide-[#334155]">
            {methodRow('EMAIL')}
            {methodRow('TOTP')}
          </ul>
        )}
      </div>
    </section>
  );
}

export default TwoFactorCard;

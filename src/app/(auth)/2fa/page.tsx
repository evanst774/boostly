// src/app/(auth)/2fa/page.tsx
//
// Step 2 of login for users with two-factor auth. The login form sends users
// here with ?email&sessionId&method&methods; the code is verified by
// POST /api/auth/login with is2FAStep.
'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, KeyRound, Loader2, Mail, Smartphone } from 'lucide-react';
import AuthShell from '@/components/auth/AuthShell';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import { auth } from '@/lib/i18n/messages/auth';

type Method = 'EMAIL' | 'TOTP';

interface Params {
  email: string;
  sessionId: string;
  method: Method;
  methods: Method[];
}

function readParams(): Params | null {
  const q = new URLSearchParams(window.location.search);
  const email = q.get('email');
  const sessionId = q.get('sessionId');
  if (!email || !sessionId) return null;
  const method = (q.get('method') === 'TOTP' ? 'TOTP' : 'EMAIL') as Method;
  let methods: Method[] = [method];
  try {
    const parsed = JSON.parse(q.get('methods') || '[]');
    if (Array.isArray(parsed)) {
      methods = parsed.filter((m): m is Method => m === 'EMAIL' || m === 'TOTP');
    }
  } catch {
    /* keep default */
  }
  if (!methods.includes(method)) methods.unshift(method);
  return { email, sessionId, method, methods };
}

export default function TwoFactorPage() {
  const [params, setParams] = useState<Params | null>(null);
  const [ready, setReady] = useState(false);
  const [method, setMethod] = useState<Method>('EMAIL');
  const [useBackup, setUseBackup] = useState(false);
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useT(auth);

  useEffect(() => {
    const p = readParams();
    setParams(p);
    if (p) setMethod(p.method);
    setReady(true);
  }, []);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [method, useBackup, ready]);

  const verify = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!params) return;
    const otp = code.trim();
    if (!otp) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: params.email,
          is2FAStep: true,
          sessionId: params.sessionId,
          method,
          otpCode: otp,
          isBackupCode: useBackup,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.message || json.error || t('invalidCode'));
        setCode('');
        return;
      }
      // Full navigation so the new session cookie is picked up everywhere.
      window.location.href = json.redirectTo || '/dashboard';
    } catch {
      setError(t('connectionProblem'));
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    if (!params || resendIn > 0) return;
    setError(null);
    setNotice(null);
    try {
      const res = await fetch('/api/auth/resend-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: params.sessionId, email: params.email }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.message || json.error || t('couldNotResend'));
        return;
      }
      setNotice(t('newCodeSentTo', { email: params.email }));
      setResendIn(60);
    } catch {
      setError(t('connectionProblem'));
    }
  };

  if (!ready) return null;

  if (!params) {
    return (
      <AuthShell bottomPrompt={t('needHelp')} bottomLinkText={t('contactSupport')} bottomLinkHref="/support">
        <h2 className="text-2xl font-bold text-white mb-2">{t('sessionExpired')}</h2>
        <p className="text-sm text-white/50 mb-6">
          {t('sessionExpiredBody')}
        </p>
        <Link href="/login" className="inline-flex px-5 py-3 rounded-xl bg-[#2563EB] text-white font-bold text-sm">
          {t('backToSignIn')}
        </Link>
      </AuthShell>
    );
  }

  const isEmail = method === 'EMAIL' && !useBackup;

  return (
    <AuthShell bottomPrompt={t('needHelp')} bottomLinkText={t('contactSupport')} bottomLinkHref="/support">
      <Link
        href="/login"
        className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        {t('backToSignIn')}
      </Link>

      <div className="mb-6">
        <div className="w-14 h-14 rounded-2xl bg-[#2563EB]/10 border border-[#2563EB]/25 flex items-center justify-center mb-4">
          {useBackup ? (
            <KeyRound className="w-7 h-7 text-[#93C5FD]" />
          ) : isEmail ? (
            <Mail className="w-7 h-7 text-[#93C5FD]" />
          ) : (
            <Smartphone className="w-7 h-7 text-[#93C5FD]" />
          )}
        </div>
        <h2 className="text-2xl sm:text-[26px] font-bold text-white mb-1.5">
          {useBackup ? t('useBackup') : t('twoStep')}
        </h2>
        <p className="text-[13.5px] text-white/45">
          {useBackup
            ? t('backupBody')
            : isEmail
              ? <>{t('emailCodeBody')} <span className="text-white/70 font-medium">{params.email}</span></>
              : t('appBody')}
        </p>
      </div>

      {params.methods.length > 1 && !useBackup && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {params.methods.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMethod(m);
                setCode('');
                setError(null);
              }}
              className={cn(
                'py-2 rounded-xl text-sm font-semibold border transition-colors',
                method === m
                  ? 'bg-[#2563EB] border-[#2563EB] text-white'
                  : 'border-white/10 text-white/60 hover:border-white/30',
              )}
            >
              {m === 'EMAIL' ? t('emailCode') : t('authApp')}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={verify} className="space-y-4">
        <input
          ref={inputRef}
          value={code}
          onChange={(e) =>
            setCode(useBackup ? e.target.value.toUpperCase() : e.target.value.replace(/\D/g, '').slice(0, 6))
          }
          inputMode={useBackup ? 'text' : 'numeric'}
          autoComplete="one-time-code"
          placeholder={useBackup ? 'XXXX-XXXX' : '000000'}
          aria-label={t('verificationCode')}
          className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-center text-2xl tracking-[0.4em] font-bold outline-none focus:border-[#2563EB] placeholder:text-white/20"
        />

        {error && <p className="text-sm text-[#F87171]">{error}</p>}
        {notice && <p className="text-sm text-[#4ADE80]">{notice}</p>}

        <button
          type="submit"
          disabled={submitting || (!useBackup && code.length !== 6) || (useBackup && code.trim().length < 4)}
          className="w-full py-3.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {t('verifySignIn')}
        </button>
      </form>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
        {isEmail ? (
          <button
            type="button"
            onClick={resend}
            disabled={resendIn > 0}
            className="text-[#93C5FD] hover:text-white disabled:text-white/30"
          >
            {resendIn > 0 ? t('resendCodeIn', { s: resendIn }) : t('resendCode')}
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={() => {
            setUseBackup((v) => !v);
            setCode('');
            setError(null);
          }}
          className="text-white/50 hover:text-white"
        >
          {useBackup ? t('useCodeInstead') : t('useBackup')}
        </button>
      </div>
    </AuthShell>
  );
}

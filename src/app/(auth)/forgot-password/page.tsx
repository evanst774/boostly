// src/app/(auth)/forgot-password/page.tsx

'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Mail,
  ArrowLeft,
  Loader2,
  Lock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import AuthShell from '@/components/auth/AuthShell';
import { useT } from '@/lib/i18n';
import { auth } from '@/lib/i18n/messages/auth';
import { common } from '@/lib/i18n/messages/common';

const STEP_LABELS = ['stepEmail', 'stepReset'] as const;

// ─── Step Indicator ──────────────────────────────────

function StepIndicator({ step }: { step: number }) {
  const t = useT(auth);
  return (
    <div className="flex items-center justify-center lg:justify-start mb-8">
      {STEP_LABELS.map((label, i) => {
        const n = i + 1;
        const done = n < step;
        const active = n === step;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all',
                  done
                    ? 'bg-[#22C55E] border-[#22C55E] text-white'
                    : active
                      ? 'border-[#2563EB] text-[#93C5FD] shadow-[0_0_0_3px_rgba(37,99,235,.15)]'
                      : 'border-white/15 text-white/30 bg-white/[0.02]',
                )}
              >
                {done ? <CheckCircle2 className="w-4 h-4" /> : n}
              </div>
              <div
                className={cn(
                  'hidden sm:block text-[11px] font-medium whitespace-nowrap',
                  active
                    ? 'text-[#93C5FD]'
                    : done
                      ? 'text-[#4ADE80]'
                      : 'text-white/30',
                )}
              >
                {t(label)}
              </div>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                className={cn(
                  'w-10 sm:w-16 h-px mx-1 mb-4',
                  n < step ? 'bg-[#22C55E]' : 'bg-white/10',
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Token Validator Component ──────────────────────

function TokenValidator({
  token,
  onValid,
  onInvalid,
  onEmailFound,
}: {
  token: string;
  onValid: () => void;
  onInvalid: () => void;
  onEmailFound: (email: string) => void;
}) {
  const [isValidating, setIsValidating] = useState(true);
  const t = useT(auth);
  // ✅ FIX: React Strict Mode (dev only) intentionally mounts,
  // fake-unmounts, and remounts every component once to surface
  // effects that aren't safe to run twice. Without a guard, that
  // meant validateToken() — and on failure, the toast.error() in
  // onInvalid — fired twice for the same token. This ref persists
  // across the fake unmount/remount (only effects re-run, not
  // refs/state), so the second pass is a no-op.
  const hasValidatedRef = useRef(false);

  useEffect(() => {
    if (hasValidatedRef.current) return;
    hasValidatedRef.current = true;

    async function validateToken() {
      try {
        const res = await fetch('/api/auth/validate-reset-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (res.ok && data.valid) {
          onValid();
          if (data.email) {
            onEmailFound(data.email);
          }
        } else {
          onInvalid();
        }
      } catch {
        onInvalid();
      } finally {
        setIsValidating(false);
      }
    }

    validateToken();
  }, [token, onValid, onInvalid, onEmailFound]);

  if (isValidating) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" />
        <p className="text-sm text-white/50 mt-4">
          {t('validatingLink')}
        </p>
      </div>
    );
  }

  return null;
}

// ─── Main Component ──────────────────────────────────

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token');
  const t = useT(auth);
  const tc = useT(common);

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [validatedEmail, setValidatedEmail] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // ─── Show/hide password toggles (Step 3) ────────
  // ✅ NEW: independent visibility state per field, so
  // toggling "new password" doesn't also reveal "confirm
  // password" and vice-versa.
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ─── Detect mobile ──────────────────────────────
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ─── Check for token in URL ──────────────────────
  useEffect(() => {
    if (tokenFromUrl) {
      setIsTokenValid(null);
    }
  }, [tokenFromUrl]);

  // ✅ FIX: wrapped in useCallback so TokenValidator's effect
  // deps stay stable across parent re-renders (see note above).
  // ─── Handle token validation success ─────────────
  const handleTokenValid = useCallback(() => {
    setIsTokenValid(true);
    setStep(3);
  }, []);

  // ─── Handle token validation failure ─────────────
  const handleTokenInvalid = useCallback(() => {
    setIsTokenValid(false);
    toast.error(t('invalidLinkToast'));
  }, [t]);

  // ─── Handle email found from token ──────────────
  const handleEmailFound = useCallback((foundEmail: string) => {
    setValidatedEmail(foundEmail);
    setEmail(foundEmail);
  }, []);

  // ─── Handle sending reset link ──────────────────
  const handleSendReset = async () => {
    if (!email) {
      toast.error(t('enterEmail'));
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('sendLinkFailed'));
      }

      toast.success(t('resetSent'));
      setStep(2);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t('sendLinkFailed'),
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Handle password reset ──────────────────────
  const handleResetPassword = async () => {
    if (newPassword.length < 8) {
      toast.error(t('pwMin8'));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t('pwMismatch'));
      return;
    }

    setIsLoading(true);
    try {
      const token = tokenFromUrl;
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('resetFailed'));
      }

      toast.success(t('resetSuccess'));
      setStep(4);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t('resetFailed'),
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Check if we have a token from URL ──────────
  if (tokenFromUrl && isTokenValid === null) {
    return (
      <TokenValidator
        token={tokenFromUrl}
        onValid={handleTokenValid}
        onInvalid={handleTokenInvalid}
        onEmailFound={handleEmailFound}
      />
    );
  }

  // ─── Invalid token state ─────────────────────────
  if (tokenFromUrl && isTokenValid === false) {
    return (
      <>
        <div className="text-center mb-7">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1.5">
            {t('invalidLinkTitle')}
          </h2>
          <p className="text-[13.5px] text-white/45">
            {t('invalidLinkBody')}
          </p>
        </div>
        <button
          onClick={() => router.push('/forgot-password')}
          className="w-full py-3 bg-[#FBBF24] hover:bg-[#F59E0B] text-[#0F172A] font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#FBBF24]/20 hover:shadow-[#FBBF24]/40 min-h-[48px] text-sm"
        >
          {t('requestNewLink')}
        </button>
        <p className="text-center text-xs text-white/30 mt-4">
          {t('linkExpiry')}
        </p>
      </>
    );
  }

  // ─── Success step ────────────────────────────────
  if (step === 4) {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 rounded-full bg-[#22C55E]/10 border-2 border-[#22C55E]/30 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-8 h-8 text-[#4ADE80]" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-1.5">
          {t('resetDoneTitle')}
        </h2>
        <p className="text-[13.5px] text-white/45 mb-6">
          {t('resetDoneBody')}
        </p>
        <button
          onClick={() => router.push('/login')}
          className="w-full py-3 bg-[#FBBF24] hover:bg-[#F59E0B] text-[#0F172A] font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#FBBF24]/20 hover:shadow-[#FBBF24]/40 min-h-[48px] text-sm"
        >
          {t('backToLogin')}
        </button>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────
  return (
    <>
      {/* Back button */}
      {step < 4 && (
        <button
          type="button"
          onClick={() =>
            step === 1 ? router.push('/login') : setStep(step - 1)
          }
          className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          {tc('back')}
        </button>
      )}

      {step < 4 && <StepIndicator step={step} />}

      {/* Step 1: Email */}
      {step === 1 && (
        <>
          <div className="text-center lg:text-left mb-7">
            <h2 className="text-2xl sm:text-[26px] font-bold text-white mb-1.5">
              {t('forgotPassword')}
            </h2>
            <p className="text-[13.5px] text-white/45">
              {t('forgotBody')}
            </p>
          </div>

          <div className="relative mb-6">
            {!isMobile && (
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={cn(
                'w-full py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:border-[#2563EB]/50 focus:ring-2 focus:ring-[#2563EB]/20 transition-all',
                !isMobile ? 'pl-10 pr-3.5' : 'px-4',
              )}
            />
          </div>

          <button
            onClick={handleSendReset}
            disabled={isLoading}
            className="w-full py-3 bg-[#FBBF24] hover:bg-[#F59E0B] text-[#0F172A] font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#FBBF24]/20 hover:shadow-[#FBBF24]/40 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] text-sm"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              t('sendResetLink')
            )}
          </button>
        </>
      )}

      {/* Step 2: Check Email */}
      {step === 2 && (
        <>
          <div className="text-center mb-7">
            <div className="w-16 h-16 rounded-full bg-[#2563EB]/10 border-2 border-[#2563EB]/30 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-[#93C5FD]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1.5">
              {t('checkEmail')}
            </h2>
            <p className="text-[13.5px] text-white/45">
              {t('sentResetTo')}{' '}
              <span className="text-white/70 font-medium">{email}</span>.
            </p>
            <p className="text-xs text-white/30 mt-4">
              {t('clickLink')}
            </p>
          </div>

          <button
            onClick={() => setStep(1)}
            className="w-full py-3 bg-[#FBBF24] hover:bg-[#F59E0B] text-[#0F172A] font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#FBBF24]/20 hover:shadow-[#FBBF24]/40 min-h-[48px] text-sm"
          >
            {t('resendLink')}
          </button>
          <button
            onClick={() => router.push('/login')}
            className="w-full py-3 mt-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 rounded-xl flex items-center justify-center gap-2 transition-all min-h-[48px] text-sm"
          >
            {t('backToLogin')}
          </button>
        </>
      )}

      {/* Step 3: New Password */}
      {step === 3 && (
        <>
          <div className="text-center lg:text-left mb-7">
            <h2 className="text-2xl sm:text-[26px] font-bold text-white mb-1.5">
              {t('setNewPassword')}
            </h2>
            <p className="text-[13.5px] text-white/45">
              {tokenFromUrl
                ? t('createNewFor', { email: validatedEmail || t('yourAccount') })
                : t('chooseStrong')}
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="relative">
              {!isMobile && (
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
              )}
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('min8Ph')}
                className={cn(
                  'w-full py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:border-[#2563EB]/50 focus:ring-2 focus:ring-[#2563EB]/20 transition-all pr-11',
                  !isMobile ? 'pl-10' : 'pl-4',
                )}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((v) => !v)}
                tabIndex={-1}
                aria-label={
                  showNewPassword ? t('hidePassword') : t('showPassword')
                }
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showNewPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className="relative">
              {!isMobile && (
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
              )}
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('reenterPh')}
                className={cn(
                  'w-full py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:border-[#2563EB]/50 focus:ring-2 focus:ring-[#2563EB]/20 transition-all pr-11',
                  !isMobile ? 'pl-10' : 'pl-4',
                )}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                tabIndex={-1}
                aria-label={
                  showConfirmPassword ? t('hidePassword') : t('showPassword')
                }
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            onClick={handleResetPassword}
            disabled={isLoading}
            className="w-full py-3 bg-[#FBBF24] hover:bg-[#F59E0B] text-[#0F172A] font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#FBBF24]/20 hover:shadow-[#FBBF24]/40 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] text-sm"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              t('resetPassword')
            )}
          </button>
        </>
      )}
    </>
  );
}

// ─── Main Page ──────────────────────────────────────

export default function ForgotPasswordPage() {
  const t = useT(auth);
  return (
    <AuthShell
      bottomPrompt={t('rememberedIt')}
      bottomLinkText={t('backToLogInLower')}
      bottomLinkHref="/login"
    >
      <Suspense
        fallback={
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" />
          </div>
        }
      >
        <ForgotPasswordContent />
      </Suspense>
    </AuthShell>
  );
}
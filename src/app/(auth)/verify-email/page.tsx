// src/app/(auth)/verify-email/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Loader2,
  Mail,
  ArrowLeft,
  Sparkles,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import AuthShell from '@/components/auth/AuthShell';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';
  const from = searchParams.get('from') || '';

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoSent, setAutoSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  // ─── Auto-send OTP when coming from login ──────────
  useEffect(() => {
    if (email && !token && !autoSent && from === 'login') {
      const timer = setTimeout(() => {
        handleAutoSend();
      }, 1000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, token, from, autoSent]);

  // ─── Auto-send function ─────────────────────────────
  const handleAutoSend = async () => {
    if (isSending || !email) return;

    setIsSending(true);
    try {
      const response = await fetch('/api/auth/verify-email/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send code');
      }

      setAutoSent(true);
      toast.success('Verification code sent to your email', {
        icon: '📧',
        duration: 4000,
      });

      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send code');
      setAutoSent(false);
    } finally {
      setIsSending(false);
    }
  };

  // ─── Check if token is present (from email link) ──
  useEffect(() => {
    if (token && email) {
      verifyWithToken();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, email]);

  // ─── Verify with token ─────────────────────────────
  const verifyWithToken = async () => {
    if (isVerifying) return;
    setIsVerifying(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/verify-email/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed');
      }

      setVerified(true);

      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
      toast.error(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  // ─── Verify with OTP code ──────────────────────────
  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/verify-email/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: fullCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed');
      }

      setVerified(true);

      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
      toast.error(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Resend OTP code ──────────────────────────────
  const handleResend = async () => {
    if (isResending || countdown > 0 || !email) return;

    setIsResending(true);
    try {
      const response = await fetch('/api/auth/verify-email/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend code');
      }

      toast.success('A new code has been sent to your email', {
        icon: '📧',
        duration: 4000,
      });

      setCode(['', '', '', '', '', '']);
      inputs.current[0]?.focus();

      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to resend code');
    } finally {
      setIsResending(false);
    }
  };

  // ─── Handle OTP input ──────────────────────────────
  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(0, 1);
    setCode(newCode);

    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6);
    const newCode = [...code];
    pasted.split('').forEach((char, i) => {
      if (i < 6) newCode[i] = char;
    });
    setCode(newCode);
    if (pasted.length === 6) {
      inputs.current[5]?.focus();
    }
  };

  const backHref = from === 'login' ? '/login' : '/register';
  const backLabel = from === 'login' ? 'Login' : 'Register';

  // ─── If verifying with token ────────────────────────
  if (isVerifying) {
    return (
      <AuthShell
        bottomPrompt="Need help?"
        bottomLinkText="Contact support"
        bottomLinkHref="/support"
      >
        <div className="text-center py-12">
          <Loader2 className="w-10 h-10 text-[#93C5FD] animate-spin mx-auto mb-4" />
          <p className="text-white font-medium">Verifying your email...</p>
          <p className="text-white/45 text-sm mt-1">Please wait a moment</p>
        </div>
      </AuthShell>
    );
  }

  // ─── If already verified ─────────────────────────────
  if (verified) {
    return (
      <AuthShell
        bottomPrompt="Need help?"
        bottomLinkText="Contact support"
        bottomLinkHref="/support"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-[#22C55E]/10 border-2 border-[#22C55E]/30 flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-[#4ADE80]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1.5">
            Email verified!
          </h2>
          <p className="text-white/45 mb-1">Your account is now active.</p>
          <p className="text-white/45 text-sm">Redirecting to dashboard...</p>
        </div>
      </AuthShell>
    );
  }

  // ─── Main OTP verification screen ─────────────────────
  return (
    <AuthShell
      bottomPrompt="Need help?"
      bottomLinkText="Contact support"
      bottomLinkHref="/support"
    >
      <Link
        href={backHref}
        className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to {backLabel}
      </Link>

      <div className="text-center lg:text-left mb-2">
        <div className="w-14 h-14 rounded-2xl bg-[#2563EB]/10 border border-[#2563EB]/25 flex items-center justify-center mx-auto lg:mx-0 mb-4">
          <Mail className="w-7 h-7 text-[#93C5FD]" />
        </div>
        <h2 className="text-2xl sm:text-[26px] font-bold text-white mb-1.5">
          Verify your email
        </h2>
        <p className="text-[13.5px] text-white/45">
          {autoSent ? (
            <>
              We&apos;ve sent a 6-digit code to{' '}
              <span className="text-white/70 font-medium">{email}</span>
            </>
          ) : from === 'login' ? (
            <>
              Sending verification code to{' '}
              <span className="text-white/70 font-medium">{email}</span>
            </>
          ) : (
            <>
              Enter the 6-digit code sent to{' '}
              <span className="text-white/70 font-medium">{email}</span>
            </>
          )}
        </p>

        {error && (
          <div className="mt-3 p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl text-[#F87171] text-sm flex items-center gap-2 justify-center lg:justify-start">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
        {isSending && (
          <div className="mt-3 p-3 bg-[#2563EB]/10 border border-[#2563EB]/20 rounded-xl text-[#93C5FD] text-sm flex items-center justify-center lg:justify-start gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Sending code...
          </div>
        )}
      </div>

      {/* OTP input */}
      <div className="flex gap-2 justify-center lg:justify-start my-8">
        {code.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={index === 0 ? handlePaste : undefined}
            className={cn(
              'w-12 h-14 text-center text-2xl font-bold bg-white/5 border-2 rounded-xl text-white focus:ring-2 focus:ring-[#2563EB]/20 transition-all',
              digit ? 'border-[#2563EB] text-[#93C5FD]' : 'border-white/10',
            )}
            autoFocus={index === 0}
            disabled={isLoading || isSending}
          />
        ))}
      </div>

      <button
        onClick={handleVerify}
        disabled={isLoading || code.join('').length !== 6 || isSending}
        className="w-full py-3 bg-[#FBBF24] hover:bg-[#F59E0B] text-[#0F172A] font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#FBBF24]/20 hover:shadow-[#FBBF24]/40 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] text-sm"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Verifying...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Verify Email
          </>
        )}
      </button>

      <div className="text-center lg:text-left mt-4">
        <span className="text-sm text-white/45">
          Didn&apos;t get a code?{' '}
          <button
            onClick={handleResend}
            disabled={isResending || countdown > 0 || !email || isSending}
            className="text-[#93C5FD] font-semibold hover:text-[#BFDBFE] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {countdown > 0
              ? `Resend in ${countdown}s`
              : isResending
                ? 'Sending...'
                : 'Resend'}
          </button>
        </span>
      </div>

      <div className="mt-6 p-4 bg-white/[0.03] border border-white/5 rounded-xl text-center lg:text-left">
        <p className="text-xs text-white/40">
          Check your spam folder if you don&apos;t see it in your inbox.
        </p>
        <p className="text-xs text-white/40 mt-1">
          The code expires in{' '}
          <strong className="text-white/70">24 hours</strong>
        </p>
        {autoSent && (
          <p className="text-xs mt-2 text-[#4ADE80] flex items-center justify-center lg:justify-start gap-1">
            <CheckCircle className="w-3 h-3" />
            Code sent successfully!
          </p>
        )}
      </div>
    </AuthShell>
  );
}

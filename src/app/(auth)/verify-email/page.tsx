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
    // Only auto-send if:
    // 1. We have an email
    // 2. No token (not coming from email link)
    // 3. Not already sent
    // 4. Coming from login page
    if (email && !token && !autoSent && from === 'login') {
      const timer = setTimeout(() => {
        handleAutoSend();
      }, 1000);
      return () => clearTimeout(timer);
    }
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

      // Start countdown
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
      // toast.success('Email verified! Welcome to Boostly.');

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
      // toast.success('Email verified! Welcome to Boostly 🎉');

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

      // Reset code inputs
      setCode(['', '', '', '', '', '']);
      inputs.current[0]?.focus();

      // Start countdown
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

  // ─── If verifying with token ────────────────────────
  if (isVerifying) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-xl border border-border-light max-w-md mx-auto">
        <div className="text-center py-8">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-navy font-medium">Verifying your email...</p>
          <p className="text-text-secondary text-sm mt-1">
            Please wait a moment
          </p>
        </div>
      </div>
    );
  }

  // ─── If already verified ─────────────────────────────
  if (verified) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-xl border border-border-light max-w-md mx-auto">
        <div className="text-center py-4">
          <div className="w-20 h-20 rounded-full bg-success-light border-4 border-success flex items-center justify-center mx-auto mb-4 text-4xl">
            ✓
          </div>
          <h2 className="text-xl font-black text-navy">Email Verified! 🎉</h2>
          <p className="text-text-secondary mt-1">
            Your account is now active.
          </p>
          <p className="text-text-secondary text-sm">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  // ─── Render OTP verification ─────────────────────────
  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-border-light max-w-md mx-auto w-full">
      {/* Back Button */}
      <Link
        href={from === 'login' ? '/login' : '/register'}
        className="flex items-center gap-1 text-text-muted hover:text-navy text-sm transition-colors mb-4 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to {from === 'login' ? 'Login' : 'Register'}
      </Link>

      {/* Header */}
      <div className="text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary-light flex items-center justify-center mx-auto mb-4 text-4xl shadow-lg shadow-primary/10">
          <Mail className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-2xl font-black text-navy mb-1">
          Verify your email
        </h1>
        <p className="text-text-secondary text-sm">
          {autoSent ? (
            <>
              We&apos;ve sent a 6-digit code to
              <br />
              <strong className="text-navy">{email}</strong>
            </>
          ) : from === 'login' ? (
            <>
              Sending verification code to
              <br />
              <strong className="text-navy">{email}</strong>
            </>
          ) : (
            <>
              Enter the 6-digit code sent to
              <br />
              <strong className="text-navy">{email}</strong>
            </>
          )}
        </p>
        {error && (
          <div className="mt-3 p-3 bg-danger-light border border-danger/30 rounded-xl text-danger text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
        {isSending && (
          <div className="mt-3 p-3 bg-primary-light border border-primary/30 rounded-xl text-primary text-sm flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Sending code...
          </div>
        )}
      </div>

      {/* OTP Input */}
      <div className="flex gap-2 justify-center my-8">
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
            className={`w-12 h-14 text-center text-2xl font-bold bg-bg border-2 rounded-xl text-navy focus:border-primary focus:ring-1 focus:ring-primary transition-all ${
              digit ? 'border-primary text-primary' : 'border-border'
            }`}
            autoFocus={index === 0}
            disabled={isLoading || isSending}
          />
        ))}
      </div>

      {/* Verify Button */}
      <button
        onClick={handleVerify}
        disabled={isLoading || code.join('').length !== 6 || isSending}
        className="w-full py-3 bg-gold hover:bg-gold-hover text-navy font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-gold disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Resend */}
      <div className="text-center mt-4">
        <span className="text-sm text-text-secondary">
          Didn&apos;t get a code?{' '}
          <button
            onClick={handleResend}
            disabled={isResending || countdown > 0 || !email || isSending}
            className="text-primary font-semibold hover:text-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {countdown > 0
              ? `Resend in ${countdown}s`
              : isResending
                ? 'Sending...'
                : 'Resend'}
          </button>
        </span>
      </div>

      {/* Help */}
      <div className="mt-6 p-4 bg-bg rounded-xl text-center">
        <p className="text-xs text-text-muted">
          Check your spam folder if you don&apos;t see it in your inbox.
        </p>
        <p className="text-xs text-text-muted mt-1">
          The code expires in <strong className="text-navy">24 hours</strong>
        </p>
        {autoSent && (
          <p className="text-xs mt-2 text-success flex items-center justify-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Code sent successfully!
          </p>
        )}
      </div>
    </div>
  );
}

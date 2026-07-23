// src/app/(auth)/forgot-password/page.tsx
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mail,
  ArrowLeft,
  Loader2,
  Lock,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import AuthShell from '@/components/auth/AuthShell';

const STEP_LABELS = ['Email', 'Verify', 'Reset'];

function StepIndicator({ step }: { step: number }) {
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
                {label}
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

const inputClass =
  'w-full py-2.5 pl-10 pr-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:border-[#2563EB]/50 focus:ring-2 focus:ring-[#2563EB]/20 transition-all';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const codeInputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSendReset = async () => {
    if (!email) {
      toast.error('Please enter your email address');
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
        throw new Error(data.message || 'Failed to send reset link');
      }

      toast.success('Reset code sent to your email!');
      setStep(2);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to send reset link',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = () => {
    const fullCode = code.join('');
    if (fullCode.length !== 4) {
      toast.error('Please enter the 4-digit code');
      return;
    }
    setStep(3);
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code: code.join(''),
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      toast.success('Password reset successfully!');
      setStep(4);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to reset password',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      bottomPrompt="Remembered it?"
      bottomLinkText="Back to log in"
      bottomLinkHref="/login"
    >
      {step < 4 && (
        <button
          type="button"
          onClick={() =>
            step === 1 ? router.push('/login') : setStep(step - 1)
          }
          className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back
        </button>
      )}

      {step < 4 && <StepIndicator step={step} />}

      {/* Step 1: email */}
      {step === 1 && (
        <>
          <div className="text-center lg:text-left mb-7">
            <h2 className="text-2xl sm:text-[26px] font-bold text-white mb-1.5">
              Forgot password?
            </h2>
            <p className="text-[13.5px] text-white/45">
              Enter your email and we&apos;ll send you a reset code.
            </p>
          </div>

          <div className="relative mb-6">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputClass}
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
              <>
                Send Reset Code
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </>
      )}

      {/* Step 2: verify code */}
      {step === 2 && (
        <>
          <div className="text-center lg:text-left mb-7">
            <h2 className="text-2xl sm:text-[26px] font-bold text-white mb-1.5">
              Check your email
            </h2>
            <p className="text-[13.5px] text-white/45">
              Enter the 4-digit code we sent to{' '}
              <span className="text-white/70 font-medium">{email}</span>.
            </p>
          </div>

          <div className="flex gap-3 justify-center lg:justify-start mb-6">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  codeInputs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 1);
                  const newCode = [...code];
                  newCode[index] = value;
                  setCode(newCode);
                  if (value && index < 3) {
                    codeInputs.current[index + 1]?.focus();
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' && !code[index] && index > 0) {
                    codeInputs.current[index - 1]?.focus();
                  }
                }}
                className={cn(
                  'w-14 h-16 text-center text-2xl font-bold bg-white/5 border-2 rounded-xl text-white focus:ring-2 focus:ring-[#2563EB]/20 transition-all',
                  digit ? 'border-[#2563EB] text-[#93C5FD]' : 'border-white/10',
                )}
                autoFocus={index === 0}
              />
            ))}
          </div>

          <button
            onClick={handleVerifyCode}
            className="w-full py-3 bg-[#FBBF24] hover:bg-[#F59E0B] text-[#0F172A] font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#FBBF24]/20 hover:shadow-[#FBBF24]/40 min-h-[48px] text-sm"
          >
            Verify Code
            <ArrowRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Step 3: new password */}
      {step === 3 && (
        <>
          <div className="text-center lg:text-left mb-7">
            <h2 className="text-2xl sm:text-[26px] font-bold text-white mb-1.5">
              Set new password
            </h2>
            <p className="text-[13.5px] text-white/45">
              Choose a strong password you haven&apos;t used before.
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className={inputClass}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className={inputClass}
              />
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
              'Reset Password'
            )}
          </button>
        </>
      )}

      {/* Step 4: success */}
      {step === 4 && (
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-[#22C55E]/10 border-2 border-[#22C55E]/30 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-[#4ADE80]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1.5">
            Password reset!
          </h2>
          <p className="text-[13.5px] text-white/45 mb-6">
            Your password has been updated successfully.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="w-full py-3 bg-[#FBBF24] hover:bg-[#F59E0B] text-[#0F172A] font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#FBBF24]/20 hover:shadow-[#FBBF24]/40 min-h-[48px] text-sm"
          >
            Back to Login
          </button>
        </div>
      )}
    </AuthShell>
  );
}

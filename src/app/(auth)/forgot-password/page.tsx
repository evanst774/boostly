// src/app/(auth)/forgot-password/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, ArrowLeft, Loader2, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
    <div className="bg-white rounded-2xl p-6 shadow-xl border border-border-light">
      <button
        onClick={() => router.push('/login')}
        className="flex items-center gap-1 text-text-muted hover:text-navy text-sm transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Step indicators */}
      <div className="flex gap-0 mb-8">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`flex-1 flex flex-col items-center gap-1 relative ${
              s < step ? 'done' : s === step ? 'active' : ''
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold z-10 ${
                s < step
                  ? 'border-success bg-success text-white'
                  : s === step
                    ? 'border-primary bg-primary-light text-primary'
                    : 'border-border text-text-muted'
              }`}
            >
              {s < step ? '✓' : s}
            </div>
            <span
              className={`text-[10px] font-medium ${
                s === step
                  ? 'text-primary'
                  : s < step
                    ? 'text-success'
                    : 'text-text-muted'
              }`}
            >
              {s === 1 ? 'Email' : s === 2 ? 'Verify' : 'Reset'}
            </span>
            {s < 3 && (
              <div
                className={`absolute top-3.5 left-[calc(50%+14px)] right-[calc(-50%+14px)] h-0.5 ${
                  s < step ? 'bg-success' : 'bg-border'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Enter email */}
      {step === 1 && (
        <>
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-primary-light flex items-center justify-center text-3xl">
              🔑
            </div>
          </div>
          <h1 className="text-2xl font-black text-navy text-center mb-1">
            Forgot Password?
          </h1>
          <p className="text-text-secondary text-sm text-center mb-6">
            Enter your email and we&apos;ll send you a reset link.
          </p>

          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full pl-10 pr-4 py-3 bg-bg border border-border rounded-xl text-navy placeholder:text-text-muted text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          <button
            onClick={handleSendReset}
            disabled={isLoading}
            className="w-full py-3 bg-gold hover:bg-gold-hover text-navy font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-gold mt-6 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Send Reset Link'
            )}
          </button>
        </>
      )}

      {/* Step 2: Verify OTP */}
      {step === 2 && (
        <>
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-primary-light flex items-center justify-center text-3xl">
              📲
            </div>
          </div>
          <h1 className="text-2xl font-black text-navy text-center mb-1">
            Check your email
          </h1>
          <p className="text-text-secondary text-sm text-center mb-6">
            Enter the 4-digit code we sent to your email address.
          </p>

          <div className="flex gap-3 justify-center mb-6">
            {code.map((digit, index) => (
              <input
                key={index}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => {
                  const newCode = [...code];
                  newCode[index] = e.target.value
                    .replace(/\D/g, '')
                    .slice(0, 1);
                  setCode(newCode);
                  if (e.target.value && index < 3) {
                    document.querySelectorAll('input')[index + 1]?.focus();
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' && !code[index] && index > 0) {
                    document.querySelectorAll('input')[index - 1]?.focus();
                  }
                }}
                className={`w-14 h-16 text-center text-2xl font-bold bg-bg border-2 rounded-xl text-navy focus:border-primary focus:ring-1 focus:ring-primary transition-all ${
                  digit ? 'border-primary text-primary' : 'border-border'
                }`}
                autoFocus={index === 0}
              />
            ))}
          </div>

          <button
            onClick={handleVerifyCode}
            className="w-full py-3 bg-gold hover:bg-gold-hover text-navy font-bold rounded-xl transition-all shadow-gold"
          >
            Verify Code
          </button>
        </>
      )}

      {/* Step 3: New password */}
      {step === 3 && (
        <>
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-primary-light flex items-center justify-center text-3xl">
              🔐
            </div>
          </div>
          <h1 className="text-2xl font-black text-navy text-center mb-1">
            Set new password
          </h1>
          <p className="text-text-secondary text-sm text-center mb-6">
            Choose a strong password you haven&apos;t used before.
          </p>

          <div className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full pl-10 pr-4 py-3 bg-bg border border-border rounded-xl text-navy placeholder:text-text-muted text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full pl-10 pr-4 py-3 bg-bg border border-border rounded-xl text-navy placeholder:text-text-muted text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          </div>

          <button
            onClick={handleResetPassword}
            disabled={isLoading}
            className="w-full py-3 bg-gold hover:bg-gold-hover text-navy font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-gold mt-6 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Reset Password'
            )}
          </button>
        </>
      )}

      {/* Step 4: Success */}
      {step === 4 && (
        <div className="text-center py-4">
          <div className="w-24 h-24 rounded-full bg-success-light border-3 border-success flex items-center justify-center mx-auto mb-4 text-4xl">
            ✓
          </div>
          <h1 className="text-2xl font-black text-navy mb-1">
            Password Reset!
          </h1>
          <p className="text-text-secondary text-sm mb-6">
            Your password has been updated successfully.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="w-full py-3 bg-gold hover:bg-gold-hover text-navy font-bold rounded-xl transition-all shadow-gold"
          >
            Back to Login
          </button>
        </div>
      )}
    </div>
  );
}

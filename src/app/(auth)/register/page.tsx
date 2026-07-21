// src/app/(auth)/register/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Loader2,
  X,
  Check,
  Gift,
  AlertCircle,
  ArrowLeft,
  PartyPopper,
  Rocket,
  BadgeCheck,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

// ─── Custom SVG Icons ──────────────────────────────

const GoogleIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const FacebookIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const ReferralLinkIcon = () => (
  <svg
    className="w-4 h-4 text-text-muted"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
    />
  </svg>
);

const BoostlyLogoIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 40 40" fill="none">
    <rect width="40" height="40" rx="12" fill="#2563EB" />
    <path d="M12 28V12h16v16H12z" fill="white" opacity="0.2" />
    <path d="M16 24V16h8v8h-8z" fill="white" />
    <path
      d="M20 12v4M20 24v4M12 20h4M24 20h4"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="20" cy="20" r="2" fill="white" />
  </svg>
);

// ─── Main Component ───────────────────────────────

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
  });
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [referralValid, setReferralValid] = useState<boolean | null>(null);
  const [isCheckingReferral, setIsCheckingReferral] = useState(false);

  // ─── Capture referral code from URL ──────────────
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      const code = ref.toUpperCase().trim();
      setForm((prev) => ({ ...prev, referralCode: code }));

      toast.success(`Referral code applied: ${code}`, {
        duration: 4000,
        icon: <Gift className="w-5 h-5 text-gold" />,
      });

      checkReferralCode(code);
    }
  }, [searchParams]);

  // ─── Check referral code validity ──────────────
  const checkReferralCode = async (code: string) => {
    if (!code || code.length < 4) {
      setReferralValid(null);
      return;
    }

    setIsCheckingReferral(true);
    try {
      const response = await fetch(
        `/api/referrals/validate?code=${encodeURIComponent(code)}`,
      );
      const data = await response.json();

      if (response.ok && data.valid) {
        setReferralValid(true);
        toast.success("Valid referral code! You'll get a welcome bonus.", {
          duration: 3000,
          icon: <BadgeCheck className="w-5 h-5 text-success" />,
        });
      } else {
        setReferralValid(false);
        toast.error('Invalid referral code. Please check and try again.', {
          duration: 3000,
          icon: <AlertCircle className="w-5 h-5 text-danger" />,
        });
      }
    } catch {
      setReferralValid(null);
    } finally {
      setIsCheckingReferral(false);
    }
  };

  // ─── Handle referral code change ──────────────
  const handleReferralChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value.toUpperCase().trim();
    setForm((prev) => ({ ...prev, referralCode: code }));
    setReferralValid(null);

    const timer = setTimeout(() => {
      if (code.length >= 4) {
        checkReferralCode(code);
      }
    }, 500);

    return () => clearTimeout(timer);
  };

  // ─── Handle form submission ──────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // ── Validation ──
    if (!form.name.trim()) {
      toast.error('Please enter your full name');
      setIsLoading(false);
      return;
    }

    if (!form.email.trim()) {
      toast.error('Please enter your email address');
      setIsLoading(false);
      return;
    }

    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      setIsLoading(false);
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (!agreeTerms) {
      toast.error('Please accept the Terms of Service');
      setIsLoading(false);
      return;
    }

    // ── Submit ──
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          referralCode: form.referralCode || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'INVALID_REFERRAL') {
          toast.error(data.message || 'Invalid referral code');
          setIsLoading(false);
          return;
        }
        if (data.code === 'SELF_REFERRAL') {
          toast.error('You cannot refer yourself');
          setIsLoading(false);
          return;
        }
        throw new Error(data.message || 'Registration failed');
      }

      // ── Success ──
      const successMessage = data.hasReferral
        ? `Account created! You earned a ${data.referralBonus} RWF referral bonus!`
        : 'Account created! Check your email to verify.';

      toast.success(successMessage, {
        duration: 5000,
        icon: data.hasReferral ? (
          <PartyPopper className="w-5 h-5 text-gold" />
        ) : (
          <Check className="w-5 h-5 text-success" />
        ),
      });

      router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Render ──────────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-border-light max-w-md mx-auto w-full">
      {/* Back Button */}
      <button
        onClick={() => router.push('/')}
        className="flex items-center gap-1 text-text-muted hover:text-navy text-sm transition-colors mb-4 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back
      </button>

      {/* Header */}
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 rounded-2xl bg-primary-light flex items-center justify-center shadow-inner">
          <BoostlyLogoIcon />
        </div>
      </div>

      <h1 className="text-2xl font-black text-navy text-center mb-1">
        Create your account
      </h1>
      <p className="text-text-secondary text-sm text-center mb-6">
        Join thousands earning daily rewards on Boostly.
      </p>

      {/* ─── Social Sign-up ──────────────────────────── */}
      <div className="flex gap-3 mb-6">
        <button className="flex-1 py-2.5 border border-border rounded-xl flex items-center justify-center gap-2 text-sm font-medium text-text-secondary hover:border-primary hover:bg-primary-light transition-all">
          <GoogleIcon />
          Google
        </button>
        <button className="flex-1 py-2.5 border border-border rounded-xl flex items-center justify-center gap-2 text-sm font-medium text-text-secondary hover:border-primary hover:bg-primary-light transition-all">
          <FacebookIcon />
          Facebook
        </button>
      </div>

      {/* ─── Divider ──────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-text-muted">or sign up with email</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* ─── Referral Code Banner ────────────────────── */}
      {form.referralCode && (
        <div
          className={cn(
            'flex items-center gap-3 p-3 rounded-xl mb-5 transition-all',
            referralValid === true
              ? 'bg-success-light border border-success'
              : referralValid === false
                ? 'bg-danger-light border border-danger'
                : 'bg-gold-light border border-gold',
          )}
        >
          {referralValid === true ? (
            <BadgeCheck className="w-5 h-5 text-success flex-shrink-0" />
          ) : referralValid === false ? (
            <AlertCircle className="w-5 h-5 text-danger flex-shrink-0" />
          ) : (
            <Gift className="w-5 h-5 text-gold flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-navy">
              {referralValid === true
                ? 'Valid referral code!'
                : referralValid === false
                  ? 'Invalid referral code'
                  : 'Referral code applied'}
            </p>
            <p className="text-xs text-text-secondary truncate">
              {referralValid === true
                ? "You'll get a welcome bonus when you sign up!"
                : referralValid === false
                  ? 'Please check the code and try again'
                  : `Code: ${form.referralCode}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setForm((prev) => ({ ...prev, referralCode: '' }));
              setReferralValid(null);
            }}
            className="text-text-muted hover:text-danger transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── Form ─────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label
            htmlFor="name"
            className="text-sm font-medium text-navy block mb-1.5"
          >
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              autoComplete="name"
              className="w-full pl-10 pr-4 py-3 bg-bg border border-border rounded-xl text-navy placeholder:text-text-muted text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              placeholder="John Doe"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="text-sm font-medium text-navy block mb-1.5"
          >
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              autoComplete="email"
              className="w-full pl-10 pr-4 py-3 bg-bg border border-border rounded-xl text-navy placeholder:text-text-muted text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              placeholder="you@example.com"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="text-sm font-medium text-navy block mb-1.5"
          >
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              autoComplete="new-password"
              className="w-full pl-10 pr-12 py-3 bg-bg border border-border rounded-xl text-navy placeholder:text-text-muted text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              placeholder="Min. 8 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-navy transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {/* Password strength */}
          {form.password.length > 0 && (
            <div className="mt-2">
              <div className="flex gap-1 mb-1">
                {[0, 1, 2, 3].map((i) => {
                  let score = 0;
                  if (form.password.length >= 8) score++;
                  if (/[A-Z]/.test(form.password)) score++;
                  if (/[0-9]/.test(form.password)) score++;
                  if (/[^A-Za-z0-9]/.test(form.password)) score++;
                  const filled = i < score;
                  return (
                    <div
                      key={i}
                      className={`flex-1 h-1 rounded transition-all ${
                        filled
                          ? score <= 1
                            ? 'bg-danger'
                            : score <= 2
                              ? 'bg-warning'
                              : 'bg-success'
                          : 'bg-border'
                      }`}
                    />
                  );
                })}
              </div>
              <span className="text-xs text-text-muted">
                {form.password.length < 8
                  ? 'Weak'
                  : form.password.length < 12
                    ? 'Fair'
                    : 'Strong'}
              </span>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="confirm"
            className="text-sm font-medium text-navy block mb-1.5"
          >
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              id="confirm"
              type={showConfirm ? 'text' : 'password'}
              value={form.confirmPassword}
              onChange={(e) =>
                setForm({ ...form, confirmPassword: e.target.value })
              }
              required
              autoComplete="new-password"
              className="w-full pl-10 pr-12 py-3 bg-bg border border-border rounded-xl text-navy placeholder:text-text-muted text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              placeholder="Re-enter password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-navy transition-colors"
            >
              {showConfirm ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Referral Code */}
        <div>
          <label
            htmlFor="referral"
            className="text-sm font-medium text-navy block mb-1.5"
          >
            Referral Code{' '}
            <span className="text-text-muted font-normal">(optional)</span>
          </label>
          <div className="relative">
            <ReferralLinkIcon />
            <input
              id="referral"
              type="text"
              value={form.referralCode}
              onChange={handleReferralChange}
              className="w-full pl-10 pr-12 py-3 bg-bg border border-border rounded-xl text-navy placeholder:text-text-muted text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all uppercase"
              placeholder="e.g. BOOSTLY123"
            />
            {isCheckingReferral && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                <Loader2 className="w-4 h-4 text-text-muted animate-spin" />
              </div>
            )}
            {referralValid === true && !isCheckingReferral && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                <Check className="w-4 h-4 text-success" />
              </div>
            )}
            {referralValid === false && !isCheckingReferral && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-danger" />
              </div>
            )}
          </div>
        </div>

        {/* Terms */}
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => setAgreeTerms(!agreeTerms)}
            className={cn(
              'w-5 h-5 rounded border transition-all flex items-center justify-center flex-shrink-0 mt-0.5',
              agreeTerms ? 'bg-primary border-primary' : 'border-border',
            )}
          >
            {agreeTerms && <Check className="w-3 h-3 text-white" />}
          </button>
          <span className="text-sm text-text-secondary">
            I agree to the{' '}
            <Link
              href="/terms"
              className="text-primary font-medium hover:text-primary-hover transition-colors"
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              href="/privacy"
              className="text-primary font-medium hover:text-primary-hover transition-colors"
            >
              Privacy Policy
            </Link>
          </span>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-gold hover:bg-gold-hover text-navy font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-gold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              <Rocket className="w-4 h-4" />
              Create Account
            </>
          )}
        </button>
      </form>

      {/* Footer */}
      <p className="text-center text-sm text-text-muted mt-6">
        Already have an account?{' '}
        <Link
          href="/login"
          className="text-primary font-semibold hover:text-primary-hover transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

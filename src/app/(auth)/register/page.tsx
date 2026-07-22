// src/app/(auth)/register/page.tsx

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  Sparkles,
  Shield,
  Zap,
  Coins,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

// ─── Custom SVG Icons ──────────────────────────────

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
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
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const BoostlyLogoIcon = () => (
  <svg className="w-12 h-12" viewBox="0 0 40 40" fill="none">
    <rect width="40" height="40" rx="12" fill="url(#gradient)" />
    <defs>
      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2563EB" />
        <stop offset="100%" stopColor="#7C3AED" />
      </linearGradient>
    </defs>
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
  const [isOAuthLoading, setIsOAuthLoading] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentStep, setCurrentStep] = useState<'info' | 'auth' | 'complete'>(
    'info',
  );
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
  const referralTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // ─── Detect mobile ──────────────────────────────
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

    return () => {
      if (referralTimeoutRef.current) {
        clearTimeout(referralTimeoutRef.current);
      }
    };
  }, [searchParams]);

  // ─── Check referral code validity ──────────────
  const checkReferralCode = useCallback(async (code: string) => {
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
  }, []);

  // ─── Handle referral code change ──────────────
  const handleReferralChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value.toUpperCase().trim();
    setForm((prev) => ({ ...prev, referralCode: code }));
    setReferralValid(null);

    if (referralTimeoutRef.current) {
      clearTimeout(referralTimeoutRef.current);
    }

    if (code.length >= 4) {
      referralTimeoutRef.current = setTimeout(() => {
        checkReferralCode(code);
      }, 500);
    }
  };

  // ─── Handle OAuth signup ──────────────────────
  const handleOAuthSignup = (provider: 'google' | 'facebook') => {
    setIsOAuthLoading(provider);

    const params = new URLSearchParams();
    if (form.referralCode) {
      params.set('ref', form.referralCode);
    }
    const returnTo = searchParams.get('returnTo') || '/dashboard';
    params.set('returnTo', returnTo);

    const url = `/api/auth/oauth/${provider}?${params.toString()}`;

    try {
      sessionStorage.setItem(
        'oauth_register_data',
        JSON.stringify({
          name: form.name,
          email: form.email,
          referralCode: form.referralCode,
          agreedToTerms: agreeTerms,
        }),
      );
    } catch {
      // Ignore storage errors
    }

    window.location.href = url;
  };

  // ─── Handle form submission ──────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

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

      const successMessage =
        data.referral?.status === 'PENDING'
          ? `Account created! ${data.referral.message}`
          : 'Account created! Check your email to verify.';

      toast.success(successMessage, {
        duration: 5000,
        icon: data.referral ? (
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

  // ─── Step Navigation ──────────────────────────────
  const goToStep = (step: 'info' | 'auth') => {
    setCurrentStep(step);
  };

  // ─── Render ──────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="w-full max-w-md">
        {/* Enhanced Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl blur-xl opacity-30 animate-pulse" />
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center shadow-xl">
                <BoostlyLogoIcon />
              </div>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-navy mb-2">
            Join Boostly
          </h1>
          <p className="text-text-secondary text-sm flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-gold" />
            Start earning rewards today
            <Sparkles className="w-4 h-4 text-gold" />
          </p>
        </div>

        {/* Feature Badges */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {[
            { icon: Coins, label: 'Earn Rewards' },
            { icon: Zap, label: 'Fast Payouts' },
            { icon: Shield, label: 'Secure' },
          ].map((item, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-1 p-2 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200/50"
            >
              <item.icon className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-medium text-text-secondary">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden">
          {/* Back Button */}
          <div className="px-6 pt-4">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="flex items-center gap-1.5 text-text-muted hover:text-navy text-sm transition-colors group touch-manipulation"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Back
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {/* Step Indicator */}
            <div className="flex items-center gap-2 mb-6">
              {['info', 'auth'].map((step, index) => (
                <div key={step} className="flex items-center gap-2 flex-1">
                  <button
                    type="button"
                    onClick={() => goToStep(step as 'info' | 'auth')}
                    className={cn(
                      'flex-1 py-2 rounded-xl text-xs font-semibold transition-all',
                      currentStep === step
                        ? 'bg-primary text-white shadow-lg shadow-primary/30'
                        : 'bg-gray-100 text-text-muted hover:bg-gray-200',
                    )}
                  >
                    {step === 'info' ? 'Your Info' : 'Secure Account'}
                  </button>
                  {index === 0 && (
                    <div className="w-8 h-0.5 bg-gray-200 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>

            {/* ─── Social Sign-up (Always Visible) ──────────── */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <button
                type="button"
                onClick={() => handleOAuthSignup('google')}
                disabled={isOAuthLoading !== null}
                className="flex-1 py-3 px-4 border-2 border-border rounded-2xl flex items-center justify-center gap-2.5 text-sm font-medium text-text-secondary hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[48px]"
              >
                {isOAuthLoading === 'google' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                <span className="hidden sm:inline">Continue with Google</span>
                <span className="sm:hidden">Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleOAuthSignup('facebook')}
                disabled={isOAuthLoading !== null}
                className="flex-1 py-3 px-4 border-2 border-border rounded-2xl flex items-center justify-center gap-2.5 text-sm font-medium text-text-secondary hover:border-blue-600 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[48px]"
              >
                {isOAuthLoading === 'facebook' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <FacebookIcon />
                )}
                <span className="hidden sm:inline">Continue with Facebook</span>
                <span className="sm:hidden">Facebook</span>
              </button>
            </div>

            {/* ─── Divider ──────────────────────────────────── */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-gray-300" />
              <span className="text-xs text-text-muted whitespace-nowrap font-medium">
                or continue with email
              </span>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-gray-300" />
            </div>

            {/* ─── Referral Code Banner ────────────────────── */}
            {form.referralCode && (
              <div
                className={cn(
                  'flex items-center gap-3 p-3 rounded-2xl mb-5 transition-all',
                  referralValid === true
                    ? 'bg-green-50 border border-green-300'
                    : referralValid === false
                      ? 'bg-red-50 border border-red-300'
                      : 'bg-amber-50 border border-amber-300',
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
                  className="text-text-muted hover:text-danger transition-colors flex-shrink-0 p-1 touch-manipulation"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* ─── Form ─────────────────────────────────────── */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name - Always visible */}
              <div
                className={cn(
                  'transition-all',
                  currentStep === 'auth' && 'sm:block',
                )}
              >
                <label
                  htmlFor="name"
                  className="text-sm font-semibold text-navy block mb-1.5"
                >
                  Full Name
                </label>
                <div className="relative">
                  {!isMobile && (
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                  )}
                  <input
                    id="name"
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    autoComplete="name"
                    className={cn(
                      'w-full py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl text-navy placeholder:text-text-muted text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all touch-manipulation',
                      !isMobile ? 'pl-12 pr-4' : 'px-4',
                    )}
                    placeholder="John Doe"
                  />
                </div>
              </div>

              {/* Email - Always visible */}
              <div>
                <label
                  htmlFor="email"
                  className="text-sm font-semibold text-navy block mb-1.5"
                >
                  Email Address
                </label>
                <div className="relative">
                  {!isMobile && (
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                  )}
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    required
                    autoComplete="email"
                    className={cn(
                      'w-full py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl text-navy placeholder:text-text-muted text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all touch-manipulation',
                      !isMobile ? 'pl-12 pr-4' : 'px-4',
                    )}
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* Password - Step 2 */}
              <div
                className={cn(
                  'transition-all duration-300 overflow-hidden',
                  currentStep === 'auth'
                    ? 'max-h-[500px] opacity-100'
                    : 'max-h-0 opacity-0',
                )}
              >
                <div className="space-y-4 pt-2">
                  <div>
                    <label
                      htmlFor="password"
                      className="text-sm font-semibold text-navy block mb-1.5"
                    >
                      Password
                    </label>
                    <div className="relative">
                      {!isMobile && (
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                      )}
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={(e) =>
                          setForm({ ...form, password: e.target.value })
                        }
                        required
                        autoComplete="new-password"
                        className={cn(
                          'w-full py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl text-navy placeholder:text-text-muted text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all touch-manipulation',
                          !isMobile ? 'pl-12 pr-12' : 'px-4 pr-12',
                        )}
                        placeholder="Min. 8 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-navy transition-colors p-1 touch-manipulation"
                        aria-label={
                          showPassword ? 'Hide password' : 'Show password'
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
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
                                className={`flex-1 h-1 rounded-full transition-all ${
                                  filled
                                    ? score <= 1
                                      ? 'bg-red-500'
                                      : score <= 2
                                        ? 'bg-amber-500'
                                        : 'bg-green-500'
                                    : 'bg-gray-200'
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

                  <div>
                    <label
                      htmlFor="confirm"
                      className="text-sm font-semibold text-navy block mb-1.5"
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      {!isMobile && (
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                      )}
                      <input
                        id="confirm"
                        type={showConfirm ? 'text' : 'password'}
                        value={form.confirmPassword}
                        onChange={(e) =>
                          setForm({ ...form, confirmPassword: e.target.value })
                        }
                        required
                        autoComplete="new-password"
                        className={cn(
                          'w-full py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl text-navy placeholder:text-text-muted text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all touch-manipulation',
                          !isMobile ? 'pl-12 pr-12' : 'px-4 pr-12',
                        )}
                        placeholder="Re-enter password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-navy transition-colors p-1 touch-manipulation"
                        aria-label={
                          showConfirm ? 'Hide password' : 'Show password'
                        }
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
                      className="text-sm font-semibold text-navy block mb-1.5"
                    >
                      Referral Code{' '}
                      <span className="text-text-muted font-normal">
                        (optional)
                      </span>
                    </label>
                    <div className="relative">
                      {!isMobile && (
                        <Gift className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                      )}
                      <input
                        id="referral"
                        type="text"
                        value={form.referralCode}
                        onChange={handleReferralChange}
                        className={cn(
                          'w-full py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl text-navy placeholder:text-text-muted text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all uppercase touch-manipulation',
                          !isMobile ? 'pl-12 pr-12' : 'px-4 pr-12',
                        )}
                        placeholder="e.g. BOOSTLY123"
                      />
                      {isCheckingReferral && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <Loader2 className="w-4 h-4 text-text-muted animate-spin" />
                        </div>
                      )}
                      {referralValid === true && !isCheckingReferral && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <Check className="w-4 h-4 text-success" />
                        </div>
                      )}
                      {referralValid === false && !isCheckingReferral && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
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
                        'w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center flex-shrink-0 mt-0.5 touch-manipulation',
                        agreeTerms
                          ? 'bg-primary border-primary'
                          : 'border-gray-300',
                      )}
                      aria-label={
                        agreeTerms ? 'Agree to terms' : 'Disagree to terms'
                      }
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
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                {currentStep === 'info' ? (
                  <button
                    type="button"
                    onClick={() => goToStep('auth')}
                    className="flex-1 py-3.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/30 touch-manipulation min-h-[52px] text-base"
                  >
                    Continue
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => goToStep('info')}
                      className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-navy font-bold rounded-2xl flex items-center justify-center gap-2 transition-all touch-manipulation min-h-[52px] text-base"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-3.5 bg-gold hover:bg-gold-hover text-navy font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-gold disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[52px] text-base"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Rocket className="w-5 h-5" />
                          Create Account
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
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
        </div>
      </div>
    </div>
  );
}

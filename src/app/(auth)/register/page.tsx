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
  BadgeCheck,
  ArrowRight,
  PlayCircle,
  Users,
  Wallet,
  PartyPopper,
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

// ─── Reward chip (signature decoration) ───────────
// Colors + animation are hardcoded here (not pulled from tailwind.config)
// so this renders correctly even if your theme extensions aren't compiling.

const RewardChip = ({
  icon,
  label,
  tone,
  style,
}: {
  icon: React.ReactNode;
  label: string;
  tone: 'gold' | 'primary' | 'success';
  style?: React.CSSProperties;
}) => {
  const toneClasses = {
    gold: 'bg-[#FBBF24]/15 border-[#FBBF24]/30 text-[#FBBF24]',
    primary: 'bg-[#2563EB]/15 border-[#2563EB]/30 text-[#93C5FD]',
    success: 'bg-[#22C55E]/15 border-[#22C55E]/30 text-[#4ADE80]',
  }[tone];

  return (
    <div
      className={cn(
        'absolute flex items-center gap-2 px-3.5 py-2 rounded-full border backdrop-blur-md shadow-lg',
        toneClasses,
      )}
      style={{ ...style, animation: 'boostlyFloat 3s ease-in-out infinite' }}
    >
      {icon}
      <span className="text-xs font-semibold whitespace-nowrap">{label}</span>
    </div>
  );
};

// ─── Main Component ───────────────────────────────

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState<string | null>(null);
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
  const referralTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  // ─── Password requirements ──────────────────────────
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    number: false,
    upper: false,
    special: false,
  });

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
          icon: <BadgeCheck className="w-5 h-5 text-[#22C55E]" />,
        });
      } else {
        setReferralValid(false);
        toast.error('Invalid referral code. Please check and try again.', {
          duration: 3000,
          icon: <AlertCircle className="w-5 h-5 text-[#EF4444]" />,
        });
      }
    } catch {
      setReferralValid(null);
    } finally {
      setIsCheckingReferral(false);
    }
  }, []);

  // ─── Capture referral code from URL ──────────────
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      const code = ref.toUpperCase().trim();
      setForm((prev) => ({ ...prev, referralCode: code }));
      toast.success(`Referral code applied: ${code}`, {
        duration: 4000,
        icon: <Gift className="w-5 h-5 text-[#FBBF24]" />,
      });
      checkReferralCode(code);
    }

    return () => {
      if (referralTimeoutRef.current) {
        clearTimeout(referralTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ─── Check password requirements ──────────────────
  useEffect(() => {
    const pw = form.password;
    setPasswordRequirements({
      length: pw.length >= 8,
      number: /[0-9]/.test(pw),
      upper: /[A-Z]/.test(pw),
      special: /[^A-Za-z0-9]/.test(pw),
    });
  }, [form.password]);

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
  const handleOAuthSignup = (provider: 'google') => {
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
          <PartyPopper className="w-5 h-5 text-[#FBBF24]" />
        ) : (
          <Check className="w-5 h-5 text-[#22C55E]" />
        ),
      });

      router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const pwScore = [
    passwordRequirements.length,
    passwordRequirements.upper,
    passwordRequirements.number,
    passwordRequirements.special,
  ].filter(Boolean).length;

  // ─── Render ──────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-0 lg:p-6">
      {/* Hardcoded keyframes — not dependent on tailwind.config animation/keyframes */}
      <style>{`
        @keyframes boostlyFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>

      <div className="w-full lg:max-w-[1100px] grid grid-cols-1 lg:grid-cols-[420px_1fr] lg:rounded-3xl lg:border lg:border-white/10 lg:shadow-xl overflow-hidden bg-[#1E293B]/30">
        {/* ═══════════ LEFT PANEL (brand) ═══════════ */}
        <div
          className="hidden lg:flex flex-col relative overflow-hidden p-10"
          style={{
            background:
              'linear-gradient(160deg, #0F172A 0%, #1E293B 55%, #334155 100%)',
          }}
        >
          {/* subtle grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(rgba(37,99,235,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,.5) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />

          {/* Brand */}
          <div className="relative z-10 flex items-center gap-3 mb-2">
            <div className="relative w-9 h-9 flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-r from-[#2563EB] via-[#FBBF24] to-[#8B5CF6] rounded-lg blur-md opacity-50" />
              <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#FBBF24] flex items-center justify-center">
                <span className="text-base font-black text-white">B</span>
              </div>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              Boostly
            </span>
          </div>
          <p className="relative z-10 text-sm text-white/50 mb-5">
            Watch. Refer. Earn.
          </p>
          <div className="relative z-10 w-9 h-0.5 bg-[#FBBF24] mb-7" />

          <h1 className="relative z-10 text-[28px] leading-[1.25] font-bold text-white mb-3.5">
            Built to reward{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #FBBF24, #F59E0B)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              every minute
            </span>{' '}
            you spend here
          </h1>
          <p className="relative z-10 text-sm text-white/50 leading-relaxed max-w-[280px] mb-9">
            Join thousands earning daily points, referral bonuses, and cash
            payouts on Boostly.
          </p>

          {/* Feature list */}
          <div className="relative z-10 flex flex-col gap-5">
            <div className="flex gap-3.5 items-start">
              <div className="w-9 h-9 flex-shrink-0 rounded-[10px] border border-[#2563EB]/35 bg-[#2563EB]/10 flex items-center justify-center text-[#93C5FD]">
                <PlayCircle className="w-[18px] h-[18px]" />
              </div>
              <div>
                <div className="text-sm font-bold text-white mb-0.5">
                  Watch &amp; Earn
                </div>
                <div className="text-[12.5px] text-white/45 leading-relaxed">
                  Get rewarded in points for every video you watch
                </div>
              </div>
            </div>
            <div className="flex gap-3.5 items-start">
              <div className="w-9 h-9 flex-shrink-0 rounded-[10px] border border-[#FBBF24]/35 bg-[#FBBF24]/10 flex items-center justify-center text-[#FBBF24]">
                <Users className="w-[18px] h-[18px]" />
              </div>
              <div>
                <div className="text-sm font-bold text-white mb-0.5">
                  Refer Friends
                </div>
                <div className="text-[12.5px] text-white/45 leading-relaxed">
                  Earn a welcome bonus for every friend who joins
                </div>
              </div>
            </div>
            <div className="flex gap-3.5 items-start">
              <div className="w-9 h-9 flex-shrink-0 rounded-[10px] border border-[#8B5CF6]/35 bg-[#8B5CF6]/10 flex items-center justify-center text-[#C4B5FD]">
                <Wallet className="w-[18px] h-[18px]" />
              </div>
              <div>
                <div className="text-sm font-bold text-white mb-0.5">
                  Instant Payouts
                </div>
                <div className="text-[12.5px] text-white/45 leading-relaxed">
                  Cash out to fiat or crypto whenever you like
                </div>
              </div>
            </div>
          </div>

          {/* Signature decoration: floating reward chips */}
          <div className="relative z-10 flex-1 min-h-[140px] mt-8">
            <RewardChip
              icon={<Gift className="w-3.5 h-3.5" />}
              label="+500 referral bonus"
              tone="gold"
              style={{ top: 8, left: 8, animationDelay: '0s' }}
            />
            <RewardChip
              icon={<PlayCircle className="w-3.5 h-3.5" />}
              label="+50 pts watched"
              tone="primary"
              style={{ top: 64, left: 96, animationDelay: '.8s' }}
            />
            <RewardChip
              icon={<Wallet className="w-3.5 h-3.5" />}
              label="$24.80 available"
              tone="success"
              style={{ top: 128, left: 16, animationDelay: '1.6s' }}
            />
          </div>

          <div className="relative z-10 mt-auto pt-6 text-sm text-white/50">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-[#FBBF24] font-semibold hover:text-[#F59E0B] transition-colors"
            >
              Log in
            </Link>
          </div>
        </div>

        {/* ═══════════ RIGHT PANEL (form) ═══════════ */}
        <div className="flex flex-col bg-[#0F172A] px-5 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-11 max-h-screen overflow-y-auto">
          {/* Mobile-only brand header */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#FBBF24] flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-black text-white">B</span>
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              Boostly
            </span>
          </div>

          <div className="text-center lg:text-left mb-7">
            <h2 className="text-2xl sm:text-[26px] font-bold text-white mb-1.5">
              Create your account
            </h2>
            <p className="text-[13.5px] text-white/45">
              Join Boostly and start earning daily rewards.
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center lg:justify-start mb-8">
            {[
              { n: 1, label: 'Account', state: 'active' as const },
              { n: 2, label: 'Verify Email', state: 'upcoming' as const },
              { n: 3, label: 'Start Earning', state: 'upcoming' as const },
            ].map((step, i, arr) => (
              <div key={step.n} className="flex items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all',
                      step.state === 'active'
                        ? 'border-[#2563EB] text-[#93C5FD] shadow-[0_0_0_3px_rgba(37,99,235,.15)]'
                        : 'border-white/15 text-white/30 bg-white/[0.02]',
                    )}
                  >
                    {step.n}
                  </div>
                  <div
                    className={cn(
                      'hidden sm:block text-[11px] font-medium whitespace-nowrap',
                      step.state === 'active'
                        ? 'text-[#93C5FD]'
                        : 'text-white/30',
                    )}
                  >
                    {step.label}
                  </div>
                </div>
                {i < arr.length - 1 && (
                  <div className="w-10 sm:w-16 h-px bg-white/10 mx-1 mb-4" />
                )}
              </div>
            ))}
          </div>

          {/* Social sign-up */}
          <div className="mb-6">
            <button
              type="button"
              onClick={() => handleOAuthSignup('google')}
              disabled={isOAuthLoading !== null}
              className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center gap-3 text-sm font-medium text-white/80 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[48px]"
            >
              {isOAuthLoading === 'google' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              <span>Continue with Google</span>
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] text-white/30 font-medium uppercase tracking-wider">
              or continue with email
            </span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Referral banner */}
          {form.referralCode && (
            <div
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl mb-5 transition-all text-sm',
                referralValid === true
                  ? 'bg-[#22C55E]/10 border border-[#22C55E]/20'
                  : referralValid === false
                    ? 'bg-[#EF4444]/10 border border-[#EF4444]/20'
                    : 'bg-[#FBBF24]/10 border border-[#FBBF24]/20',
              )}
            >
              {referralValid === true ? (
                <BadgeCheck className="w-4 h-4 text-[#4ADE80] flex-shrink-0" />
              ) : referralValid === false ? (
                <AlertCircle className="w-4 h-4 text-[#F87171] flex-shrink-0" />
              ) : (
                <Gift className="w-4 h-4 text-[#FBBF24] flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white">
                  {referralValid === true
                    ? 'Valid referral code!'
                    : referralValid === false
                      ? 'Invalid referral code'
                      : 'Referral code applied'}
                </p>
                <p className="text-[10px] text-white/40 truncate">
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
                className="text-white/30 hover:text-white/70 transition-colors flex-shrink-0 p-1 touch-manipulation"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="text-xs font-semibold text-white/70 block mb-1.5">
                Full Name
              </label>
              <div className="relative">
                {/* Icon hidden on mobile */}
                {!isMobile && (
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                )}
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  autoComplete="name"
                  className={cn(
                    'w-full py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:border-[#2563EB]/50 focus:ring-2 focus:ring-[#2563EB]/20 transition-all touch-manipulation',
                    !isMobile ? 'pl-10 pr-3.5' : 'px-4',
                  )}
                  placeholder="John Doe"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-white/70 block mb-1.5">
                Email Address
              </label>
              <div className="relative">
                {!isMobile && (
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                )}
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  autoComplete="email"
                  className={cn(
                    'w-full py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:border-[#2563EB]/50 focus:ring-2 focus:ring-[#2563EB]/20 transition-all touch-manipulation',
                    !isMobile ? 'pl-10 pr-3.5' : 'px-4',
                  )}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password + Confirm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1.5">
                  Password
                </label>
                <div className="relative">
                  {!isMobile && (
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                  )}
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    required
                    autoComplete="new-password"
                    className={cn(
                      'w-full py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:border-[#2563EB]/50 focus:ring-2 focus:ring-[#2563EB]/20 transition-all touch-manipulation',
                      !isMobile ? 'pl-10 pr-10' : 'px-4 pr-10',
                    )}
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors p-1 touch-manipulation"
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
              </div>

              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  {!isMobile && (
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                  )}
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={(e) =>
                      setForm({ ...form, confirmPassword: e.target.value })
                    }
                    required
                    autoComplete="new-password"
                    className={cn(
                      'w-full py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:border-[#2563EB]/50 focus:ring-2 focus:ring-[#2563EB]/20 transition-all touch-manipulation',
                      !isMobile ? 'pl-10 pr-10' : 'px-4 pr-10',
                    )}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors p-1 touch-manipulation"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Password requirements grid */}
            {form.password.length > 0 && (
              <div>
                <div className="flex gap-1 mb-2.5">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex-1 h-1 rounded-full transition-all',
                        i < pwScore
                          ? pwScore <= 1
                            ? 'bg-[#EF4444]'
                            : pwScore <= 2
                              ? 'bg-[#F59E0B]'
                              : 'bg-[#22C55E]'
                          : 'bg-white/10',
                      )}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                  {[
                    { key: 'length', label: 'At least 8 characters' },
                    { key: 'upper', label: 'One uppercase letter' },
                    { key: 'number', label: 'One number' },
                    { key: 'special', label: 'One special character' },
                  ].map((req) => {
                    const met =
                      passwordRequirements[
                        req.key as keyof typeof passwordRequirements
                      ];
                    return (
                      <div
                        key={req.key}
                        className={cn(
                          'flex items-center gap-2 text-xs transition-colors',
                          met ? 'text-white' : 'text-white/40',
                        )}
                      >
                        <div
                          className={cn(
                            'w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 transition-all',
                            met
                              ? 'bg-[#22C55E] border-[#22C55E]'
                              : 'border-white/15',
                          )}
                        >
                          {met && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        {req.label}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Referral Code */}
            <div>
              <label className="text-xs font-semibold text-white/70 block mb-1.5">
                Referral Code{' '}
                <span className="text-white/30 font-normal">(optional)</span>
              </label>
              <div className="relative">
                {!isMobile && (
                  <Gift className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                )}
                <input
                  type="text"
                  value={form.referralCode}
                  onChange={handleReferralChange}
                  className={cn(
                    'w-full py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:border-[#2563EB]/50 focus:ring-2 focus:ring-[#2563EB]/20 transition-all uppercase touch-manipulation',
                    !isMobile ? 'pl-10 pr-10' : 'px-4 pr-10',
                  )}
                  placeholder="e.g. BOOSTLY123"
                />
                {isCheckingReferral && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 text-white/30 animate-spin" />
                  </div>
                )}
                {referralValid === true && !isCheckingReferral && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Check className="w-4 h-4 text-[#4ADE80]" />
                  </div>
                )}
                {referralValid === false && !isCheckingReferral && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="w-4 h-4 text-[#F87171]" />
                  </div>
                )}
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3 pt-1">
              <button
                type="button"
                onClick={() => setAgreeTerms(!agreeTerms)}
                className={cn(
                  'w-4 h-4 rounded border-2 transition-all flex items-center justify-center flex-shrink-0 mt-0.5 touch-manipulation',
                  agreeTerms
                    ? 'bg-[#2563EB] border-[#2563EB]'
                    : 'border-white/30',
                )}
                aria-label={agreeTerms ? 'Agree to terms' : 'Disagree to terms'}
              >
                {agreeTerms && <Check className="w-2.5 h-2.5 text-white" />}
              </button>
              <span className="text-[11px] text-white/50 leading-relaxed">
                I agree to the{' '}
                <Link
                  href="/terms"
                  className="text-[#93C5FD] hover:text-[#BFDBFE] transition-colors"
                >
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link
                  href="/privacy"
                  className="text-[#93C5FD] hover:text-[#BFDBFE] transition-colors"
                >
                  Privacy Policy
                </Link>
              </span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#FBBF24] hover:bg-[#F59E0B] text-[#0F172A] font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#FBBF24]/20 hover:shadow-[#FBBF24]/40 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[48px] text-sm mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center lg:hidden text-xs text-white/30 mt-6">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-white/60 hover:text-white font-semibold transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

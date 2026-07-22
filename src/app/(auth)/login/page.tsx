// src/app/(auth)/login/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  Sparkles,
  Shield,
  Zap,
  Coins,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
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

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading: authLoading } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
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

  // ─── Load saved email ──────────────────────────────
  useEffect(() => {
    const savedEmail = localStorage.getItem('boostly_remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // ─── Handle OAuth login ──────────────────────────
  const handleOAuthLogin = (provider: 'google' | 'facebook') => {
    setIsOAuthLoading(provider);

    const params = new URLSearchParams();
    const returnTo = '/dashboard';
    params.set('returnTo', returnTo);

    const url = `/api/auth/oauth/${provider}?${params.toString()}`;
    window.location.href = url;
  };

  // ─── Handle form submission ──────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(email, password);

      // Check if 2FA is required
      if (result?.requires2FA && result.sessionId) {
        if (rememberMe) {
          localStorage.setItem('boostly_remembered_email', email);
        } else {
          localStorage.removeItem('boostly_remembered_email');
        }

        const params = new URLSearchParams({
          email,
          sessionId: result.sessionId,
          method: result.method || 'EMAIL',
          methods: JSON.stringify(
            result.enabledMethods || [result.method || 'EMAIL'],
          ),
        });
        router.push(`/2fa?${params.toString()}`);
        return;
      }

      // Check if email verification is needed
      if (result?.needsVerification) {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }

      // Check if login was successful
      if (result?.user) {
        // The login function handles the redirect internally
        return;
      }

      // If we get here with no user and no special cases
      if (!result?.user && !result?.requires2FA && !result?.needsVerification) {
        setError('Login failed. Please try again.');
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Invalid email or password';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
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
            Welcome Back! 👋
          </h1>
          <p className="text-text-secondary text-sm flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-gold" />
            Continue earning your daily rewards
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
            {/* ─── Social Login ──────────────────────────── */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <button
                type="button"
                onClick={() => handleOAuthLogin('google')}
                disabled={isOAuthLoading !== null}
                className="flex-1 py-3 px-4 border-2 border-gray-200 rounded-2xl flex items-center justify-center gap-2.5 text-sm font-medium text-text-secondary hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[48px]"
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
                onClick={() => handleOAuthLogin('facebook')}
                disabled={isOAuthLoading !== null}
                className="flex-1 py-3 px-4 border-2 border-gray-200 rounded-2xl flex items-center justify-center gap-2.5 text-sm font-medium text-text-secondary hover:border-blue-600 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[48px]"
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

            {/* ─── Form ─────────────────────────────────────── */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-sm text-center"
                >
                  {error}
                </motion.div>
              )}

              {/* Email */}
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold text-navy"
                  >
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-primary font-medium hover:text-primary-hover transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  {!isMobile && (
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                  )}
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className={cn(
                      'w-full py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl text-navy placeholder:text-text-muted text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all touch-manipulation',
                      !isMobile ? 'pl-12 pr-12' : 'px-4 pr-12',
                    )}
                    placeholder="Enter your password"
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
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRememberMe(!rememberMe)}
                  className={cn(
                    'w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center flex-shrink-0 touch-manipulation',
                    rememberMe
                      ? 'bg-primary border-primary'
                      : 'border-gray-300',
                  )}
                  aria-label={rememberMe ? 'Remember me' : "Don't remember me"}
                >
                  {rememberMe && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
                <span className="text-sm text-text-secondary">Remember me</span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading || authLoading}
                className="w-full py-3.5 bg-gold hover:bg-gold-hover text-navy font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-gold disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[52px] text-base"
              >
                {isLoading || authLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <p className="text-center text-sm text-text-muted mt-6">
              Don&apos;t have an account?{' '}
              <Link
                href="/register"
                className="text-primary font-semibold hover:text-primary-hover transition-colors"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

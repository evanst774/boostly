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
  Check,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import AuthShell from '@/components/auth/AuthShell';

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

  // ─── Load saved email ──────────────────────────────
  useEffect(() => {
    const savedEmail = localStorage.getItem('boostly_remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // ─── Handle OAuth login ──────────────────────────
  const handleOAuthLogin = (provider: 'google') => {
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
        // NOTE: added `from=login` so /verify-email knows to auto-send the
        // code (it only auto-sends when from === 'login' — previously this
        // redirect omitted that param, so auto-send never fired here).
        router.push(
          `/verify-email?email=${encodeURIComponent(email)}&from=login`,
        );
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

  return (
    <AuthShell
      bottomPrompt="New to Boostly?"
      bottomLinkText="Create an account"
      bottomLinkHref="/register"
    >
      <div className="text-center lg:text-left mb-7">
        <h2 className="text-2xl sm:text-[26px] font-bold text-white mb-1.5">
          Welcome back
        </h2>
        <p className="text-[13.5px] text-white/45">
          Continue earning your daily rewards.
        </p>
      </div>

      {/* Social login */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => handleOAuthLogin('google')}
          disabled={isOAuthLoading !== null}
          className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center gap-3 text-sm font-medium text-white/80 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
        >
          {isOAuthLoading === 'google' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          <span>Continue with Google</span>
        </button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-[10px] text-white/30 font-medium uppercase tracking-wider">
          or continue with email
        </span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#F87171] text-sm text-center"
          >
            {error}
          </motion.div>
        )}

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="text-xs font-semibold text-white/70 block mb-1.5"
          >
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full py-2.5 pl-10 pr-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:border-[#2563EB]/50 focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
              placeholder="you@example.com"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label
              htmlFor="password"
              className="text-xs font-semibold text-white/70"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-[#93C5FD] font-medium hover:text-[#BFDBFE] transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full py-2.5 pl-10 pr-10 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:border-[#2563EB]/50 focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors p-1"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Remember me */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setRememberMe(!rememberMe)}
            className={cn(
              'w-4 h-4 rounded border-2 transition-all flex items-center justify-center flex-shrink-0',
              rememberMe ? 'bg-[#2563EB] border-[#2563EB]' : 'border-white/30',
            )}
            aria-label={rememberMe ? 'Remember me' : "Don't remember me"}
          >
            {rememberMe && <Check className="w-2.5 h-2.5 text-white" />}
          </button>
          <span className="text-[13px] text-white/50">Remember me</span>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading || authLoading}
          className="w-full py-3 bg-[#FBBF24] hover:bg-[#F59E0B] text-[#0F172A] font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#FBBF24]/20 hover:shadow-[#FBBF24]/40 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] text-sm mt-2"
        >
          {isLoading || authLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
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

      <p className="hidden lg:block text-center text-xs text-white/30 mt-6">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="text-[#93C5FD] font-semibold hover:text-[#BFDBFE] transition-colors"
        >
          Create one
        </Link>
      </p>
    </AuthShell>
  );
}

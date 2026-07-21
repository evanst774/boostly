// src/app/(auth)/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading: authLoading } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem('boostly_remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

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

      // Check if login was successful (user is returned)
      if (result?.user) {
        // Success - user is already redirected by the login function
        // The login function handles the redirect internally
        return;
      }

      // If we get here with no user and no special cases, something went wrong
      if (!result?.user && !result?.requires2FA && !result?.needsVerification) {
        setError('Login failed. Please try again.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid email or password';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xl border border-border-light">
      {/* Logo */}
      <div className="flex justify-center mb-6">
        <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
          <div className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center font-black text-navy text-sm">
            B
          </div>
        </div>
      </div>

      <h1 className="text-2xl font-black text-navy text-center mb-1">
        Welcome back! 👋
      </h1>
      <p className="text-text-secondary text-sm text-center mb-6">
        Sign in to continue earning your daily rewards.
      </p>

      {/* Social login */}
      <div className="flex gap-3 mb-6">
        <button className="flex-1 py-2.5 border border-border rounded-xl flex items-center justify-center gap-2 text-sm font-medium text-text-secondary hover:border-primary hover:bg-primary-light transition-all">
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
          Google
        </button>
        <button className="flex-1 py-2.5 border border-border rounded-xl flex items-center justify-center gap-2 text-sm font-medium text-text-secondary hover:border-primary hover:bg-primary-light transition-all">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          Facebook
        </button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-text-muted">or continue with email</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm text-center"
          >
            {error}
          </motion.div>
        )}

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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full pl-10 pr-4 py-3 bg-bg border border-border rounded-xl text-navy placeholder:text-text-muted text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label htmlFor="password" className="text-sm font-medium text-navy">
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
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full pl-10 pr-12 py-3 bg-bg border border-border rounded-xl text-navy placeholder:text-text-muted text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              placeholder="Enter your password"
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
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRememberMe(!rememberMe)}
            className={`w-4 h-4 rounded border transition-all flex items-center justify-center flex-shrink-0 ${
              rememberMe ? 'bg-primary border-primary' : 'border-border'
            }`}
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

        <button
          type="submit"
          disabled={isLoading || authLoading}
          className="w-full py-3 bg-gold hover:bg-gold-hover text-navy font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-gold disabled:opacity-50 disabled:cursor-not-allowed"
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
  );
}

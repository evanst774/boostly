// components/auth/login/LoginForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface LoginFormProps {
  on2FARedirect: (
    email: string,
    sessionId: string,
    method: string,
    methods: string[],
  ) => void;
}

export function LoginForm({ on2FARedirect }: LoginFormProps) {
  const { login, isLoading: authLoading } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem('mototrack_remembered_email');
    if (savedEmail) {
      setFormData((prev) => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const result = await login(formData.email, formData.password);
      if (result?.requires2FA && result.sessionId) {
        if (rememberMe)
          localStorage.setItem('mototrack_remembered_email', formData.email);
        else localStorage.removeItem('mototrack_remembered_email');
        on2FARedirect(
          formData.email,
          result.sessionId,
          result.method || 'EMAIL',
          result.enabledMethods || [result.method || 'EMAIL'],
        );
        return;
      }
      if (result?.needsVerification) return;
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
    <>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center"
          role="alert"
        >
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div>
          <label
            htmlFor="login-email"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Email Address
          </label>
          <div className="relative">
            {/* Icon — hidden on mobile, visible sm+ */}
            <div className="absolute inset-y-0 left-0 hidden sm:flex items-center pl-4 pointer-events-none">
              <Mail className="w-4 h-4 text-gray-500" />
            </div>
            <input
              id="login-email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              autoComplete="email"
              className="w-full pl-4 sm:pl-11 pr-4 py-3 rounded-xl bg-surface/50 border border-border-subtle text-white placeholder:text-gray-500 text-sm focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 transition-all touch-manipulation"
              placeholder="admin@mototrack.com"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label
              htmlFor="login-password"
              className="text-sm font-medium text-gray-300"
            >
              Password
            </label>
            <a
              href="/forgot-password"
              className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
            >
              Forgot password?
            </a>
          </div>
          <div className="relative">
            {/* Icon — hidden on mobile, visible sm+ */}
            <div className="absolute inset-y-0 left-0 hidden sm:flex items-center pl-4 pointer-events-none">
              <Lock className="w-4 h-4 text-gray-500" />
            </div>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
              autoComplete="current-password"
              className="w-full pl-4 sm:pl-11 pr-12 py-3 rounded-xl bg-surface/50 border border-border-subtle text-white placeholder:text-gray-500 text-sm focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 transition-all touch-manipulation"
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
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

        {/* Remember Me */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              onClick={() => setRememberMe(!rememberMe)}
              className={`w-4 h-4 rounded border transition-all cursor-pointer flex items-center justify-center ${
                rememberMe
                  ? 'bg-primary-500 border-primary-500'
                  : 'border-gray-600 hover:border-gray-500'
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
            </div>
            <span className="text-sm text-gray-400">Remember me</span>
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading || authLoading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-medium flex items-center justify-center gap-2 hover:from-primary-600 hover:to-accent-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {isLoading || authLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </form>
    </>
  );
}

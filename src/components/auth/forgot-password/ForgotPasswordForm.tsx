// components/auth/ForgotPasswordForm.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Loader2, ArrowRight, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

interface ForgotPasswordFormProps {
  onSuccess: (email: string) => void;
}

export function ForgotPasswordForm({ onSuccess }: ForgotPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        onSuccess(email);
        toast.success('Reset link sent to your email!');
      } else {
        setError(data.message || 'Something went wrong');
        toast.error(data.message || 'Something went wrong');
      }
    } catch {
      setError('Failed to send reset link. Please try again.');
      toast.error('Failed to send reset link');
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
            htmlFor="forgot-password-email"
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
              id="forgot-password-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full pl-4 sm:pl-11 pr-4 py-3 rounded-xl bg-surface/50 border border-border-subtle text-white placeholder:text-gray-500 text-sm focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 transition-all touch-manipulation"
              placeholder="admin@themototrack.com"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-gray-600 flex-shrink-0" />
            We&apos;ll send a password reset link to this email address.
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-medium flex items-center justify-center gap-2 hover:from-primary-600 hover:to-accent-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Sending...</span>
            </>
          ) : (
            <>
              <span>Send Reset Link</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-primary-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Login
        </Link>
      </div>
    </>
  );
}

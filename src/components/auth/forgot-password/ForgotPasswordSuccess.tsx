// components/auth/ForgotPasswordSuccess.tsx
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, CheckCircle } from 'lucide-react';

interface ForgotPasswordSuccessProps {
  email: string;
  onReset: () => void;
}

export function ForgotPasswordSuccess({
  email,
  onReset,
}: ForgotPasswordSuccessProps) {
  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4"
      >
        <Mail className="w-8 h-8 text-green-400" />
      </motion.div>

      <h2 className="text-xl font-rebond-bold text-white mb-2">
        Check Your Email
      </h2>
      <p className="text-gray-400 text-sm mb-4">
        We&apos;ve sent a password reset link to{' '}
        <span className="text-primary-400 font-medium">{email}</span>
      </p>

      <Link
        href="/login"
        className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-medium inline-flex items-center justify-center gap-2 hover:from-primary-600 hover:to-accent-600 transition-all duration-200"
      >
        <CheckCircle className="w-4 h-4" />
        Back to Login
      </Link>

      <p className="text-xs text-gray-500 mt-4">
        Didn&apos;t receive the email?{' '}
        <button
          onClick={onReset}
          className="text-primary-400 hover:text-primary-300 transition-colors"
        >
          Try again
        </button>
      </p>
    </div>
  );
}

// components/auth/reset-password/ResetPasswordSuccess.tsx
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight } from 'lucide-react';

export function ResetPasswordSuccess() {
  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4"
      >
        <CheckCircle className="w-8 h-8 text-green-400" />
      </motion.div>

      <h2 className="text-xl font-rebond-bold text-white mb-2">
        Password Reset!
      </h2>
      <p className="text-gray-400 text-sm mb-6">
        Your password has been successfully reset.
      </p>

      <Link
        href="/login"
        className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-medium inline-flex items-center justify-center gap-2 hover:from-primary-600 hover:to-accent-600 transition-all duration-200"
      >
        Login Now
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

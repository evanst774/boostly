// src/components/ErrorLayout.tsx
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, RefreshCw, Home } from 'lucide-react';
import { GlitchNumber } from '@/components/vectors/ErrorIllustrations';

interface ErrorLayoutProps {
  code: number;
  title: string;
  message: string;
  showReset?: boolean;
  onReset?: () => void;
}

export default function ErrorLayout({
  code,
  title,
  message,
  showReset,
  onReset,
}: ErrorLayoutProps) {
  const navItems = [
    { name: 'Home', href: '/home' },
    { name: 'Earn', href: '/earn' },
    { name: 'Games', href: '/games' },
    { name: 'Wallet', href: '/wallet' },
    { name: 'Referrals', href: '/referrals' },
    { name: 'Settings', href: '/settings' },
  ];

  return (
    <div className="relative min-h-screen bg-navy overflow-hidden">
      {/* Soft gradient glow from primary color */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/8 via-transparent to-transparent" />

      {/* Subtle top glow */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-primary/5 to-transparent" />

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-4xl mx-auto w-full text-center">
          {/* Error Code */}
          <div className="mb-6">
            <GlitchNumber number={code} />
          </div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl md:text-3xl font-bold text-white mt-4 mb-3"
          >
            {title}
          </motion.h1>

          {/* Message */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-white/50 text-base max-w-md mx-auto"
          >
            {message}
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mt-8 mb-16"
          >
            <Link
              href="/home"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gold text-navy font-bold text-sm hover:bg-gold-hover transition-all duration-200 shadow-gold"
            >
              <Home className="w-4 h-4" />
              Go to Home
            </Link>

            {showReset && onReset && (
              <button
                onClick={onReset}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-white font-medium text-sm hover:bg-white/10 hover:border-primary/30 transition-all duration-200"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            )}

            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-white font-medium text-sm hover:bg-white/10 hover:border-primary/30 transition-all duration-200"
            >
              <Mail className="w-4 h-4" />
              Contact Support
            </Link>
          </motion.div>

          {/* Quick Navigation Cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 max-w-3xl mx-auto"
          >
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="group bg-white/5 backdrop-blur-sm rounded-xl p-4 text-center hover:bg-white/10 transition-all duration-200 border border-white/5 hover:border-primary/30"
              >
                <div className="text-xs font-medium text-white/50 group-hover:text-white transition-colors">
                  {item.name}
                </div>
              </Link>
            ))}
          </motion.div>

          {/* Help Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-12 pt-8 border-t border-white/10 max-w-md mx-auto"
          >
            <p className="text-sm text-white/40 mb-4">
              Need immediate assistance?
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/contact"
                className="text-sm text-gold hover:text-gold-hover transition-colors"
              >
                Contact Support →
              </Link>
              <span className="text-white/20 hidden sm:inline">•</span>
              <Link
                href="/help"
                className="text-sm text-gold hover:text-gold-hover transition-colors"
              >
                View Help Center →
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

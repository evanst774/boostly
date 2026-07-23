// src/app/resources/faq/page.tsx

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  ChevronDown,
  HelpCircle,
  Users,
  Wallet,
  Gift,
  Shield,
  Coins,
  Award,
  Smartphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const faqs = [
  {
    icon: Users,
    category: 'Account',
    q: 'How do I create a Boostly account?',
    a: "Go to the registration page, fill in your full name, email address, and create a password. Verify your email address and you're ready to start earning rewards!",
  },
  {
    icon: Wallet,
    category: 'Earnings',
    q: 'How do I earn rewards on Boostly?',
    a: 'You can earn rewards by watching videos, playing games, completing surveys, watching ads, referring friends, and claiming daily bonuses. Each activity has a specific reward rate.',
  },
  {
    icon: Gift,
    category: 'Referrals',
    q: 'How does the referral program work?',
    a: "Share your unique referral code with friends. When they sign up and start earning, you'll receive a commission. Commission rates vary based on your subscription plan.",
  },
  {
    icon: Shield,
    category: 'Security',
    q: 'How do I enable Two-Factor Authentication?',
    a: 'Go to Settings → Security. Under Two-Factor Authentication, click Enable on Email or Authenticator App. Follow the verification steps to secure your account.',
  },
  {
    icon: Coins,
    category: 'Subscriptions',
    q: 'What subscription plans are available?',
    a: 'Boostly offers Starter, Silver, Gold, and Platinum plans. Higher tiers offer increased earning potential, priority withdrawals, and VIP support.',
  },
  {
    icon: Award,
    category: 'Badges',
    q: 'How do badges work?',
    a: 'Badges are one-time purchases that boost your earnings. Silver gives +15%, Gold gives +30%, and Platinum gives +30% plus VIP support. Badges are lifetime purchases.',
  },
  {
    icon: Wallet,
    category: 'Withdrawals',
    q: 'How do I withdraw my earnings?',
    a: 'Go to Wallet → Withdraw. Choose your preferred method (Mobile Money, Bank Transfer, or Crypto), enter the amount, and submit. Minimum withdrawal is 5,000 RWF.',
  },
  {
    icon: Smartphone,
    category: 'Mobile',
    q: 'Is there a Boostly mobile app?',
    a: 'Yes! Boostly is available as a progressive web app (PWA) that works on all devices. You can install it on your phone for a native app-like experience.',
  },
  {
    icon: Shield,
    category: 'Security',
    q: 'Is my data safe on Boostly?',
    a: 'Yes! We use industry-standard security measures including TLS/SSL encryption, secure servers, 2FA, and regular security audits to protect your data.',
  },
  {
    icon: Gift,
    category: 'Referrals',
    q: 'How much can I earn from referrals?',
    a: "Referral commissions vary by your subscription plan. Free users earn 10%, while Premium users can earn up to 25% of your referred friends' earnings.",
  },
  {
    icon: Users,
    category: 'Account',
    q: 'Can I change my account details?',
    a: 'Yes! Go to Settings → Profile to update your name, email, phone number, and other personal information.',
  },
  {
    icon: Coins,
    category: 'Subscriptions',
    q: 'Can I upgrade or downgrade my plan?',
    a: 'Yes! You can upgrade your plan anytime to unlock higher earning potential. Downgrades take effect at the end of your current billing cycle.',
  },
];

export default function FAQPage() {
  const [search, setSearch] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Get unique categories
  const categories = ['All', ...new Set(faqs.map((f) => f.category))];

  // Filter FAQs by search and category
  const filteredFaqs = faqs.filter((f) => {
    const matchesSearch =
      f.q.toLowerCase().includes(search.toLowerCase()) ||
      f.a.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || f.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A]">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Boostly
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-gold" />
            </div>
            <span className="text-xs font-medium text-gold uppercase tracking-wider">
              Support
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-navy dark:text-white mb-3">
            Frequently Asked <span className="text-gold">Questions</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-2xl">
            Find answers to common questions about Boostly rewards platform.
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative mb-6"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-navy dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-transparent transition-all"
          />
        </motion.div>

        {/* Category Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-wrap gap-2 mb-6"
        >
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-all touch-manipulation',
                selectedCategory === category
                  ? 'bg-gold text-navy font-semibold'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700',
              )}
            >
              {category}
            </button>
          ))}
        </motion.div>

        {/* FAQ List */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          {filteredFaqs.map((faq, idx) => {
            const Icon = faq.icon;
            const isOpen = openFaq === idx;

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={cn(
                  'rounded-xl border transition-all duration-300',
                  isOpen
                    ? 'border-gold/30 bg-gold/5'
                    : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-800/50',
                )}
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full flex items-center gap-3 p-4 text-left touch-manipulation min-h-[56px]"
                >
                  <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gold font-medium">
                        {faq.category}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        •
                      </span>
                      <span className="text-sm font-medium text-navy dark:text-white">
                        {faq.q}
                      </span>
                    </div>
                  </div>
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0 transition-transform duration-300',
                      isOpen && 'rotate-180',
                    )}
                  />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pl-[52px]">
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                          {faq.a}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}

          {filteredFaqs.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <HelpCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                No questions match your search.
              </p>
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('All');
                }}
                className="mt-2 text-sm text-gold hover:underline"
              >
                Clear filters
              </button>
            </motion.div>
          )}
        </motion.div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 dark:text-gray-500">
            <p>© {new Date().getFullYear()} Boostly. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link
                href="/terms"
                className="hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Terms of Service
              </Link>
              <span className="text-gray-300 dark:text-gray-700">•</span>
              <Link
                href="/privacy"
                className="hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>
              <span className="text-gray-300 dark:text-gray-700">•</span>
              <Link
                href="/"
                className="hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

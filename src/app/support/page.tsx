// src/app/support/page.tsx

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Mail,
  MessageSquare,
  Clock,
  Sparkles,
  Shield,
  Zap,
} from 'lucide-react';

export default function SupportPage() {
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
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-gold" />
            </div>
            <span className="text-xs font-medium text-gold uppercase tracking-wider">
              Support
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-navy dark:text-white mb-4">
            How can we <span className="text-gold">help</span>?
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-2xl leading-relaxed">
            Get the support you need. Our team is here to help you with any
            questions about Boostly.
          </p>
        </motion.div>

        {/* Support Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          {/* Live Chat */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-gold/30 hover:shadow-md transition-all"
          >
            <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6 text-gold" />
            </div>
            <h3 className="text-base font-semibold text-navy dark:text-white mb-1">
              Live Chat
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Chat with our support team in real-time.
            </p>
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold hover:bg-gold-hover text-navy font-semibold text-sm transition-all shadow-gold/20 hover:shadow-gold/30">
              Start Chat
              <span className="text-xs bg-navy/10 px-1.5 py-0.5 rounded-full">
                Live
              </span>
            </button>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
              Available 8:00 AM - 6:00 PM (CAT)
            </p>
          </motion.div>

          {/* Email Support */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-gold/30 hover:shadow-md transition-all"
          >
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-navy dark:text-white mb-1">
              Email Support
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Send us an email and we&apos;ll get back to you.
            </p>
            <a
              href="mailto:support@boostly.buzz"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold text-sm transition-all shadow-primary/20 hover:shadow-primary/30"
            >
              Email Us
            </a>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
              support@boostly.buzz
            </p>
          </motion.div>
        </div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12"
        >
          {[
            {
              icon: Clock,
              title: 'Response Time',
              desc: 'Within 24 hours',
              color: 'text-primary',
              bg: 'bg-primary/5 border-primary/20',
            },
            {
              icon: Shield,
              title: 'Priority Support',
              desc: 'For Premium members',
              color: 'text-gold',
              bg: 'bg-gold/5 border-gold/20',
            },
            {
              icon: Zap,
              title: 'Quick Help',
              desc: 'Live chat available',
              color: 'text-purple-400',
              bg: 'bg-purple/5 border-purple/20',
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border ${item.bg} text-center`}
              >
                <div
                  className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center mx-auto mb-2 ${item.color}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-semibold text-navy dark:text-white">
                  {item.title}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 rounded-xl bg-gold/5 border border-gold/20"
        >
          <h3 className="text-lg font-bold text-navy dark:text-white mb-3">
            Quick Answers
          </h3>
          <div className="space-y-3">
            {[
              {
                q: 'How do I start earning?',
                a: 'Create an account, complete your profile, and start watching videos, playing games, or completing surveys.',
              },
              {
                q: 'How do I withdraw my earnings?',
                a: 'Go to Wallet → Withdraw, choose your preferred method, and follow the instructions.',
              },
              {
                q: 'How long do withdrawals take?',
                a: 'Withdrawals are typically processed within 24-48 hours.',
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700"
              >
                <p className="text-sm font-medium text-navy dark:text-white mb-0.5">
                  {faq.q}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
          <Link
            href="/resources/faq"
            className="inline-block mt-4 text-sm text-gold hover:text-gold-hover font-medium transition-colors"
          >
            View all FAQs →
          </Link>
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

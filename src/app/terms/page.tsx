// src/app/terms/page.tsx

'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FileText,
  Shield,
  Users,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Zap,
  Smartphone,
  Award,
} from 'lucide-react';

// Clock icon component
const Clock = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export default function TermsPage() {
  const sections = [
    {
      id: 'acceptance',
      title: 'Acceptance of Terms',
      content: (
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <p>
            By accessing and using Boostly (&quot;the Service&quot;), you agree
            to be bound by these Terms of Service. If you do not agree to these
            terms, please do not use the Service.
          </p>
          <p>
            These terms constitute a legally binding agreement between you and
            Boostly regarding your use of the platform. By using the Service,
            you acknowledge that you have read, understood, and agree to be
            bound by these terms.
          </p>
          <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-2">
            <Clock className="w-3 h-3" />
            <span>
              Last updated:{' '}
              {new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
      ),
    },
    {
      id: 'service',
      title: 'Description of Service',
      content: (
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <p>
            Boostly is a rewards platform that enables users to earn real
            rewards through engaging activities including:
          </p>
          <ul className="space-y-2">
            {[
              'Watching short educational and entertaining videos',
              'Playing fun and engaging games',
              'Completing sponsored surveys',
              'Referring friends and earning bonuses',
              'Claiming daily bonuses and maintaining streaks',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      id: 'accounts',
      title: 'User Accounts',
      content: (
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <p>
            To access Boostly&apos;s features, you must create an account. You
            agree to:
          </p>
          <ul className="space-y-2">
            {[
              'Provide accurate and complete registration information',
              'Maintain the confidentiality of your account credentials',
              'Be responsible for all activities under your account',
              'Notify us immediately of any unauthorized use',
              'Be at least 18 years old to use the Service',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      id: 'acceptable-use',
      title: 'Acceptable Use',
      content: (
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <p>
            You agree not to engage in any of the following prohibited
            activities:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              'Use automated bots or scripts to earn rewards unfairly',
              'Create multiple accounts to abuse referral bonuses',
              'Manipulate or exploit the reward system',
              'Upload viruses, malware, or malicious code',
              'Harass, abuse, or harm other users',
              'Use the Service for any illegal purposes',
              'Interfere with or disrupt Service operations',
              'Attempt to gain unauthorized access to systems',
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30"
              >
                <span className="text-red-500 text-sm mt-0.5">✕</span>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'rewards',
      title: 'Rewards & Withdrawals',
      content: (
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-navy dark:text-white mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-gold" />
                Earning Rewards
              </h4>
              <ul className="space-y-2 text-sm">
                {[
                  'Earn rewards through completing activities',
                  'Each activity has specific reward rates',
                  'Daily limits apply to ensure fair usage',
                  'Bonuses available through streaks and referrals',
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-gray-600 dark:text-gray-400"
                  >
                    <span className="text-gold mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-navy dark:text-white mb-3 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-gold" />
                Withdrawals
              </h4>
              <ul className="space-y-2 text-sm">
                {[
                  'Minimum withdrawal amount: 5,000 RWF',
                  'Processed within 24-48 hours',
                  'Supported: Mobile Money, Bank Transfer, Crypto',
                  'Withdrawal fees may apply',
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-gray-600 dark:text-gray-400"
                  >
                    <span className="text-gold mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'referrals',
      title: 'Referral Program',
      content: (
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-navy dark:text-white mb-3">
                How It Works
              </h4>
              <ul className="space-y-2 text-sm">
                {[
                  'Share your unique referral code with friends',
                  'Earn rewards when friends join and earn',
                  'Commission rates vary by subscription plan',
                  'Referral bonuses paid when referees earn rewards',
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-gray-600 dark:text-gray-400"
                  >
                    <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-navy dark:text-white mb-3">
                Program Rules
              </h4>
              <ul className="space-y-2 text-sm">
                {[
                  'Self-referrals are strictly prohibited',
                  'Referral abuse will result in account suspension',
                  'Bonuses subject to activity verification',
                  'Referral rewards are not guaranteed',
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-gray-600 dark:text-gray-400"
                  >
                    <Lock className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'subscriptions',
      title: 'Subscriptions & Badges',
      content: (
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-navy dark:text-white mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-gold" />
                Subscription Plans
              </h4>
              <ul className="space-y-2 text-sm">
                {[
                  'Starter, Silver, Gold, and Platinum tiers',
                  'Higher tiers offer increased earning potential',
                  'Priority withdrawals for premium members',
                  'VIP support for top-tier members',
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-gray-600 dark:text-gray-400"
                  >
                    <span className="text-gold mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-navy dark:text-white mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-gold" />
                Badges (One-Time Purchase)
              </h4>
              <ul className="space-y-2 text-sm">
                {[
                  'Silver Badge: +15% earnings boost',
                  'Gold Badge: +30% earnings boost',
                  'Platinum Badge: +30% + VIP support',
                  'Badges are lifetime purchases',
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-gray-600 dark:text-gray-400"
                  >
                    <span className="text-gold mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'privacy',
      title: 'Data & Privacy',
      content: (
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: Shield,
                title: 'Data Collection',
                description:
                  'We collect: email, name, activity data, and wallet information',
              },
              {
                icon: Lock,
                title: 'Data Security',
                description:
                  'Encryption, secure cookies, and regular security audits',
              },
              {
                icon: Users,
                title: 'Your Rights',
                description:
                  'Access, deletion, and opt-out of non-essential data collection',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-center"
              >
                <item.icon className="w-6 h-6 text-gold mx-auto mb-2" />
                <h4 className="text-xs font-semibold text-navy dark:text-white mb-1">
                  {item.title}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            For detailed information, please review our full Privacy Policy.
          </p>
        </div>
      ),
    },
    {
      id: 'liability',
      title: 'Liability & Termination',
      content: (
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-navy dark:text-white mb-3">
                Limitation of Liability
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Boostly is not liable for indirect, incidental, or consequential
                damages. The platform is provided &quot;as is&quot; without
                warranties of any kind.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-navy dark:text-white mb-3">
                Termination
              </h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Accounts may be suspended for violating terms</li>
                <li>• You may delete your account at any time</li>
                <li>• Remaining funds subject to review upon termination</li>
              </ul>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/30">
            <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>
                Any disputes shall be resolved through binding arbitration in
                accordance with applicable law.
              </span>
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'changes',
      title: 'Changes to Terms',
      content: (
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <p>
            Boostly reserves the right to modify these terms at any time.
            Changes will be communicated via email or platform notification.
          </p>
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/30">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-gold" />
              </div>
              <div>
                <p className="text-sm font-medium text-navy dark:text-white">
                  Stay Informed
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  We recommend reviewing these terms periodically to stay
                  informed of any updates or changes.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

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
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-gold" />
            </div>
            <span className="text-xs font-medium text-gold uppercase tracking-wider">
              Legal
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-navy dark:text-white mb-3">
            Terms of Service
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-2xl">
            These terms govern your use of the Boostly platform. By using our
            services, you agree to these terms.
          </p>
        </motion.div>

        {/* Sections */}
        <div className="space-y-8">
          {sections.map((section, idx) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="border-b border-gray-100 dark:border-gray-800 last:border-0 pb-8 last:pb-0"
            >
              <h2 className="text-lg font-semibold text-navy dark:text-white mb-4 flex items-center gap-3">
                <span className="text-xs font-mono text-gray-400 dark:text-gray-600">
                  {(idx + 1).toString().padStart(2, '0')}
                </span>
                {section.title}
              </h2>
              <div className="pl-0 sm:pl-9">{section.content}</div>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 dark:text-gray-500">
            <p>© {new Date().getFullYear()} Boostly. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link
                href="/privacy"
                className="hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>
              <span className="text-gray-300 dark:text-gray-700">•</span>
              <Link
                href="/cookies"
                className="hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Cookie Policy
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

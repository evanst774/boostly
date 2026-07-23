// src/app/privacy/page.tsx

'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Shield,
  Lock,
  Eye,
  FileText,
  Server,
  Users,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';

export default function PrivacyPage() {
  const sections = [
    {
      id: 'introduction',
      title: 'Introduction',
      content: (
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <p>
            Boostly (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;)
            is a rewards platform that enables users to earn real rewards
            through engaging activities. This Privacy Policy explains how we
            collect, use, store, and protect your information.
          </p>
          <p>
            By using our platform, you agree to the terms outlined in this
            policy. We are committed to protecting your privacy with
            industry-standard security measures.
          </p>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gold/10 border border-gold/20 text-xs">
            <Shield className="w-4 h-4 text-gold flex-shrink-0" />
            <span className="text-gray-600 dark:text-gray-400">
              We are committed to protecting your privacy with industry-standard
              security measures.
            </span>
          </div>
        </div>
      ),
    },
    {
      id: 'collection',
      title: 'Information We Collect',
      content: (
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <p>We collect the following types of information:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                title: 'Account Information',
                items: ['Name, email address, phone number'],
                icon: Users,
              },
              {
                title: 'Activity Data',
                items: ['Videos watched, games played, surveys completed'],
                icon: Eye,
              },
              {
                title: 'Wallet Information',
                items: ['Transaction history, withdrawal details'],
                icon: Server,
              },
              {
                title: 'Device Information',
                items: ['Device type, browser, IP address'],
                icon: Shield,
              },
            ].map((category) => (
              <div
                key={category.title}
                className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-2 mb-2">
                  <category.icon className="w-4 h-4 text-gold" />
                  <h4 className="text-xs font-semibold text-navy dark:text-white">
                    {category.title}
                  </h4>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {category.items.join(', ')}
                </p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'usage',
      title: 'How We Use Your Data',
      content: (
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <p>We use your information to:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              'Provide and maintain our services',
              'Process reward earnings and withdrawals',
              'Send notifications about your account',
              'Improve platform performance and features',
              'Detect and prevent fraud',
              'Comply with legal obligations',
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
              >
                <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
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
      id: 'security',
      title: 'Data Security',
      content: (
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <p>We implement robust security measures to protect your data:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                icon: Lock,
                title: 'TLS/SSL Encryption',
                desc: 'All data encrypted in transit',
              },
              {
                icon: Server,
                title: 'Secure Servers',
                desc: 'Restricted access to data centers',
              },
              {
                icon: Shield,
                title: '2FA Available',
                desc: 'Extra account protection',
              },
              {
                icon: Users,
                title: 'Role-Based Access',
                desc: 'Granular permission controls',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
              >
                <item.icon className="w-4 h-4 text-gold flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-navy dark:text-white">
                    {item.title}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'sharing',
      title: 'Data Sharing',
      content: (
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <div className="p-4 rounded-lg bg-gold/10 border border-gold/20">
            <p className="text-sm font-medium text-navy dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-gold" />
              We DO NOT sell your data.
            </p>
          </div>
          <p>We may share your data in the following circumstances:</p>
          <ul className="space-y-2">
            {[
              'With your explicit consent',
              'With trusted service providers',
              'To comply with legal obligations',
              'In case of business transfer or acquisition',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      id: 'rights',
      title: 'Your Rights',
      content: (
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <p>You have the following rights regarding your data:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              'Access your personal data',
              'Correct inaccurate data',
              'Request data deletion',
              'Data portability',
              'Object to data processing',
              'Restrict data processing',
            ].map((right, i) => (
              <div
                key={i}
                className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
              >
                <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {right}
                </span>
              </div>
            ))}
          </div>
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/30">
            <p className="text-xs text-blue-700 dark:text-blue-400">
              To exercise your rights, please contact us at{' '}
              <Link
                href="mailto:support@boostly.buzz"
                className="font-medium hover:underline"
              >
                support@boostly.buzz
              </Link>
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'cookies',
      title: 'Cookies & Tracking',
      content: (
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <p>
            We use cookies and similar tracking technologies to improve your
            experience on Boostly. Cookies help us understand how you use the
            platform and enable certain features.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                title: 'Essential Cookies',
                desc: 'Required for platform functionality',
              },
              {
                title: 'Preference Cookies',
                desc: 'Remember your settings and preferences',
              },
              {
                title: 'Analytics Cookies',
                desc: 'Help us understand platform usage',
              },
              {
                title: 'Security Cookies',
                desc: 'Protect against fraud and abuse',
              },
            ].map((cookie) => (
              <div
                key={cookie.title}
                className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
              >
                <h4 className="text-xs font-semibold text-navy dark:text-white mb-1">
                  {cookie.title}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {cookie.desc}
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            You can manage your cookie preferences through your browser
            settings.
          </p>
        </div>
      ),
    },
    {
      id: 'children',
      title: "Children's Privacy",
      content: (
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <p>
            Boostly is not intended for children under the age of 18. We do not
            knowingly collect personal information from children. If you believe
            we have collected information from a child, please contact us
            immediately.
          </p>
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/30">
            <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>
                Users must be at least 18 years old to use the platform.
              </span>
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'changes',
      title: 'Changes to This Policy',
      content: (
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <p>
            We may update this Privacy Policy from time to time. We will notify
            you of any changes by posting the new policy on this page and
            updating the &quot;Last Updated&quot; date.
          </p>
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/30">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-gold" />
              </div>
              <div>
                <p className="text-sm font-medium text-navy dark:text-white">
                  Stay Informed
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  We recommend reviewing this policy periodically to stay
                  informed about how we protect your privacy.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
            <FileText className="w-3 h-3" />
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
              <Shield className="w-5 h-5 text-gold" />
            </div>
            <span className="text-xs font-medium text-gold uppercase tracking-wider">
              Legal
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-navy dark:text-white mb-3">
            Privacy Policy
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-2xl">
            How Boostly collects, uses, and protects your personal information.
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
                href="/terms"
                className="hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Terms of Service
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

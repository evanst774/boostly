// src/app/cookies/page.tsx

'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Cookie,
  Shield,
  Globe,
  Settings,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export default function CookiesPage() {
  const sections = [
    {
      id: 'what-are-cookies',
      title: 'What Are Cookies?',
      content: (
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <p>
            Cookies are small text files stored on your device when you visit
            our website. They help us remember your preferences, keep you signed
            in, and understand how you use the Boostly platform.
          </p>
          <p>
            Cookies are essential for providing a seamless experience and
            enabling core functionality of the platform.
          </p>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gold/10 border border-gold/20 text-xs">
            <Cookie className="w-4 h-4 text-gold flex-shrink-0" />
            <span className="text-gray-600 dark:text-gray-400">
              Cookies help us deliver a better experience by remembering your
              preferences and settings.
            </span>
          </div>
        </div>
      ),
    },
    {
      id: 'how-we-use',
      title: 'How We Use Cookies',
      content: (
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <p>We use cookies for the following purposes:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                label: 'Essential',
                desc: 'Authentication, session management, and security features.',
                icon: Shield,
              },
              {
                label: 'Preferences',
                desc: 'Remember your language, theme, and dashboard layout.',
                icon: Settings,
              },
              {
                label: 'Analytics',
                desc: 'Understand platform usage to improve performance.',
                icon: Globe,
              },
              {
                label: 'Functional',
                desc: 'Notifications, recent activity, and personalized content.',
                icon: Cookie,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-2 mb-1">
                  <item.icon className="w-4 h-4 text-gold" />
                  <h4 className="text-xs font-semibold text-navy dark:text-white">
                    {item.label}
                  </h4>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'types',
      title: 'Types of Cookies We Use',
      content: (
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <p>We use the following types of cookies on our platform:</p>
          <div className="space-y-3">
            {[
              {
                name: 'Session Cookies',
                duration: 'Session',
                purpose:
                  'Maintain your login session. Deleted when you close your browser.',
              },
              {
                name: 'Persistent Cookies',
                duration: '30 days',
                purpose:
                  'Remember login preferences and "Remember Me" selection.',
              },
              {
                name: 'Auth Tokens',
                duration: '24 hours',
                purpose: 'Securely identify you to our servers.',
              },
              {
                name: 'CSRF Tokens',
                duration: 'Session',
                purpose: 'Protect against cross-site request forgery attacks.',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-semibold text-navy dark:text-white">
                    {item.name}
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/20 text-gold border border-gold/20">
                    {item.duration}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  {item.purpose}
                </p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'third-party',
      title: 'Third-Party Cookies',
      content: (
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <p>Some features use third-party services that may set cookies:</p>
          <div className="space-y-2">
            {[
              {
                name: 'Google Fonts',
                desc: 'For typography and font rendering',
              },
              {
                name: 'Cloudflare CDN',
                desc: 'For faster asset loading and delivery',
              },
              {
                name: 'Analytics Services',
                desc: 'For understanding platform usage patterns',
              },
            ].map((item) => (
              <div
                key={item.name}
                className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
              >
                <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-medium text-navy dark:text-white">
                    {item.name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                    - {item.desc}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/30">
            <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>
                Third-party cookies are subject to the privacy policies of their
                respective providers.
              </span>
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'managing',
      title: 'Managing Cookies',
      content: (
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <p>You can control cookies through your browser settings:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              'Chrome: Settings → Privacy and Security → Cookies',
              'Firefox: Options → Privacy & Security → Cookies',
              'Safari: Preferences → Privacy → Cookies',
              'Edge: Settings → Cookies and Site Permissions',
            ].map((item, i) => (
              <div
                key={i}
                className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700"
              >
                {item}
              </div>
            ))}
          </div>
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/30">
            <p className="text-xs text-red-700 dark:text-red-400 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                Disabling essential cookies will prevent you from logging into
                the platform and accessing core features.
              </span>
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'updates',
      title: 'Updates to This Policy',
      content: (
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <p>
            We may update this Cookie Policy periodically to reflect changes in
            our practices or for operational, legal, or regulatory reasons.
          </p>
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/30">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                <Cookie className="w-4 h-4 text-gold" />
              </div>
              <div>
                <p className="text-sm font-medium text-navy dark:text-white">
                  Stay Informed
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  We recommend reviewing this policy periodically to stay
                  informed about how we use cookies.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
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
              <Cookie className="w-5 h-5 text-gold" />
            </div>
            <span className="text-xs font-medium text-gold uppercase tracking-wider">
              Legal
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-navy dark:text-white mb-3">
            Cookie Policy
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-2xl">
            How Boostly uses cookies and similar technologies to improve your
            experience.
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

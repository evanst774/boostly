// src/app/cookies/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Cookie,
  Shield,
  Globe,
  Settings,
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';

export default function CookiesPage() {
  const [openSections, setOpenSections] = useState<number[]>([0]);

  const toggleSection = (idx: number) => {
    setOpenSections((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx],
    );
  };

  const sections = [
    {
      icon: <Cookie className="w-4 h-4" />,
      title: '1. What Are Cookies?',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/20',
      content: (
        <p className="text-gray-400 leading-relaxed text-sm">
          Cookies are small text files stored on your device when you visit our
          website. They help us remember your preferences, keep you signed in,
          and understand how you use our platform.
        </p>
      ),
    },
    {
      icon: <Settings className="w-4 h-4" />,
      title: '2. How We Use Cookies',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10 border-blue-500/20',
      content: (
        <div className="space-y-3">
          {[
            {
              label: 'Essential',
              desc: 'Authentication, session management, and security features.',
            },
            {
              label: 'Preferences',
              desc: 'Remember your language, theme, and dashboard layout.',
            },
            {
              label: 'Analytics',
              desc: 'Understand platform usage to improve performance.',
            },
            {
              label: 'Functional',
              desc: 'Notifications, recent activity, and personalized dashboards.',
            },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-white text-xs font-semibold">
                  {item.label}:{' '}
                </span>
                <span className="text-gray-400 text-xs">{item.desc}</span>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: <Shield className="w-4 h-4" />,
      title: '3. Types of Cookies We Use',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10 border-green-500/20',
      content: (
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
              className="bg-white/[0.03] rounded-lg border border-white/5 p-3"
            >
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-semibold text-white">
                  {item.name}
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {item.duration}
                </span>
              </div>
              <p className="text-[11px] text-gray-500">{item.purpose}</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: <Globe className="w-4 h-4" />,
      title: '4. Third-Party Cookies',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/20',
      content: (
        <div className="space-y-2 text-sm text-gray-400">
          <p>Some features use third-party services that may set cookies:</p>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong className="text-white">Google Fonts</strong> - for
              typography
            </span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong className="text-white">Cloudflare CDN</strong> - for
              faster asset loading
            </span>
          </div>
        </div>
      ),
    },
    {
      icon: <Settings className="w-4 h-4" />,
      title: '5. Managing Cookies',
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10 border-indigo-500/20',
      content: (
        <div>
          <p className="text-gray-400 text-sm mb-3">
            Control cookies via browser settings:
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            {[
              'Chrome: Settings → Privacy',
              'Firefox: Options → Privacy',
              'Safari: Preferences → Privacy',
              'Edge: Settings → Cookies',
            ].map((item, i) => (
              <div
                key={i}
                className="text-xs text-gray-500 bg-white/[0.03] rounded px-3 py-2"
              >
                {item}
              </div>
            ))}
          </div>
          <div className="mt-4 bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-400">
              Disabling essential cookies will prevent you from logging into the
              platform.
            </p>
          </div>
        </div>
      ),
    },
    {
      icon: <Shield className="w-4 h-4" />,
      title: '6. Updates & Contact',
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10 border-cyan-500/20',
      content: (
        <div className="space-y-3 text-sm text-gray-400">
          <p>
            We may update this policy periodically. Changes will be posted on
            this page.
          </p>
          <div className="bg-white/[0.03] rounded-lg border border-white/10 p-3">
            <p className="text-white text-xs font-semibold mb-1">Contact</p>
            <p className="text-xs">Email: support@themototrack.com</p>
            <p className="text-xs">Address: KK 120 Street, Kigali, Rwanda</p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#050B1A] relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(245,158,11,0.3) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-amber-500/5 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
          className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-orange-500/5 blur-3xl"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors touch-manipulation min-h-[44px] px-3 py-2 rounded-lg hover:bg-white/5 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
            <Cookie className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 font-space-grotesk">
            Cookie <span className="text-amber-400">Policy</span>
          </h1>
          <p className="text-gray-400 max-w-lg mx-auto text-sm">
            How MotoTrack ERP uses cookies and similar technologies.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          {sections.map((section, idx) => (
            <div
              key={idx}
              className={`rounded-xl border ${section.bgColor} overflow-hidden transition-all`}
            >
              <button
                onClick={() => toggleSection(idx)}
                className="w-full flex items-center justify-between gap-3 p-4 text-left touch-manipulation min-h-[48px]"
              >
                <div className="flex items-center gap-3">
                  <span className={section.color}>{section.icon}</span>
                  <h3 className="text-sm font-semibold text-white font-space-grotesk">
                    {section.title}
                  </h3>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-500 transition-transform duration-200 flex-shrink-0 ${openSections.includes(idx) ? 'rotate-180' : ''}`}
                />
              </button>
              {openSections.includes(idx) && (
                <div className="px-4 pb-4">{section.content}</div>
              )}
            </div>
          ))}
        </motion.div>

        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
            <Link
              href="/terms"
              className="hover:text-gray-400 transition-colors"
            >
              Terms of Service
            </Link>
            <span>•</span>
            <Link
              href="/privacy"
              className="hover:text-gray-400 transition-colors"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

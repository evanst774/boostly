// src/app/privacy/page.tsx (single page, no client-page split)
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Shield,
  Lock,
  Eye,
  FileText,
  Server,
  Users,
  Mail,
  Phone,
  MapPin,
  Globe,
  Bell,
  CheckCircle2,
  ArrowLeft,
  ChevronDown,
} from 'lucide-react';

export default function PrivacyPage() {
  const [openSections, setOpenSections] = useState<number[]>([0]);

  const toggleSection = (idx: number) => {
    setOpenSections((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx],
    );
  };

  const sections = [
    {
      icon: <FileText className="w-4 h-4" />,
      title: '1. Introduction',
      color: 'text-primary-400',
      bgColor: 'bg-primary-500/10 border-primary-500/20',
      content: (
        <>
          <p className="text-gray-400 leading-relaxed mb-4">
            MotoTrack ERP (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or
            &ldquo;us&rdquo;) is a business management platform that provides
            inventory management, sales tracking, customer management, and
            financial reporting tools. This Privacy Policy explains how we
            collect, use, store, and protect your information.
          </p>
          <p className="text-gray-400 leading-relaxed mb-4">
            By using our platform, you agree to the terms outlined in this
            policy.
          </p>
          <div className="bg-primary-500/5 border border-primary-500/20 rounded-xl p-4 flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-400">
              We are committed to protecting your privacy with industry-standard
              security measures.
            </p>
          </div>
        </>
      ),
    },
    {
      icon: <Eye className="w-4 h-4" />,
      title: '2. Information We Collect',
      color: 'text-accent-400',
      bgColor: 'bg-accent-500/10 border-accent-500/20',
      content: (
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { title: 'Account Info', items: ['Name, email, phone, company'] },
            {
              title: 'Business Data',
              items: ['Inventory, sales, customers, finances'],
            },
            {
              title: 'Usage Data',
              items: ['Logs, IP, browser, pages visited'],
            },
            { title: 'Device Info', items: ['Device type, OS, identifiers'] },
          ].map((c, i) => (
            <div
              key={i}
              className="bg-white/[0.03] rounded-lg border border-white/10 p-3"
            >
              <h4 className="text-xs font-semibold text-white mb-2">
                {c.title}
              </h4>
              <p className="text-xs text-gray-500">{c.items.join(', ')}</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: <Users className="w-4 h-4" />,
      title: '3. How We Use Your Data',
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10 border-indigo-500/20',
      content: (
        <div className="grid sm:grid-cols-2 gap-2">
          {[
            'Provide & maintain ERP services',
            'Process transactions',
            'Send notifications',
            'Improve performance',
            'Detect fraud',
            'Legal compliance',
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-xs text-gray-300"
            >
              <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0" />
              {item}
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: <Shield className="w-4 h-4" />,
      title: '4. Data Security',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10 border-green-500/20',
      content: (
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            {
              icon: <Lock className="w-4 h-4" />,
              title: 'TLS/SSL Encryption',
              desc: 'All data encrypted in transit',
            },
            {
              icon: <Server className="w-4 h-4" />,
              title: 'Secure Servers',
              desc: 'Restricted access',
            },
            {
              icon: <Shield className="w-4 h-4" />,
              title: '2FA Available',
              desc: 'Extra account protection',
            },
            {
              icon: <Users className="w-4 h-4" />,
              title: 'Role-Based Access',
              desc: 'Granular permissions',
            },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-white/[0.03] rounded-lg p-3"
            >
              <span className="text-green-400">{item.icon}</span>
              <div>
                <p className="text-xs font-semibold text-white">{item.title}</p>
                <p className="text-[10px] text-gray-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: <Globe className="w-4 h-4" />,
      title: '5. Data Sharing',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/20',
      content: (
        <>
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 mb-4">
            <p className="text-amber-400 text-xs font-semibold">
              We DO NOT sell your data.
            </p>
          </div>
          <ul className="space-y-2">
            {[
              'With your consent',
              'With service providers',
              'Legal obligations',
              'Business transfer',
            ].map((item, i) => (
              <li
                key={i}
                className="flex items-center gap-2 text-xs text-gray-300"
              >
                <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0" />{' '}
                {item}
              </li>
            ))}
          </ul>
        </>
      ),
    },
    {
      icon: <Lock className="w-4 h-4" />,
      title: '6. Your Rights',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/20',
      content: (
        <div className="grid sm:grid-cols-2 gap-2">
          {[
            'Access',
            'Correction',
            'Deletion',
            'Portability',
            'Objection',
            'Restriction',
          ].map((right, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-xs text-gray-300"
            >
              <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0" />
              {right}
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: <Mail className="w-4 h-4" />,
      title: '7. Contact Us',
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/10 border-pink-500/20',
      content: (
        <div className="grid sm:grid-cols-3 gap-4 text-center">
          {[
            {
              icon: <Mail className="w-4 h-4" />,
              label: 'Email',
              value: 'support@themototrack.com',
            },
            {
              icon: <Phone className="w-4 h-4" />,
              label: 'Phone',
              value: '+250 782 368 529',
            },
            {
              icon: <MapPin className="w-4 h-4" />,
              label: 'Address',
              value: 'KK 120 Street, Kigali',
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white/[0.03] rounded-lg border border-white/10 p-4"
            >
              <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mx-auto mb-2">
                <span className="text-pink-400">{item.icon}</span>
              </div>
              <p className="text-[10px] text-gray-500">{item.label}</p>
              <p className="text-xs text-white font-medium mt-0.5">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#050B1A] relative overflow-hidden">
      {/* Background Patterns */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(51,102,255,0.3) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary-500/5 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
          className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-accent-500/5 blur-3xl"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors touch-manipulation min-h-[44px] px-3 py-2 rounded-lg hover:bg-white/5 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-primary-500/10 border border-primary-500/20 text-primary-400 mb-4">
            <Bell className="w-3.5 h-3.5" />
            Last updated: January 2026
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 font-space-grotesk">
            Privacy <span className="text-primary-400">Policy</span>
          </h1>
          <p className="text-gray-400 max-w-lg mx-auto text-sm">
            How MotoTrack ERP collects, uses, and protects your business data.
          </p>
        </motion.div>

        {/* Accordion Sections */}
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
                  className={`w-4 h-4 text-gray-500 transition-transform duration-200 flex-shrink-0 ${
                    openSections.includes(idx) ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openSections.includes(idx) && (
                <div className="px-4 pb-4">{section.content}</div>
              )}
            </div>
          ))}
        </motion.div>

        {/* Footer Links */}
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
              href="/cookies"
              className="hover:text-gray-400 transition-colors"
            >
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// src/app/terms/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FileText,
  Shield,
  Users,
  AlertTriangle,
  Scale,
  ArrowLeft,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';

export default function TermsPage() {
  const [openSections, setOpenSections] = useState<number[]>([0]);

  const toggleSection = (idx: number) => {
    setOpenSections((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx],
    );
  };

  const sections = [
    {
      icon: <FileText className="w-4 h-4" />,
      title: '1. Acceptance of Terms',
      color: 'text-primary-400',
      bgColor: 'bg-primary-500/10 border-primary-500/20',
      content: (
        <p className="text-gray-400 leading-relaxed text-sm">
          By accessing and using MotoTrack ERP (&quot;the Service&quot;), you
          agree to be bound by these Terms of Service. If you do not agree,
          please do not use the Service.
        </p>
      ),
    },
    {
      icon: <Scale className="w-4 h-4" />,
      title: '2. Description of Service',
      color: 'text-accent-400',
      bgColor: 'bg-accent-500/10 border-accent-500/20',
      content: (
        <p className="text-gray-400 leading-relaxed text-sm">
          MotoTrack ERP is a business management platform that provides
          inventory management, sales tracking, customer management, financial
          reporting, and contract management tools for businesses.
        </p>
      ),
    },
    {
      icon: <Users className="w-4 h-4" />,
      title: '3. User Accounts',
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10 border-indigo-500/20',
      content: (
        <div className="space-y-2">
          {[
            'Provide accurate registration information.',
            'Maintain confidentiality of your credentials.',
            'Responsible for all activities under your account.',
            'Notify us of unauthorized use immediately.',
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-gray-400 text-xs">{item}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: <AlertTriangle className="w-4 h-4" />,
      title: '4. Acceptable Use',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/20',
      content: (
        <div>
          <p className="text-gray-400 text-sm mb-2">You agree not to:</p>
          <div className="space-y-1.5">
            {[
              'Use the Service for illegal purposes.',
              'Interfere with or disrupt the Service.',
              'Attempt unauthorized access.',
              'Upload viruses or malicious code.',
              'Harass, abuse, or harm others.',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-red-400 text-xs mt-0.5">✕</span>
                <span className="text-gray-400 text-xs">{item}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      icon: <Shield className="w-4 h-4" />,
      title: '5. Intellectual Property',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10 border-green-500/20',
      content: (
        <p className="text-gray-400 leading-relaxed text-sm">
          All content, features, and functionality of the Service are owned by
          MotoTrack and protected by international copyright, trademark, and
          intellectual property laws.
        </p>
      ),
    },
    {
      icon: <Shield className="w-4 h-4" />,
      title: '6. Data, Liability & Termination',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/20',
      content: (
        <div className="space-y-4 text-sm text-gray-400">
          <div>
            <h4 className="text-white text-xs font-semibold mb-1">
              Data & Privacy
            </h4>
            <p className="text-xs">
              Your use is governed by our Privacy Policy. We implement security
              measures to protect your data.
            </p>
          </div>
          <div>
            <h4 className="text-white text-xs font-semibold mb-1">
              Limitation of Liability
            </h4>
            <p className="text-xs">
              MotoTrack is not liable for indirect, incidental, or consequential
              damages from your use of the Service.
            </p>
          </div>
          <div>
            <h4 className="text-white text-xs font-semibold mb-1">
              Termination
            </h4>
            <p className="text-xs">
              We may suspend or terminate your account for violation of these
              terms.
            </p>
          </div>
        </div>
      ),
    },
    {
      icon: <FileText className="w-4 h-4" />,
      title: '7. Changes & Contact',
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10 border-cyan-500/20',
      content: (
        <div className="space-y-3 text-sm text-gray-400">
          <p>
            We may modify these terms at any time. Continued use constitutes
            acceptance.
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
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
            <FileText className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 font-space-grotesk">
            Terms of <span className="text-primary-400">Service</span>
          </h1>
          <p className="text-gray-400 max-w-lg mx-auto text-sm">
            Rules and guidelines for using MotoTrack ERP.
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
              href="/privacy"
              className="hover:text-gray-400 transition-colors"
            >
              Privacy Policy
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

// src/app/resources/changelog/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, GitCommit, Sparkles } from 'lucide-react';

const changelog = [
  {
    version: 'v1.0.0',
    date: 'January 2026',
    changes: [
      'Initial release of MotoTrack ERP',
      'Inventory management with bike tracking',
      'Sales management with installment plans',
      'Customer management with debt tracking',
      'Financial reporting and analytics',
      'Two-Factor Authentication (Email + TOTP)',
      'Role-based access control (RBAC)',
      'Contract upload and management',
      'Export reports to Excel and PDF',
    ],
  },
  {
    version: 'v0.9.0',
    date: 'December 2025',
    changes: [
      'Beta testing phase',
      'Bug fixes and performance improvements',
      'UI/UX refinements',
    ],
  },
  {
    version: 'v0.5.0',
    date: 'November 2025',
    changes: ['Alpha release', 'Core modules implemented', 'Internal testing'],
  },
];

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-[#050B1A]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 touch-manipulation min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Changelog</h1>
          <p className="text-gray-400 text-sm">
            Track updates and new features in MotoTrack ERP.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Spine */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-primary-500/50 via-white/10 to-transparent" />

          <div className="space-y-8">
            {changelog.map((release, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="relative pl-10"
              >
                {/* Dot */}
                <div
                  className={`absolute left-2.5 top-1 w-3 h-3 rounded-full border-2 ${idx === 0 ? 'bg-primary-500 border-primary-400' : 'bg-gray-700 border-gray-600'}`}
                />

                <div className="bg-white/5 rounded-xl border border-white/10 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <GitCommit className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-sm font-bold text-white">
                      {release.version}
                    </span>
                    <span className="text-[10px] text-gray-500 ml-auto">
                      {release.date}
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {release.changes.map((change, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-xs text-gray-400"
                      >
                        <span className="text-primary-400 mt-0.5">•</span>
                        {change}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// src/app/resources/guides/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Bike,
  ShoppingCart,
  Users,
  Wallet,
  FileText,
  BarChart3,
  Settings,
  Shield,
  TrendingUp,
} from 'lucide-react';

const guides = [
  {
    icon: <Bike className="w-5 h-5" />,
    title: 'Managing Inventory',
    desc: 'Add bikes, track stock, manage categories and suppliers.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
  },
  {
    icon: <ShoppingCart className="w-5 h-5" />,
    title: 'Creating Sales',
    desc: 'Record new sales, generate invoices, track payments.',
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: 'Customer Management',
    desc: 'Add customers, view history, track debts and contracts.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
  },
  {
    icon: <Wallet className="w-5 h-5" />,
    title: 'Finance & Payments',
    desc: 'Record payments, manage installments, track debts.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
  },
  {
    icon: <FileText className="w-5 h-5" />,
    title: 'Contract Management',
    desc: 'Upload, download, and manage sales contracts.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: 'Reports & Analytics',
    desc: 'Generate sales, finance, and inventory reports.',
    color: 'text-pink-400',
    bg: 'bg-pink-500/10 border-pink-500/20',
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: 'Security & 2FA',
    desc: 'Enable two-factor authentication and manage sudo mode.',
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/20',
  },
  {
    icon: <Settings className="w-5 h-5" />,
    title: 'System Settings',
    desc: 'Configure company profile, localization, and branding.',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10 border-indigo-500/20',
  },
];

export default function GuidesPage() {
  return (
    <div className="min-h-screen bg-[#050B1A]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
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
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            User <span className="text-green-400">Guides</span>
          </h1>
          <p className="text-gray-400 text-sm">
            Step-by-step tutorials to help you get the most out of MotoTrack
            ERP.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {guides.map((guide, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`rounded-xl border p-5 ${guide.bg} hover:scale-[1.02] transition-transform cursor-pointer`}
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${guide.color} bg-white/5`}
              >
                {guide.icon}
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">
                {guide.title}
              </h3>
              <p className="text-xs text-gray-500">{guide.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

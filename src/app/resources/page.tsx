// src/app/resources/page.tsx

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  FileText,
  HelpCircle,
  MessageCircle,
  Sparkles,
} from 'lucide-react';

const resources = [
  {
    icon: BookOpen,
    title: 'Documentation',
    desc: 'Learn how to use Boostly and maximize your earnings.',
    href: '/resources/documentation',
    color: 'text-primary',
    bg: 'bg-primary/5 border-primary/20',
  },
  {
    icon: FileText,
    title: 'User Guides',
    desc: 'Step-by-step tutorials to help you get started.',
    href: '/resources/guides',
    color: 'text-gold',
    bg: 'bg-gold/5 border-gold/20',
  },
  {
    icon: HelpCircle,
    title: 'FAQ',
    desc: 'Frequently asked questions about Boostly.',
    href: '/resources/faq',
    color: 'text-purple-400',
    bg: 'bg-purple/5 border-purple/20',
  },
  {
    icon: MessageCircle,
    title: 'Support',
    desc: 'Get help from our support team.',
    href: '/support',
    color: 'text-cyan-400',
    bg: 'bg-cyan/5 border-cyan/20',
  },
];

export default function ResourcesPage() {
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
              Resources
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-navy dark:text-white mb-4">
            Help & <span className="text-gold">Resources</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-2xl leading-relaxed">
            Everything you need to know about Boostly. Find guides, tutorials,
            and support to help you earn more.
          </p>
        </motion.div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {resources.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link
                  href={item.href}
                  className={`block p-4 rounded-xl border ${item.bg} hover:shadow-md transition-all hover:scale-[1.01]`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center mb-3 ${item.color}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-navy dark:text-white mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    {item.desc}
                  </p>
                </Link>
              </motion.div>
            );
          })}
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

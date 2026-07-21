'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  BookOpen,
  MessageCircle,
  Mail,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { Footer } from '@/components/landing/Footer';

const helpCategories = [
  {
    icon: <BookOpen className="w-5 h-5" />,
    title: 'Documentation',
    desc: 'Browse our detailed docs',
    href: '/resources/documentation',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
  },
  {
    icon: <FileText className="w-5 h-5" />,
    title: 'User Guides',
    desc: 'Step-by-step tutorials',
    href: '/resources/guides',
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
  },
  {
    icon: <MessageCircle className="w-5 h-5" />,
    title: 'FAQ',
    desc: 'Common questions answered',
    href: '/resources/faq',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
  },
  {
    icon: <Mail className="w-5 h-5" />,
    title: 'Contact Support',
    desc: 'Email our team directly',
    href: '/contact',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
  },
];

export default function HelpPage() {
  const [search, setSearch] = useState('');

  return (
    <div className="min-h-screen bg-background-primary safe-bottom">
      <section className="relative sm:pt-24 pb-8 sm:pb-10 overflow-hidden safe-top">
        <div className="absolute inset-0 bg-hero-dark" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-4 sm:mb-6 touch-manipulation min-h-[44px] px-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 font-space-grotesk">
              Help <span className="text-gradient-blue">Center</span>
            </h1>
            <p className="text-gray-400 max-w-xl mx-auto text-xs sm:text-sm mb-6">
              Find answers, tutorials, and support resources.
            </p>
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for help..."
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-primary-500/50 touch-manipulation min-h-[48px]"
              />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-4 sm:py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
            {helpCategories.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Link
                  href={item.href}
                  className={`block rounded-xl border ${item.bg} p-5 hover:scale-[1.02] transition-all group touch-manipulation min-h-[44px]`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center ${item.color} flex-shrink-0`}
                    >
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-white group-hover:text-primary-400 transition-colors flex items-center gap-1">
                        {item.title}
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// src/app/about/page.tsx

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Shield,
  Zap,
  Target,
  Eye,
  Heart,
  Globe,
  TrendingUp,
  Users,
  Sparkles,
} from 'lucide-react';

const highlights = [
  {
    icon: <Shield className="w-5 h-5" />,
    title: 'Secure & Trusted',
    desc: 'Bank-grade security with 2FA, encryption, and regular audits to protect your earnings.',
    color: 'text-primary',
    bg: 'bg-primary/5 border-primary/20',
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: 'Instant Payouts',
    desc: 'Fast withdrawals to your wallet. No hidden fees, no delays, no complications.',
    color: 'text-gold',
    bg: 'bg-gold/5 border-gold/20',
  },
  {
    icon: <Globe className="w-5 h-5" />,
    title: 'Global Community',
    desc: 'Join thousands of earners from around the world. Real people, real rewards.',
    color: 'text-purple-400',
    bg: 'bg-purple/5 border-purple/20',
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: 'Built for Everyone',
    desc: 'Designed for anyone to earn. No experience needed. Simple, fun, and rewarding.',
    color: 'text-pink-400',
    bg: 'bg-pink/5 border-pink/20',
  },
];

const values = [
  {
    icon: Shield,
    title: 'Trust & Security',
    desc: 'Your data and earnings are protected with enterprise-grade security measures.',
  },
  {
    icon: Zap,
    title: 'Simplicity',
    desc: 'Clean, intuitive interface. Start earning in minutes, no training required.',
  },
  {
    icon: Target,
    title: 'Real Rewards',
    desc: 'Earn real cash, not just points. Every activity puts money in your pocket.',
  },
  {
    icon: Eye,
    title: 'Transparency',
    desc: 'Clear earnings, instant notifications, and honest communication always.',
  },
  {
    icon: Heart,
    title: 'Community First',
    desc: 'We build features based on real feedback from our growing community.',
  },
  {
    icon: TrendingUp,
    title: 'Continuous Growth',
    desc: 'Regular updates with new earning opportunities and platform improvements.',
  },
];

export default function AboutPage() {
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
              About Us
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-navy dark:text-white mb-4">
            About <span className="text-gold">Boostly</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-2xl leading-relaxed">
            Boostly is a modern rewards platform that empowers people to earn
            real money through engaging activities. We believe everyone deserves
            to be rewarded for their time and effort.
          </p>
        </motion.div>

        {/* Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          {highlights.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`p-4 rounded-xl border ${item.bg} hover:shadow-md transition-shadow`}
            >
              <div
                className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center mb-3 ${item.color}`}
              >
                {item.icon}
              </div>
              <h3 className="text-sm font-semibold text-navy dark:text-white mb-1">
                {item.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Mission Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12 p-6 rounded-xl bg-gold/5 border border-gold/20"
        >
          <div className="flex items-center gap-3 mb-3">
            <Target className="w-5 h-5 text-gold" />
            <h2 className="text-lg font-bold text-navy dark:text-white">
              Our Mission
            </h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            To create the most trusted and rewarding platform where anyone,
            anywhere can earn real income by doing simple, fun, and valuable
            activities online.
          </p>
        </motion.div>

        {/* Values Section */}
        <div className="mb-12">
          <h2 className="text-lg font-bold text-navy dark:text-white mb-4">
            Our <span className="text-gold">Values</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {values.map((v, idx) => {
              const Icon = v.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-gold/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-gold" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-navy dark:text-white mb-0.5">
                        {v.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        {v.desc}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-6 rounded-xl bg-gold/5 border border-gold/20 text-center"
        >
          <h3 className="text-lg font-bold text-navy dark:text-white mb-2">
            Ready to start earning?
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-md mx-auto">
            Join thousands of users who are earning real rewards every day on
            Boostly.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold hover:bg-gold-hover text-navy font-semibold text-sm transition-all shadow-gold/20 hover:shadow-gold/30"
          >
            Get Started
            <ArrowLeft className="w-4 h-4 rotate-180" />
          </Link>
        </motion.div>

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

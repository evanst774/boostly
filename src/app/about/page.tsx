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
  Lock,
  Server,
  Globe,
  TrendingUp,
} from 'lucide-react';
import { Footer } from '@/components/landing/Footer';

const highlights = [
  {
    icon: <Server className="w-5 h-5" />,
    title: 'Built for Africa',
    desc: 'Optimized for African business needs — multi-currency support, local payment methods, and offline-capable.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
  },
  {
    icon: <Lock className="w-5 h-5" />,
    title: 'Enterprise Security',
    desc: 'TLS/SSL encryption, Two-Factor Authentication, role-based access control, and regular security audits.',
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: 'Lightning Fast',
    desc: 'Built with modern technology stack for instant page loads and real-time data updates.',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/20',
  },
  {
    icon: <Globe className="w-5 h-5" />,
    title: 'Rwandan Made',
    desc: 'Proudly developed in Kigali, Rwanda. Supporting local talent and the East African tech ecosystem.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
  },
];

const values = [
  {
    icon: <Shield className="w-5 h-5" />,
    title: 'Trust & Security',
    desc: 'Enterprise-grade encryption. Your business data is protected with the highest standards.',
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: 'Simplicity',
    desc: 'Clean, intuitive interface. No training required — just log in and start managing your business.',
  },
  {
    icon: <Target className="w-5 h-5" />,
    title: 'Accuracy',
    desc: 'Precise tracking and real-time reporting for every transaction, sale, and inventory movement.',
  },
  {
    icon: <Eye className="w-5 h-5" />,
    title: 'Transparency',
    desc: 'Clear pricing with no hidden fees. Open documentation and honest communication always.',
  },
  {
    icon: <Heart className="w-5 h-5" />,
    title: 'Customer First',
    desc: 'We build features based on real feedback from businesses like yours.',
  },
  {
    icon: <TrendingUp className="w-5 h-5" />,
    title: 'Continuous Improvement',
    desc: 'Regular updates with new features, performance improvements, and security patches.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background-primary safe-bottom">
      {/* Hero */}
      <section className="relative sm:pt-24 pb-8 sm:pb-12 overflow-hidden safe-top">
        <div className="absolute inset-0 bg-hero-dark" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-r from-blue-600/15 to-cyan-600/15 blur-3xl rounded-full" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
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
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-semibold bg-primary-500/10 border border-primary-500/20 text-primary-400 mb-4">
              <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Our Story
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4 font-space-grotesk">
              About <span className="text-gradient-blue">MotoTrack</span>
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto text-xs sm:text-sm md:text-base leading-relaxed">
              We build powerful, accessible ERP software for African businesses.
              Our platform helps you manage inventory, track sales, handle
              finances, and grow your business - all from one place.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Highlights Grid */}
      <section className="py-4 sm:py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {highlights.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                className={`rounded-xl border ${item.bg} p-4 sm:p-5 text-center hover:scale-[1.02] transition-all`}
              >
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3 ${item.color}`}
                >
                  {item.icon}
                </div>
                <h3 className="text-sm font-bold text-white mb-1.5">
                  {item.title}
                </h3>
                <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-6 sm:py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-primary-500/10 to-accent-500/5 rounded-2xl border border-primary-500/20 p-6 sm:p-10 text-center"
          >
            <Target className="w-8 h-8 sm:w-10 sm:h-10 text-primary-400 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4 font-space-grotesk">
              Our Mission
            </h2>
            <p className="text-sm sm:text-base text-gray-400 leading-relaxed max-w-2xl mx-auto">
              To provide powerful, affordable, and easy-to-use business
              management software that helps African SMEs digitize their
              operations, make data-driven decisions, and compete in the global
              economy.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="py-6 sm:py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-6 sm:mb-8 font-space-grotesk">
            Our <span className="text-primary-400">Values</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {values.map((v, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white/5 rounded-xl border border-white/10 p-4 sm:p-5 hover:border-primary-500/30 transition-all text-center sm:text-left"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mx-auto sm:mx-0 mb-3 text-primary-400">
                  {v.icon}
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  {v.title}
                </h3>
                <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed">
                  {v.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-6 sm:py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white/5 rounded-2xl border border-white/10 p-6 sm:p-8 text-center"
          >
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
              Ready to get started?
            </h3>
            <p className="text-sm text-gray-400 mb-5 max-w-md mx-auto">
              Join businesses across Africa using MotoTrack to manage their
              operations.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-primary-500/25 transition-all touch-manipulation min-h-[48px]"
            >
              Contact Us
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

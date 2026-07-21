'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Clock,
  Shield,
  Zap,
  Mail,
  MessageSquare,
} from 'lucide-react';
import { Footer } from '@/components/landing/Footer';

export default function SupportPage() {
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
              Customer <span className="text-gradient-blue">Support</span>
            </h1>
            <p className="text-gray-400 max-w-xl mx-auto text-xs sm:text-sm">
              We&apos;re here to help you succeed with MotoTrack ERP.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-4 sm:py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            {[
              {
                icon: <Clock className="w-5 h-5" />,
                title: 'Response Time',
                desc: 'Within 24 hours',
                color: 'text-blue-400',
              },
              {
                icon: <Shield className="w-5 h-5" />,
                title: 'Priority Support',
                desc: 'For Business & Enterprise plans',
                color: 'text-purple-400',
              },
              {
                icon: <Zap className="w-5 h-5" />,
                title: 'Quick Help',
                desc: 'Visit our Help Center',
                color: 'text-green-400',
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white/5 rounded-xl border border-white/10 p-5 text-center"
              >
                <div
                  className={`w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3 ${item.color}`}
                >
                  {item.icon}
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  {item.title}
                </h3>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Link
              href="/contact"
              className="bg-white/5 rounded-xl border border-white/10 p-5 hover:border-primary-500/30 transition-all group touch-manipulation"
            >
              <Mail className="w-8 h-8 text-primary-400 mb-3" />
              <h3 className="text-base font-semibold text-white mb-1 group-hover:text-primary-400 transition-colors">
                Email Support
              </h3>
              <p className="text-sm text-gray-400">
                Send us a message and we&apos;ll get back to you.
              </p>
            </Link>
            <Link
              href="/help"
              className="bg-white/5 rounded-xl border border-white/10 p-5 hover:border-primary-500/30 transition-all group touch-manipulation"
            >
              <MessageSquare className="w-8 h-8 text-green-400 mb-3" />
              <h3 className="text-base font-semibold text-white mb-1 group-hover:text-primary-400 transition-colors">
                Help Center
              </h3>
              <p className="text-sm text-gray-400">
                Browse documentation, guides, and FAQs.
              </p>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

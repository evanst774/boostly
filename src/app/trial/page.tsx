'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  Zap,
  Shield,
  Users,
  Globe,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { Footer } from '@/components/landing/Footer';

const benefits = [
  'Full access to all features for 14 days',
  'No credit card required',
  'Cancel anytime, no questions asked',
  'Email support during trial period',
  'Import your existing data',
  'Go live when you&apos;re ready',
];

export default function TrialPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setSubmitted(true);
  };

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-screen bg-background-primary safe-bottom">
      <section className="relative sm:pt-24 pb-8 sm:pb-10 overflow-hidden safe-top">
        <div className="absolute inset-0 bg-hero-dark" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-r from-primary-500/10 to-accent-500/10 blur-3xl rounded-full" />
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
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-semibold bg-green-500/10 border border-green-500/20 text-green-400 mb-4">
              <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> No Credit Card
              Required
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 font-space-grotesk">
              Start Your <span className="text-gradient-blue">Free Trial</span>
            </h1>
            <p className="text-gray-400 max-w-xl mx-auto text-xs sm:text-sm">
              14 days of full access. No commitments, no credit card.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-4 sm:py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-5 gap-6 sm:gap-8">
            {/* Benefits */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-bold text-white font-space-grotesk">
                What&apos;s Included
              </h2>
              <div className="space-y-2">
                {benefits.map((benefit, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-2.5 text-sm text-gray-300"
                  >
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                    {benefit}
                  </motion.div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 mt-6">
                {[
                  {
                    icon: <Zap className="w-4 h-4" />,
                    label: 'Full Features',
                    color: 'text-yellow-400',
                  },
                  {
                    icon: <Shield className="w-4 h-4" />,
                    label: 'Secure',
                    color: 'text-blue-400',
                  },
                  {
                    icon: <Users className="w-4 h-4" />,
                    label: 'Multi-User',
                    color: 'text-purple-400',
                  },
                  {
                    icon: <Globe className="w-4 h-4" />,
                    label: '24/7 Access',
                    color: 'text-green-400',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white/5 rounded-lg border border-white/10 p-3 text-center"
                  >
                    <div className={`${item.color} mb-1 flex justify-center`}>
                      {item.icon}
                    </div>
                    <p className="text-[10px] sm:text-xs text-gray-400">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-3 bg-white/5 rounded-2xl border border-white/10 p-5 sm:p-8"
            >
              {submitted ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    You&apos;re All Set!
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Check your email for next steps.
                  </p>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold text-sm hover:shadow-lg transition-all touch-manipulation min-h-[48px]"
                  >
                    Go to Dashboard <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="trial-name"
                        className="block text-[11px] sm:text-xs font-semibold text-gray-400 mb-1.5"
                      >
                        Full Name *
                      </label>
                      <input
                        id="trial-name"
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => update('name', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-primary-500/50 placeholder:text-gray-600 touch-manipulation min-h-[44px]"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="trial-email"
                        className="block text-[11px] sm:text-xs font-semibold text-gray-400 mb-1.5"
                      >
                        Email *
                      </label>
                      <input
                        id="trial-email"
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => update('email', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-primary-500/50 placeholder:text-gray-600 touch-manipulation min-h-[44px]"
                        placeholder="you@company.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="trial-company"
                      className="block text-[11px] sm:text-xs font-semibold text-gray-400 mb-1.5"
                    >
                      Company Name
                    </label>
                    <input
                      id="trial-company"
                      type="text"
                      value={form.company}
                      onChange={(e) => update('company', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-primary-500/50 placeholder:text-gray-600 touch-manipulation min-h-[44px]"
                      placeholder="Your company"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="trial-phone"
                      className="block text-[11px] sm:text-xs font-semibold text-gray-400 mb-1.5"
                    >
                      Phone (Optional)
                    </label>
                    <input
                      id="trial-phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => update('phone', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-primary-500/50 placeholder:text-gray-600 touch-manipulation min-h-[44px]"
                      placeholder="+250 7XX XXX XXX"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-primary-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2 touch-manipulation min-h-[48px] active:scale-[0.98]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />{' '}
                        Processing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" /> Start Free Trial
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// src/components/landing/WhyChoose.tsx
'use client';

import { motion, Variants } from 'framer-motion';
import { Coins, Users, Wallet, Shield, Globe2, TrendingUp } from 'lucide-react';

const REASONS = [
  {
    icon: Coins,
    title: 'Real Rewards',
    desc: 'Earn real cash, not just points. Every activity puts money in your pocket.',
    color: 'bg-gold/10',
    iconColor: 'text-gold',
    borderColor: 'border-gold/20',
    delay: 0,
  },
  {
    icon: Users,
    title: 'Multiple Ways',
    desc: 'Videos, games, surveys, offers, and more. Never run out of ways to earn.',
    color: 'bg-primary/10',
    iconColor: 'text-primary',
    borderColor: 'border-primary/20',
    delay: 0.05,
  },
  {
    icon: Wallet,
    title: 'Instant Payouts',
    desc: 'Withdraw your earnings quickly and securely. No hidden fees or delays.',
    color: 'bg-success/10',
    iconColor: 'text-success',
    borderColor: 'border-success/20',
    delay: 0.1,
  },
  {
    icon: Shield,
    title: 'Secure & Trusted',
    desc: 'Bank-level security with 2FA and encryption to protect your account.',
    color: 'bg-purple/10',
    iconColor: 'text-purple-500',
    borderColor: 'border-purple/20',
    delay: 0.15,
  },
  {
    icon: Globe2,
    title: 'Global Community',
    desc: 'Join a growing community of smart earners from around the world.',
    color: 'bg-pink/10',
    iconColor: 'text-pink-500',
    borderColor: 'border-pink/20',
    delay: 0.2,
  },
];

// Animation variants
const sectionVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.08,
      duration: 0.4,
      ease: 'easeOut',
    },
  }),
  hover: {
    y: -8,
    scale: 1.02,
    boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
    transition: { duration: 0.2, ease: 'easeOut' },
  },
};

const iconVariants: Variants = {
  hidden: { scale: 0.5, rotate: -10 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
  hover: {
    scale: 1.1,
    rotate: 5,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
};

export function WhyChoose() {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={sectionVariants}
      className="py-20 bg-white"
      id="features"
    >
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-14">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="text-gold text-xs font-bold tracking-widest uppercase mb-2"
          >
            Why Choose Us
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="text-3xl md:text-4xl font-black text-navy mb-3"
          >
            Why Choose <span className="text-gold">Boostly</span>?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="text-text-secondary text-sm max-w-lg mx-auto"
          >
            Thousands of users trust Boostly for reliable earnings, fast
            payouts, and a secure platform.
          </motion.p>
        </div>

        {/* Reasons Grid */}
        <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-4 md:gap-5">
          {REASONS.map(
            ({ icon: Icon, title, desc, color, iconColor, borderColor }, i) => (
              <motion.div
                key={title}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                whileHover="hover"
                viewport={{ once: true, amount: 0.1 }}
                className={`group relative bg-white border-2 ${borderColor} rounded-2xl p-6 text-center transition-all duration-300 hover:shadow-xl hover:border-gold/40 overflow-hidden`}
              >
                {/* Background gradient on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-b from-transparent via-gold/5 to-transparent" />

                {/* Icon with glow */}
                <motion.div
                  variants={iconVariants}
                  initial="hidden"
                  whileInView="visible"
                  whileHover="hover"
                  viewport={{ once: true }}
                  className={`relative w-14 h-14 rounded-2xl ${color} flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-gold/20`}
                >
                  <Icon
                    className={`w-6 h-6 ${iconColor} transition-all duration-300 group-hover:scale-110`}
                  />
                </motion.div>

                {/* Title */}
                <p className="font-bold text-navy text-sm mb-1.5 group-hover:text-gold transition-colors">
                  {title}
                </p>

                {/* Description */}
                <p className="text-sm text-text-secondary leading-relaxed">
                  {desc}
                </p>

                {/* Decorative dot */}
                <div
                  className={`absolute -bottom-1 -right-1 w-16 h-16 rounded-full ${color} opacity-0 group-hover:opacity-30 transition-opacity duration-300 blur-xl`}
                />
              </motion.div>
            ),
          )}
        </div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto"
        >
          <div className="text-center">
            <p className="text-2xl font-black text-navy">500K+</p>
            <p className="text-xs text-text-muted">Active Users</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-gold">$25M+</p>
            <p className="text-xs text-text-muted">Rewards Paid</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-navy">4.8★</p>
            <p className="text-xs text-text-muted">User Rating</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-gold">98%</p>
            <p className="text-xs text-text-muted">Satisfaction</p>
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="text-center mt-10"
        >
          <motion.a
            href="/register"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 bg-gold hover:bg-gold-hover text-navy font-bold px-6 py-3 rounded-full transition-all duration-200 shadow-gold hover:shadow-gold/50"
          >
            Start Earning Today
            <TrendingUp className="w-4 h-4" />
          </motion.a>
        </motion.div>
      </div>
    </motion.section>
  );
}

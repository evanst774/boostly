// src/components/landing/HowItWorks.tsx
'use client';

import { motion, Variants } from 'framer-motion';
import { ArrowRight, UserPlus, Play, Coins, Gift } from 'lucide-react';

const STEPS = [
  {
    step: '1',
    title: 'Sign Up',
    desc: 'Create your free account in seconds and start your earning journey.',
    icon: UserPlus,
    color: 'bg-primary',
    iconBg: 'bg-primary/20',
    borderColor: 'border-primary/30',
  },
  {
    step: '2',
    title: 'Complete Activities',
    desc: 'Watch videos, play games, complete surveys, and more.',
    icon: Play,
    color: 'bg-success',
    iconBg: 'bg-success/20',
    borderColor: 'border-success/30',
  },
  {
    step: '3',
    title: 'Earn Points',
    desc: 'Earn points for every activity you complete. The more you do, the more you earn.',
    icon: Coins,
    color: 'bg-gold',
    iconBg: 'bg-gold/20',
    borderColor: 'border-gold/30',
  },
  {
    step: '4',
    title: 'Get Paid',
    desc: 'Convert your points to cash and withdraw to your wallet or crypto.',
    icon: Gift,
    color: 'bg-pink',
    iconBg: 'bg-pink/20',
    borderColor: 'border-pink/30',
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

const stepVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.15,
      duration: 0.5,
      ease: 'easeOut',
    },
  }),
};

const iconVariants: Variants = {
  hidden: { scale: 0.5, rotate: -20 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
  hover: {
    scale: 1.1,
    rotate: -5,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
};

const arrowVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { delay: 0.3, duration: 0.4, ease: 'easeOut' },
  },
  pulse: {
    x: [0, 5, 0],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

const connectorVariants: Variants = {
  hidden: { scaleX: 0 },
  visible: (i: number) => ({
    scaleX: 1,
    transition: { delay: 0.2 + i * 0.15, duration: 0.5, ease: 'easeOut' },
  }),
};

export function HowItWorks() {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={sectionVariants}
      className="py-20 bg-bg overflow-hidden"
      id="how"
    >
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-14">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="text-gold text-xs font-bold tracking-widest uppercase mb-2"
          >
            Simple. Fun. Rewarding.
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="text-3xl md:text-4xl font-black text-navy mb-3"
          >
            How <span className="text-gold">Boostly</span> Works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="text-text-secondary text-sm max-w-md mx-auto"
          >
            Four simple steps to start earning real rewards. It&apos;s that
            easy.
          </motion.p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-4 gap-8 relative">
          {/* Connector lines (desktop) */}
          <div className="hidden md:block absolute top-16 left-[12.5%] right-[12.5%] h-0.5">
            <motion.div
              custom={0}
              variants={connectorVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="h-full bg-gradient-to-r from-gold/30 via-gold/50 to-gold/30"
            />
          </div>

          {STEPS.map(
            ({ step, title, desc, icon: Icon, color }, i) => (
              <motion.div
                key={step}
                custom={i}
                variants={stepVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                className="relative group"
              >
                {/* Step number badge */}
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + i * 0.15, duration: 0.3 }}
                  className="absolute -top-2 -right-2 z-10 w-7 h-7 rounded-full bg-navy border-2 border-gold flex items-center justify-center text-[10px] font-bold text-gold shadow-lg shadow-gold/20"
                >
                  {step}
                </motion.div>

                {/* Icon */}
                <motion.div
                  variants={iconVariants}
                  initial="hidden"
                  whileInView="visible"
                  whileHover="hover"
                  viewport={{ once: true }}
                  className={`w-16 h-16 rounded-2xl ${color} flex items-center justify-center mx-auto mb-4 shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:scale-105`}
                >
                  <Icon className="w-7 h-7 text-white" />
                </motion.div>

                {/* Content */}
                <div className="text-center">
                  <p className="font-bold text-navy text-base mb-1 group-hover:text-gold transition-colors">
                    {step}. {title}
                  </p>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {desc}
                  </p>
                </div>

                {/* Connector dot (mobile) */}
                {i < STEPS.length - 1 && (
                  <motion.div
                    variants={connectorVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="md:hidden w-8 h-0.5 mx-auto my-3 bg-gradient-to-r from-gold/30 via-gold/50 to-gold/30"
                  />
                )}

                {/* Arrow (desktop) */}
                {i < STEPS.length - 1 && (
                  <motion.div
                    variants={arrowVariants}
                    initial="hidden"
                    whileInView="visible"
                    animate="pulse"
                    viewport={{ once: true }}
                    className="hidden md:block absolute top-1/2 -right-5 -translate-y-1/2 text-gold/40"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.div>
                )}
              </motion.div>
            ),
          )}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="text-center mt-12"
        >
          <motion.a
            href="/register"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 bg-gold hover:bg-gold-hover text-navy font-bold px-6 py-3 rounded-full transition-all duration-200 shadow-gold hover:shadow-gold/50"
          >
            Start Earning Now
            <ArrowRight className="w-4 h-4" />
          </motion.a>
          <p className="text-text-muted text-xs mt-3">
            No credit card required • Free to join
          </p>
        </motion.div>
      </div>
    </motion.section>
  );
}

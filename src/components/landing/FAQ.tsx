// src/components/landing/FAQ.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { MIN_WITHDRAWAL, PAYOUT_TIME_LABEL } from '@/lib/constants/payouts';

const FAQS = [
  {
    q: 'Is Boostly free to join?',
    a: 'Yes. Creating an account is free, and you can start completing tasks and earning right away.',
  },
  {
    q: 'How do I earn money?',
    a: 'Complete your daily tasks: watch sponsored videos, play games and answer surveys. Each finished task adds money to your Boostly balance.',
  },
  {
    q: 'How do I withdraw?',
    a: 'Open your wallet, enter the amount and the MTN MoMo or Airtel Money number you want to be paid on, then submit your request.',
  },
  {
    q: 'When do I receive my money?',
    a: `All withdrawals are processed every day at ${PAYOUT_TIME_LABEL} (Kigali time). Requests made before ${PAYOUT_TIME_LABEL} are paid the same day; later requests are paid the next day.`,
  },
  {
    q: 'Is there a minimum withdrawal?',
    a: `Yes, the minimum withdrawal is ${MIN_WITHDRAWAL.toLocaleString()} RWF. There are no withdrawal fees.`,
  },
  {
    q: 'How many tasks can I do each day?',
    a: 'Every account gets a set of tasks each day. New tasks become available daily, so come back every day to keep earning.',
  },
  {
    q: 'Is my personal data safe?',
    a: 'Yes. Your data is encrypted and we never sell your personal information to third parties.',
  },
  {
    q: 'Can I use Boostly on my phone?',
    a: 'Yes. Boostly works in any browser on your phone or computer.',
  },
];

// Animation variants
const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.04, duration: 0.4, ease: 'easeOut' },
  }),
};

const answerVariants: Variants = {
  hidden: {
    opacity: 0,
    height: 0,
    marginTop: 0,
  },
  visible: {
    opacity: 1,
    height: 'auto',
    marginTop: 8,
    transition: {
      duration: 0.3,
      ease: 'easeInOut',
    },
  },
  exit: {
    opacity: 0,
    height: 0,
    marginTop: 0,
    transition: {
      duration: 0.25,
      ease: 'easeInOut',
    },
  },
};

const iconVariants: Variants = {
  rotate: {
    rotate: 180,
    transition: { duration: 0.3, ease: 'easeInOut' },
  },
  reset: {
    rotate: 0,
    transition: { duration: 0.3, ease: 'easeInOut' },
  },
};

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={sectionVariants}
      id="faq"
      className="py-20 bg-navy scroll-mt-20"
    >
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-4"
          >
            <HelpCircle className="w-3.5 h-3.5 text-primary-light" />
            <span className="text-[10px] font-bold text-primary-light tracking-wider uppercase">
              Got Questions?
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="text-3xl md:text-4xl font-black text-white mb-3"
          >
            Frequently Asked <span className="text-gold">Questions</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="text-white/40 text-sm max-w-md mx-auto"
          >
            Everything you need to know about earning and getting paid.
            Can&apos;t find what you&apos;re looking for?
            <a
              href="/support"
              className="text-gold hover:text-gold-hover ml-1 transition-colors"
            >
              Contact us →
            </a>
          </motion.p>

        </div>

        {/* FAQ Grid */}
        <div className="grid sm:grid-cols-2 items-start gap-3 md:gap-4">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;


            return (
              <motion.div
                key={faq.q}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
                variants={itemVariants}
                className={`bg-white/5 backdrop-blur-sm border rounded-xl overflow-hidden transition-all duration-300 ${
                  isOpen
                    ? 'border-gold/50 shadow-glow'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between px-4 md:px-5 py-3.5 md:py-4 text-left group"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-semibold transition-colors duration-200 ${
                        isOpen ? 'text-gold' : 'text-white'
                      }`}
                    >
                      {faq.q}
                    </span>
                  </div>
                  <motion.div
                    animate={isOpen ? 'rotate' : 'reset'}
                    variants={iconVariants}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${
                      isOpen
                        ? 'bg-gold/20 text-gold'
                        : 'bg-white/5 text-white/40 group-hover:bg-white/10 group-hover:text-white/60'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.div>
                </button>

                <AnimatePresence mode="wait">
                  {isOpen && (
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={answerVariants}
                      className="overflow-hidden"
                    >
                      <p className="px-4 md:px-5 pb-4 md:pb-5 text-sm text-white/60 leading-relaxed">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mt-10 text-center"
        >
          <p className="text-white/30 text-sm">
            Still have questions?{' '}
            <a
              href="/support"
              className="text-gold hover:text-gold-hover font-medium transition-colors"
            >
              Get in touch with our team
            </a>
          </p>
        </motion.div>
      </div>
    </motion.section>
  );
}

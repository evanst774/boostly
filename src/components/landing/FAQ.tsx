// src/components/landing/FAQ.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ChevronDown, HelpCircle, Bitcoin } from 'lucide-react';

const FAQS = [
  // Original FAQs
  {
    q: 'Is Boostly free to use?',
    a: 'Yes! You can join Boostly for free and start earning immediately. Premium plans are optional and offer higher earning limits and exclusive benefits.',
  },
  {
    q: 'How do I get paid?',
    a: 'Earnings convert to cash automatically. Withdraw anytime via Mobile Money, bank transfer, or cryptocurrency — most payouts are instant.',
  },
  {
    q: 'What activities can I do to earn?',
    a: 'Watch videos, play games, complete surveys, view sponsored ads, and refer friends. New ways to earn are added regularly.',
  },
  {
    q: 'How much can I earn?',
    a: 'Earnings depend on your plan and activity level. Free users can earn up to $1/day; Platinum members can earn up to $20/day.',
  },
  {
    q: 'Is my personal data safe?',
    a: 'Yes. Boostly uses bank-level encryption and never sells your personal data to third parties.',
  },
  {
    q: 'Can I use Boostly on mobile?',
    a: 'Absolutely — Boostly works on any device via your browser, with dedicated iOS and Android apps coming soon.',
  },

  // ============================================
  // NEW CRYPTO FAQs
  // ============================================
  {
    q: 'Which cryptocurrencies does Boostly support?',
    a: "Boostly supports major cryptocurrencies including Bitcoin (BTC), Ethereum (ETH), USDT, USDC, Solana (SOL), XRP, Cardano (ADA), Polkadot (DOT), Avalanche (AVAX), and Polygon (MATIC). We're constantly adding new currencies based on user demand.",
  },
  {
    q: 'How do I deposit crypto to my Boostly wallet?',
    a: "Go to Wallet → Crypto → Deposit, select your preferred cryptocurrency, and you'll receive a unique wallet address. Simply send your crypto to that address. Deposits are typically confirmed within 1-3 blockchain confirmations.",
  },
  {
    q: 'What are the fees for crypto deposits and withdrawals?',
    a: 'Crypto deposits are usually free (network fees may apply). Withdrawals have a small fee that varies by currency — typically 0.0005 BTC, 0.005 ETH, or equivalent. All fees are clearly displayed before you confirm any transaction.',
  },
  {
    q: 'How long do crypto withdrawals take?',
    a: 'Crypto withdrawals are processed within 24 hours of approval. Once processed, the transaction is broadcast to the blockchain and typically completes within 10-30 minutes depending on network congestion.',
  },
  {
    q: 'Can I convert my crypto to USD/RWF?',
    a: 'Yes! Your crypto balance is automatically converted to USD value using real-time exchange rates. You can withdraw your crypto directly or convert to fiat currency for withdrawal via bank transfer or mobile money.',
  },
  {
    q: 'Is crypto on Boostly secure?',
    a: 'Absolutely. We use industry-leading security practices including cold storage for the majority of funds, multi-signature wallets, and 2FA for all withdrawal requests. Your crypto assets are protected with bank-level security.',
  },
  {
    q: 'What is the minimum crypto deposit/withdrawal?',
    a: 'Minimum deposit and withdrawal amounts vary by currency. For Bitcoin, the minimum is 0.0001 BTC; for Ethereum, 0.01 ETH; and for USDT, 10 USDT. Check the Wallet → Crypto section for exact limits for each currency.',
  },
  {
    q: 'Do I need a separate crypto wallet to use Boostly?',
    a: 'No! Boostly provides you with a hosted wallet for each supported cryptocurrency. However, we recommend using your own external wallet for long-term storage of large amounts. You can withdraw to any external wallet address.',
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
      className="py-20 bg-navy"
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
            Everything you need to know about Boostly, including our new
            cryptocurrency features. Can&apos;t find what you&apos;re looking
            for?
            <a
              href="/contact"
              className="text-gold hover:text-gold-hover ml-1 transition-colors"
            >
              Contact us →
            </a>
          </motion.p>

          {/* Crypto Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.35, duration: 0.4 }}
            className="inline-flex items-center gap-2 mt-4 bg-gold/10 border border-gold/20 rounded-full px-4 py-1.5"
          >
            <Bitcoin className="w-3.5 h-3.5 text-gold" />
            <span className="text-[10px] font-bold text-gold tracking-wider uppercase">
              Crypto Ready
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-gold/50" />
            <span className="text-[10px] text-white/40">
              BTC · ETH · USDT · SOL · XRP · ADA · DOT · AVAX · MATIC
            </span>
          </motion.div>
        </div>

        {/* FAQ Grid */}
        <div className="grid sm:grid-cols-2 gap-3 md:gap-4">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            // Check if this is a crypto FAQ (contains crypto-related keywords)
            const isCrypto =
              faq.q.toLowerCase().includes('crypto') ||
              faq.q.toLowerCase().includes('bitcoin') ||
              faq.q.toLowerCase().includes('ethereum') ||
              faq.q.toLowerCase().includes('usdt') ||
              faq.q.toLowerCase().includes('wallet');

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
                    : isCrypto
                      ? 'border-primary/30 hover:border-primary/50'
                      : 'border-white/10 hover:border-white/20'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between px-4 md:px-5 py-3.5 md:py-4 text-left group"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-2">
                    {isCrypto && (
                      <Bitcoin className="w-3.5 h-3.5 text-gold/60 flex-shrink-0" />
                    )}
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
              href="/contact"
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

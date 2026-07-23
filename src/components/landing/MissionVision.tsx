// src/components/landing/MissionVision.tsx

'use client';

import { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { useSystemCurrency } from '@/hooks/useSystemCurrency';

// Animation variants
const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: 'easeOut', delay: 0.2 },
  },
};

export function MissionVision() {
  const {
    currency,
    formatAmount,
    isLoading: currencyLoading,
  } = useSystemCurrency();
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [isConverting, setIsConverting] = useState(true);

  // Sample USD amount for the "Payment Received" notification
  const USD_AMOUNT = 25.0;

  useEffect(() => {
    const convertAmount = async () => {
      if (currencyLoading || !currency) {
        return;
      }

      try {
        setIsConverting(true);

        // Call the API route to convert currency
        const response = await fetch(
          `/api/public/convert-currency?amount=${USD_AMOUNT}&from=USD&to=${currency.code}`,
        );

        if (!response.ok) {
          throw new Error('Failed to convert currency');
        }

        const data = await response.json();
        setConvertedAmount(data.amount);
      } catch (error) {
        console.error('Failed to convert currency:', error);
        // Fallback: use the USD amount with system symbol
        setConvertedAmount(USD_AMOUNT);
      } finally {
        setIsConverting(false);
      }
    };

    convertAmount();
  }, [currency, currencyLoading]);

  // Determine if we should show loading state
  const showLoading = currencyLoading || isConverting;

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={sectionVariants}
      className="bg-navy py-16"
    >
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-10 items-center">
        {/* Left Content */}
        <div>
          <h2 className="text-3xl font-black text-white mb-8">
            Our Mission &amp; Vision
          </h2>
          <div className="space-y-6">
            <motion.div variants={cardVariants} className="flex gap-4">
              <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-2xl">
                🎯
              </div>
              <div>
                <p className="font-bold text-white mb-1">Our Mission</p>
                <p className="text-white/60 text-sm">
                  To create the most trusted and rewarding platform where
                  anyone, anywhere can earn real income by doing simple, fun and
                  valuable activities online.
                </p>
              </div>
            </motion.div>
            <motion.div variants={cardVariants} className="flex gap-4">
              <div className="w-11 h-11 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0 text-2xl">
                🌍
              </div>
              <div>
                <p className="font-bold text-white mb-1">Our Vision</p>
                <p className="text-white/60 text-sm">
                  To build a world where digital opportunities empower people
                  financially and create a fairer future for communities
                  globally.
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right Content - Community Photo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.3 }}
          className="relative rounded-2xl overflow-hidden h-72 bg-navy-lighter flex items-center justify-center"
        >
          {/* Placeholder for community image */}
          <span className="text-white/20 text-sm">Community photo</span>

          {/* Decorative elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-gold/5" />

          {/* Payment notification */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: 'easeOut', delay: 0.5 }}
            className="absolute bottom-4 right-4 bg-white rounded-xl shadow-lg p-3 text-xs w-52 sm:w-56"
          >
            <p className="font-semibold flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center text-[10px] text-success">
                ✓
              </span>{' '}
              Payment Received
            </p>
            <p className="text-text-muted mt-0.5">
              You received{' '}
              {showLoading ? (
                <span className="inline-block w-20 h-3 bg-gray-200 rounded animate-pulse" />
              ) : (
                <span className="font-medium text-navy">
                  {formatAmount(convertedAmount || USD_AMOUNT)}
                </span>
              )}{' '}
              from Boostly · 2m ago
            </p>
            {!showLoading && currency && (
              <p className="text-[10px] text-text-muted/60 mt-0.5">
                ~ ${USD_AMOUNT.toFixed(2)} USD
              </p>
            )}
          </motion.div>

          {/* Additional decorative elements */}
          <div className="absolute top-4 left-4 flex gap-1">
            <div className="w-2 h-2 rounded-full bg-white/20" />
            <div className="w-2 h-2 rounded-full bg-white/10" />
            <div className="w-2 h-2 rounded-full bg-white/5" />
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}

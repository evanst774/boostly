// src/components/CookieConsent.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Shield, X, ChevronDown } from 'lucide-react';

interface CookieConsentProps {
  onAccept?: () => void;
  onDecline?: () => void;
  onCustomize?: () => void;
}

export default function CookieConsent({
  onAccept,
  onDecline,
  onCustomize,
}: CookieConsentProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem('boostly-cookie-consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    setPreferences({
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    });
    localStorage.setItem('boostly-cookie-consent', 'all');
    localStorage.setItem(
      'boostly-cookie-preferences',
      JSON.stringify({
        necessary: true,
        functional: true,
        analytics: true,
        marketing: true,
      }),
    );
    setIsVisible(false);
    onAccept?.();
  };

  const handleAcceptSelected = () => {
    localStorage.setItem('boostly-cookie-consent', 'selected');
    localStorage.setItem(
      'boostly-cookie-preferences',
      JSON.stringify(preferences),
    );
    setIsVisible(false);
    onAccept?.();
  };

  const handleDecline = () => {
    setPreferences({
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    });
    localStorage.setItem('boostly-cookie-consent', 'necessary');
    localStorage.setItem(
      'boostly-cookie-preferences',
      JSON.stringify({
        necessary: true,
        functional: false,
        analytics: false,
        marketing: false,
      }),
    );
    setIsVisible(false);
    onDecline?.();
  };

  const handleCustomize = () => {
    setShowDetails(true);
    onCustomize?.();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-[9999] p-3 md:p-4"
        >
          <div className="max-w-7xl mx-auto">
            <motion.div
              className="relative overflow-hidden rounded-xl border shadow-2xl bg-navy-light/95 backdrop-blur-xl border-white/10"
              whileHover={{ scale: 1.002 }}
              transition={{ type: 'spring', damping: 30 }}
            >
              {/* Gradient orbs - Boostly theme */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl bg-primary/5" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl bg-gold/5" />
              </div>

              <div className="relative p-4 md:p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent-500 flex items-center justify-center shadow-blue">
                      <Shield className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">
                        Cookie Preferences
                      </h3>
                      <p className="text-xs text-white/40">
                        We value your privacy
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleDecline}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors text-white/40 hover:text-white/60 hover:bg-white/5"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>

                {/* Main content */}
                <div className="mb-5">
                  <p className="text-xs leading-relaxed mb-3 text-white/60">
                    We use cookies to enhance your experience, analyze site
                    traffic, and serve personalized content. By clicking
                    &quot;Accept All&quot;, you consent to our use of cookies.
                    Read our{' '}
                    <Link
                      href="/privacy"
                      className="font-semibold text-gold hover:text-gold-hover transition-colors"
                    >
                      Privacy Policy
                    </Link>{' '}
                    and{' '}
                    <Link
                      href="/terms"
                      className="font-semibold text-gold hover:text-gold-hover transition-colors"
                    >
                      Terms of Service
                    </Link>
                    .
                  </p>

                  {/* Expandable details */}
                  <motion.div
                    initial={false}
                    animate={{ height: showDetails ? 'auto' : 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3 pb-1 space-y-2">
                      {/* Necessary cookies (always enabled) */}
                      <div className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/5">
                        <div className="flex-1 pr-3">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-xs font-bold text-white">
                              Necessary
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary-light">
                              Always Active
                            </span>
                          </div>
                          <p className="text-[10px] text-white/40">
                            Essential for website function. Cannot be disabled.
                          </p>
                        </div>
                        <div className="w-10 h-5 rounded-full relative opacity-50 cursor-not-allowed bg-primary">
                          <div className="absolute right-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow" />
                        </div>
                      </div>

                      {/* Cookie toggles */}
                      <CookieToggle
                        label="Functional"
                        description="Enables enhanced features and personalization"
                        checked={preferences.functional}
                        onChange={(checked) =>
                          setPreferences((prev) => ({
                            ...prev,
                            functional: checked,
                          }))
                        }
                      />

                      <CookieToggle
                        label="Analytics"
                        description="Anonymous usage data to improve our site"
                        checked={preferences.analytics}
                        onChange={(checked) =>
                          setPreferences((prev) => ({
                            ...prev,
                            analytics: checked,
                          }))
                        }
                      />

                      <CookieToggle
                        label="Marketing"
                        description="Personalized content and campaign tracking"
                        checked={preferences.marketing}
                        onChange={(checked) =>
                          setPreferences((prev) => ({
                            ...prev,
                            marketing: checked,
                          }))
                        }
                      />
                    </div>
                  </motion.div>

                  {/* Toggle details button */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setShowDetails(!showDetails)}
                    className="flex items-center gap-1 mt-3 text-xs font-semibold text-gold hover:text-gold-hover transition-colors"
                  >
                    <span>
                      {showDetails ? 'Hide details' : 'Customize settings'}
                    </span>
                    <motion.div
                      animate={{ rotate: showDetails ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronDown className="w-3 h-3" />
                    </motion.div>
                  </motion.button>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <motion.button
                    whileHover={{ scale: 1.01, y: -1 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleAcceptAll}
                    className="flex-1 px-5 py-2.5 rounded-lg text-navy text-xs font-bold transition-all relative overflow-hidden group bg-gold hover:bg-gold-hover shadow-gold"
                  >
                    <span className="relative z-10">Accept All</span>
                  </motion.button>

                  {showDetails ? (
                    <motion.button
                      whileHover={{ scale: 1.01, y: -1 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={handleAcceptSelected}
                      className="flex-1 px-5 py-2.5 rounded-lg text-xs font-bold border border-white/20 text-white hover:bg-white/5 transition-all"
                    >
                      Accept Selected
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.01, y: -1 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={handleDecline}
                      className="flex-1 px-5 py-2.5 rounded-lg text-xs font-bold border border-white/20 text-white hover:bg-white/5 transition-all"
                    >
                      Essential Only
                    </motion.button>
                  )}

                  {!showDetails && (
                    <motion.button
                      whileHover={{ scale: 1.01, y: -1 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={handleCustomize}
                      className="px-5 py-2.5 rounded-lg text-xs font-bold border border-white/20 text-white hover:bg-white/5 transition-all"
                    >
                      Customize
                    </motion.button>
                  )}
                </div>

                {/* Footer note */}
                <p className="mt-4 text-[10px] text-center text-white/20">
                  You can change your preferences anytime through your browser
                  settings.
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Helper component for cookie toggles
function CookieToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/5">
      <div className="flex-1 pr-3">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-xs font-bold text-white">{label}</span>
        </div>
        <p className="text-[10px] text-white/40">{description}</p>
      </div>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => onChange(!checked)}
        className="w-10 h-5 rounded-full relative transition-colors"
        style={{
          background: checked ? '#FBBF24' : 'rgba(255,255,255,0.2)',
        }}
      >
        <motion.div
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow"
          animate={{
            left: checked ? 'calc(100% - 1.25rem)' : '0.25rem',
          }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30,
          }}
        />
      </motion.button>
    </div>
  );
}

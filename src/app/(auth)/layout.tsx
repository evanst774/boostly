// src/app/(auth)/layout.tsx
'use client';

import { Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center safe-top safe-bottom">
      {/* Language picker, top corner of every auth screen */}
      <div
        className="fixed right-3 z-[60] rounded-xl bg-[#0F172A]/80 text-white/90 backdrop-blur"
        style={{ top: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
      >
        <LanguageSwitcher variant="compact" />
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="w-full"
        >
          {/* Pages read the URL (?ref, ?email, ?token): needed for prerender. */}
          <Suspense fallback={null}>{children}</Suspense>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

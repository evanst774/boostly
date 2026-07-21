// src/components/PageLoader.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface PageLoaderProps {
  isLoading: boolean;
}

export function PageLoader({ isLoading }: PageLoaderProps) {
  return (
    <AnimatePresence mode="wait">
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A]"
        >
          {/* Main Logo Container */}
          <div className="relative z-10 flex flex-col items-center gap-6">
            {/* Logo — small, static, no scale/glow cycle */}
            <div className="w-10 h-10 md:w-12 md:h-12">
              <Image
                src="/img/logo/icon.png"
                alt="Boostly"
                width={48}
                height={48}
                className="w-full h-full object-contain"
                priority
              />
            </div>

            {/* Brand Name */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex flex-col items-center gap-1"
            >
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                Boostly
              </h1>
              <p className="text-xs md:text-sm text-primary/60 font-medium tracking-widest uppercase">
                Loading
              </p>
            </motion.div>

            {/* Loading Indicators - Dots (infinite) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              className="flex items-center gap-2 mt-2"
            >
              {[0, 1, 2, 3, 4].map((index) => (
                <motion.div
                  key={index}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.4, 1, 0.4],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: index * 0.15,
                    ease: 'easeInOut',
                  }}
                  className={`
                    w-2.5 h-2.5 rounded-full
                    ${index === 0 ? 'bg-primary' : ''}
                    ${index === 1 ? 'bg-primary/80' : ''}
                    ${index === 2 ? 'bg-primary/60' : ''}
                    ${index === 3 ? 'bg-primary/40' : ''}
                    ${index === 4 ? 'bg-primary/20' : ''}
                  `}
                />
              ))}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

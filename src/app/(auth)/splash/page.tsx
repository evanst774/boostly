// src/app/(auth)/splash/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/onboarding');
    }, 2800);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-navy-light to-navy flex flex-col items-center justify-center relative overflow-hidden">
      {/* Animated background elements */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
        className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-gold/10 blur-3xl"
      />
      <motion.div
        animate={{
          y: [0, -20, 0],
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-2xl"
      />

      {/* Floating particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -30, 0],
            x: [0, i % 2 === 0 ? 20 : -20, 0],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: 3 + i * 0.3,
            repeat: Infinity,
            delay: i * 0.4,
            ease: 'easeInOut',
          }}
          className="absolute w-1.5 h-1.5 rounded-full bg-gold/30"
          style={{
            top: `${10 + i * 10}%`,
            left: `${10 + (i % 5) * 15}%`,
          }}
        />
      ))}

      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="text-center z-10"
      >
        {/* Logo with pulsing glow */}
        <motion.div
          animate={{
            boxShadow: [
              '0 0 20px rgba(212, 175, 55, 0.2)',
              '0 0 40px rgba(212, 175, 55, 0.4)',
              '0 0 20px rgba(212, 175, 55, 0.2)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-28 h-28 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center mx-auto mb-8 shadow-2xl"
        >
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="w-20 h-20 rounded-xl bg-white flex items-center justify-center shadow-lg"
          >
            <Image
              src="/img/logo/icon.png"
              alt="Boostly"
              width={56}
              height={56}
              className="w-14 h-14"
              priority
            />
          </motion.div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-black text-white tracking-tight"
        >
          Boost<span className="text-gold">ly</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-white/40 text-sm mt-2 font-light tracking-wider"
        >
          Earn. Play. Grow.
        </motion.p>

        {/* Loading animation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex gap-3 justify-center mt-12"
        >
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -12, 0],
                backgroundColor: [
                  '#D4AF37',
                  i === 1 ? '#D4AF37' : '#D4AF37',
                  '#D4AF37',
                ],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
              className="w-2.5 h-2.5 rounded-full"
              style={{
                backgroundColor: i === 0 ? '#D4AF37' : '#D4AF3740',
              }}
            />
          ))}
        </motion.div>

        {/* Progress bar */}
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: '100%', opacity: 1 }}
          transition={{ duration: 2.5, ease: 'easeInOut' }}
          className="h-0.5 w-48 mx-auto mt-8 rounded-full bg-white/10 overflow-hidden"
        >
          <motion.div
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
            className="h-full w-1/2 bg-gradient-to-r from-transparent via-gold to-transparent"
          />
        </motion.div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 text-white/10 text-xs font-mono"
      >
        v2.4.1
      </motion.p>
    </div>
  );
}

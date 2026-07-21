// components/vectors/ErrorIllustrations.tsx
'use client';

import { motion } from 'framer-motion';

export function GlitchNumber({ number }: { number: number }) {
  return (
    <div className="relative inline-block">
      <motion.h1
        className="text-[18vw] md:text-[12vw] font-outfit font-bold leading-none tracking-tighter"
        style={{
          background: 'linear-gradient(135deg, #3366FF, #0A5CFF, #06B6D4)',
          backgroundSize: '200% 200%',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
        }}
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        {number}
      </motion.h1>

      {/* Simple glitch overlay */}
      <motion.div
        className="absolute inset-0 text-[18vw] md:text-[12vw] font-outfit font-bold leading-none tracking-tighter pointer-events-none overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #3366FF, #0A5CFF)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          opacity: 0.15,
        }}
        animate={{ x: [-1, 1, -1, 1, 0] }}
        transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 4 }}
      >
        {number}
      </motion.div>
    </div>
  );
}

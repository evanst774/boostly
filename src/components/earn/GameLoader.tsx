// src/components/earn/GameLoader.tsx
//
// Shown while a game session starts and the game itself loads in the frame:
// the game's category icon in a glowing tile with an orbiting ring, a
// shimmering progress line and a rotating tip.
'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getGameCategoryIcon } from './GameCategoryIcon';

const TIPS = [
  'Your reward unlocks after the minimum play time.',
  'Play time only counts while the game is on screen.',
  'Tap Claim when the bar turns green to collect your reward.',
  'Each game has its own daily plays. Try a few different ones.',
];

export function GameLoader({ name, category }: { name: string; category?: string | null }) {
  const Icon = getGameCategoryIcon(category);
  const [tip, setTip] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTip((i) => (i + 1) % TIPS.length), 2800);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex w-full max-w-xs flex-col items-center px-6 text-center" role="status" aria-live="polite">
      <div className="relative flex h-28 w-28 items-center justify-center">
        {/* soft glow */}
        <motion.div
          className="absolute inset-0 rounded-full bg-[#2563EB]/30 blur-2xl"
          animate={{ scale: [0.9, 1.15, 0.9], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* orbiting ring */}
        <motion.svg
          viewBox="0 0 112 112"
          className="absolute inset-0 h-full w-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
          aria-hidden
        >
          <defs>
            <linearGradient id="gl-ring" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="55%" stopColor="#22C55E" />
              <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
            </linearGradient>
          </defs>
          <circle cx="56" cy="56" r="52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
          <circle cx="56" cy="56" r="52" fill="none" stroke="url(#gl-ring)" strokeWidth="3" strokeLinecap="round" strokeDasharray="120 210" />
          <circle cx="108" cy="56" r="4" fill="#22C55E" />
        </motion.svg>
        {/* icon tile */}
        <motion.div
          className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] shadow-[0_12px_30px_-8px_rgba(37,99,235,0.7)]"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Icon className="h-8 w-8 text-white" strokeWidth={1.8} />
        </motion.div>
      </div>

      <p className="mt-6 text-base font-bold text-white">{name}</p>
      <p className="mt-0.5 text-xs text-white/50">Getting your game ready</p>

      {/* shimmer line */}
      <div className="relative mt-4 h-1 w-40 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r from-transparent via-[#60A5FA] to-transparent"
          animate={{ x: ['-120%', '320%'] }}
          transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.p
        key={tip}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-5 min-h-[2.5rem] text-xs leading-relaxed text-white/60"
      >
        {TIPS[tip]}
      </motion.p>
    </div>
  );
}

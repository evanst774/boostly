// components/vectors/ErrorIllustrations.tsx
'use client';

import { motion } from 'framer-motion';

export function FloatingNeonOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[15%] left-[10%] w-32 h-32 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 blur-3xl"
      />
      <motion.div
        animate={{ y: [0, 15, 0], x: [0, -15, 0] }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
        className="absolute bottom-[20%] right-[15%] w-40 h-40 rounded-full bg-gradient-to-r from-purple-500/15 to-pink-500/15 blur-3xl"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute top-[40%] right-[30%] w-24 h-24 rounded-full bg-blue-500/10 blur-2xl"
      />
    </div>
  );
}

export function GlitchNumber({ number }: { number: number }) {
  return (
    <div className="relative">
      <motion.h1
        className="text-[20vw] md:text-[15vw] font-rebond-bold leading-none tracking-tighter"
        style={{
          background:
            'linear-gradient(135deg, #3366FF, #0A5CFF, #06B6D4, #3366FF)',
          backgroundSize: '300% 300%',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
        }}
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{ duration: 5, repeat: Infinity }}
      >
        {number}
      </motion.h1>

      {/* Glitch overlay 1 */}
      <motion.div
        className="absolute inset-0 text-[20vw] md:text-[15vw] font-rebond-bold leading-none tracking-tighter pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, #3366FF, #0A5CFF)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          opacity: 0.3,
          clipPath: 'polygon(0 45%, 100% 45%, 100% 55%, 0 55%)',
        }}
        animate={{ x: [-2, 2, -1, 1, 0] }}
        transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 3 }}
      >
        {number}
      </motion.div>

      {/* Glitch overlay 2 */}
      <motion.div
        className="absolute inset-0 text-[20vw] md:text-[15vw] font-rebond-bold leading-none tracking-tighter pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, #06B6D4, #3366FF)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          opacity: 0.2,
          clipPath: 'polygon(0 30%, 100% 30%, 100% 40%, 0 40%)',
        }}
        animate={{ x: [2, -2, 1, -1, 0] }}
        transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 3.5 }}
      >
        {number}
      </motion.div>
    </div>
  );
}

export function FloatingDirectionSign() {
  return (
    <svg
      width="200"
      height="200"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <motion.g
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        {/* Neon glow */}
        <circle
          cx="100"
          cy="100"
          r="80"
          stroke="#3366FF"
          strokeWidth="0.5"
          strokeDasharray="4 4"
          opacity="0.3"
        />
        <circle
          cx="100"
          cy="100"
          r="60"
          stroke="#0A5CFF"
          strokeWidth="0.5"
          strokeDasharray="2 6"
          opacity="0.2"
        />

        {/* Direction arrows */}
        <path
          d="M100 30 L100 80 M100 30 L85 45 M100 30 L115 45"
          stroke="#3366FF"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M100 120 L100 170 M100 170 L85 155 M100 170 L115 155"
          stroke="#06B6D4"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M30 100 L80 100 M30 100 L45 85 M30 100 L45 115"
          stroke="#0A5CFF"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M120 100 L170 100 M170 100 L155 85 M170 100 L155 115"
          stroke="#3366FF"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />

        {/* Center holographic sphere */}
        <circle cx="100" cy="100" r="15" fill="url(#sphereGrad)" />
        <circle cx="100" cy="100" r="15" stroke="#3366FF" strokeWidth="1" />
        <circle cx="100" cy="100" r="8" fill="#3366FF" opacity="0.6" />
      </motion.g>

      <defs>
        <radialGradient id="sphereGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#3366FF" stopOpacity="0.1" />
        </radialGradient>
      </defs>
    </svg>
  );
}

export function NeonGrid() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(51,102,255,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(51,102,255,0.08) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(51,102,255,0.15) 0%, transparent 70%)',
        }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
    </div>
  );
}

export function FloatingOrbitRings() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <svg
        width="400"
        height="400"
        viewBox="0 0 400 400"
        className="opacity-30"
      >
        <motion.ellipse
          cx="200"
          cy="200"
          rx="180"
          ry="60"
          stroke="#3366FF"
          strokeWidth="0.8"
          fill="none"
          strokeDasharray="4 8"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
        <motion.ellipse
          cx="200"
          cy="200"
          rx="60"
          ry="180"
          stroke="#06B6D4"
          strokeWidth="0.8"
          fill="none"
          strokeDasharray="4 8"
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        />
        <motion.circle
          cx="200"
          cy="200"
          r="120"
          stroke="#0A5CFF"
          strokeWidth="0.5"
          fill="none"
          strokeDasharray="2 6"
          animate={{ rotate: 360 }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        />
      </svg>
    </div>
  );
}

// src/components/ui/LoadingScreen.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface LoadingScreenProps {
  isLoading: boolean;
  onLoadingComplete?: () => void;
  minDisplayTime?: number;
}

// Particle network effect
function useParticleCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  active: boolean,
) {
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !active) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      const parent = canvas.parentElement!;
      canvas.width = parent.offsetWidth;
      canvas.height = parent.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    type Particle = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      a: number;
    };
    const particles: Particle[] = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.6 + 0.4,
      a: Math.random() * 0.5 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(65, 105, 225, ${p.a})`;
        ctx.fill();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(65, 105, 225, ${0.08 * (1 - d / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [canvasRef, active]);
}

// Fixed: Removed unused useProgress hook (moved to inline implementation)
// The progress is now handled directly in the component

// Skeleton shimmer component for content loading
export function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl mb-4"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3"></div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1"></div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
    </div>
  );
}

export function SkeletonArticle() {
  return (
    <div className="animate-pulse max-w-4xl mx-auto px-4 sm:px-6">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
      <div className="flex gap-4 mb-6">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
      </div>
      <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl mb-6"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
      </div>
    </div>
  );
}

export function SkeletonNewsGrid() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      {[...Array(6)].map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="animate-pulse flex items-center gap-4">
      <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      <div className="flex-1">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
      </div>
    </div>
  );
}

// Main LoadingScreen component
export default function LoadingScreen({
  isLoading,
  onLoadingComplete,
  minDisplayTime = 800,
}: LoadingScreenProps) {
  const [shouldShow, setShouldShow] = useState(false);
  const [progress, setProgress] = useState(0);
  // Fixed: Removed unused 'phase' variable
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startTimeRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useParticleCanvas(canvasRef, shouldShow);

  // Handle progress animation
  useEffect(() => {
    if (!shouldShow) return;

    const duration = 1800;
    const interval = 25;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + step;
        if (next >= 100) {
          clearInterval(timer);
          return 100;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [shouldShow]);

  // Handle showing/hiding based on isLoading
  useEffect(() => {
    if (isLoading) {
      startTimeRef.current = Date.now();
      setShouldShow(true);
      setProgress(0);
    } else if (shouldShow) {
      const elapsed = startTimeRef.current
        ? Date.now() - startTimeRef.current
        : 0;
      const remainingTime = Math.max(0, minDisplayTime - elapsed);

      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = setTimeout(() => {
          setShouldShow(false);
          onLoadingComplete?.();
        }, 500);
      }, remainingTime);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isLoading, minDisplayTime, shouldShow, onLoadingComplete]);

  if (!shouldShow) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="loading-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: '#060d28',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Particle canvas */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
          }}
        />

        {/* Radial vignette glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(27,59,139,0.2) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Corner brackets */}
        {(['tl', 'tr', 'bl', 'br'] as const).map((pos) => (
          <motion.div
            key={pos}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.4, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              width: 28,
              height: 28,
              borderColor: 'rgba(65,105,225,0.5)',
              borderStyle: 'solid',
              borderWidth:
                pos === 'tl'
                  ? '2px 0 0 2px'
                  : pos === 'tr'
                    ? '2px 2px 0 0'
                    : pos === 'bl'
                      ? '0 0 2px 2px'
                      : '0 2px 2px 0',
              top: pos.startsWith('t') ? 28 : undefined,
              bottom: pos.startsWith('b') ? 28 : undefined,
              left: pos.endsWith('l') ? 28 : undefined,
              right: pos.endsWith('r') ? 28 : undefined,
            }}
          />
        ))}

        {/* Scanning line effect */}
        <motion.div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: 2,
            background:
              'linear-gradient(90deg, transparent, rgba(65,105,225,0.3), #4169E1, rgba(65,105,225,0.3), transparent)',
            pointerEvents: 'none',
          }}
          animate={{ top: ['10%', '90%'] }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
          }}
        />

        {/* Main content */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 32,
          }}
        >
          {/* Animated logo with orbits */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0, 0, 0.2, 1.2] }}
            style={{
              position: 'relative',
              width: 220,
              height: 220,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Orbit ring 1 - outer slow clockwise */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute',
                width: 220,
                height: 220,
                borderRadius: '50%',
                border: '1px solid rgba(27,59,139,0.25)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: -4,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#1B3B8B',
                  boxShadow: '0 0 12px #4169E1, 0 0 24px rgba(65,105,225,0.5)',
                }}
              />
            </motion.div>

            {/* Orbit ring 2 - middle counter-clockwise */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute',
                width: 170,
                height: 170,
                borderRadius: '50%',
                border: '1px solid rgba(65,105,225,0.35)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  bottom: -3.5,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#4169E1',
                  boxShadow: '0 0 10px #4169E1, 0 0 20px rgba(65,105,225,0.6)',
                }}
              />
            </motion.div>

            {/* Orbit ring 3 - inner fast clockwise */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute',
                width: 120,
                height: 120,
                borderRadius: '50%',
                border: '1px solid rgba(147,180,248,0.25)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: -3,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#93b4f8',
                  boxShadow: '0 0 8px #93b4f8',
                }}
              />
            </motion.div>

            {/* Orbit ring 4 - innermost pulse */}
            <motion.div
              animate={{ scale: [1, 1.05, 1], opacity: [0.6, 1, 0.6] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{
                position: 'absolute',
                width: 80,
                height: 80,
                borderRadius: '50%',
                border: '1px solid rgba(147,180,248,0.4)',
              }}
            />

            {/* Logo box - Fixed: Replaced img with Next.js Image */}
            <div
              style={{
                position: 'relative',
                width: 85,
                height: 85,
                borderRadius: 22,
                background:
                  'linear-gradient(145deg, #0d1f5c 0%, #1B3B8B 60%, #2e52c4 100%)',
                border: '1px solid rgba(65,105,225,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                zIndex: 2,
              }}
            >
              {/* Ambient pulse */}
              <motion.div
                style={{
                  position: 'absolute',
                  inset: -2,
                  borderRadius: 24,
                }}
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(27,59,139,0.5), 0 0 40px rgba(27,59,139,0.2)',
                    '0 0 40px rgba(65,105,225,0.8), 0 0 80px rgba(65,105,225,0.4)',
                    '0 0 20px rgba(27,59,139,0.5), 0 0 40px rgba(27,59,139,0.2)',
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              {/* Conic gradient sweep */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 22,
                  background:
                    'conic-gradient(from 0deg, transparent 0deg, rgba(65,105,225,0.4) 60deg, transparent 120deg)',
                }}
              />

              {/* Inner ring */}
              <div
                style={{
                  position: 'absolute',
                  inset: 8,
                  borderRadius: 16,
                  border: '1px solid rgba(147,180,248,0.25)',
                }}
              />

              {/* Logo image - Fixed: Using Next.js Image */}
              <div
                style={{
                  position: 'relative',
                  width: 48,
                  height: 48,
                  zIndex: 2,
                }}
              >
                <Image
                  src="/img/logo/icon.png"
                  alt="Mubuga TSS"
                  fill
                  sizes="48px"
                  className="object-contain"
                  priority
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement?.parentElement;
                    if (parent) {
                      const fallback = document.createElement('span');
                      fallback.textContent = 'M';
                      fallback.style.cssText =
                        'position:relative;z-index:2;color:#fff;font-size:32px;font-weight:900;font-family:system-ui,sans-serif;letter-spacing:-2px;text-shadow:0 0 16px rgba(147,180,248,0.6)';
                      parent.appendChild(fallback);
                    }
                  }}
                />
              </div>
            </div>
          </motion.div>

          {/* Progress section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            style={{
              width: 260,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            {/* Progress bar */}
            <div
              style={{
                width: '100%',
                height: 2.5,
                background: 'rgba(255,255,255,0.08)',
                borderRadius: 4,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <motion.div
                style={{
                  height: '100%',
                  background:
                    'linear-gradient(90deg, #1B3B8B, #4169E1, #93b4f8)',
                  borderRadius: 4,
                  position: 'relative',
                }}
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: 'linear', duration: 0.05 }}
              >
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '50%',
                    transform: 'translate(50%, -50%)',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#93b4f8',
                    boxShadow:
                      '0 0 12px #93b4f8, 0 0 20px rgba(147,180,248,0.6)',
                  }}
                />
              </motion.div>
            </div>

            {/* Percentage */}
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#4169E1',
                  boxShadow: '0 0 8px #4169E1',
                }}
              />
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: 12,
                  letterSpacing: '0.2em',
                  color: 'rgba(147,180,248,0.7)',
                }}
              >
                {Math.floor(progress)}%
              </span>
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#93b4f8',
                  boxShadow: '0 0 6px #93b4f8',
                }}
              />
            </div>

            {/* Loading text with dots animation */}
            <div className="flex items-center gap-1 mt-2">
              <span
                style={{
                  fontSize: 10,
                  color: 'rgba(147,180,248,0.5)',
                  letterSpacing: '0.1em',
                }}
              >
                LOADING
              </span>
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
              >
                .
              </motion.span>
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
              >
                .
              </motion.span>
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0.8 }}
              >
                .
              </motion.span>
            </div>
          </motion.div>
        </div>

        {/* Floating particles effect */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 0.6, 0], scale: [0, 1, 0], y: [0, -100] }}
            transition={{
              duration: 2 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.8,
              ease: 'easeOut',
            }}
            style={{
              position: 'absolute',
              left: `${10 + Math.random() * 80}%`,
              bottom: '10%',
              width: 2,
              height: 2,
              borderRadius: '50%',
              background: '#4169E1',
              boxShadow: '0 0 6px #4169E1',
            }}
          />
        ))}
      </motion.div>
    </AnimatePresence>
  );
}

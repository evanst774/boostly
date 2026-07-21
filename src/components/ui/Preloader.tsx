'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PreloaderProps {
  onComplete?: () => void;
  duration?: number;
}

/* ─── Particle network on canvas ─────────────────────────── */
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

    type P = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      a: number;
    };
    const pts: P[] = Array.from({ length: 70 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      r: Math.random() * 1.4 + 0.3,
      a: Math.random() * 0.45 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      pts.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(65,105,225,${p.a})`;
        ctx.fill();
      });

      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 90) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(65,105,225,${0.07 * (1 - d / 90)})`;
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

/* ─── Animated progress counter ──────────────────────────── */
function useProgress(active: boolean, totalMs: number) {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    if (!active) return;
    const interval = 30;
    const step = (interval / totalMs) * 100;
    const id = setInterval(() => {
      setPct((p) => {
        const next = p + step;
        if (next >= 100) {
          clearInterval(id);
          return 100;
        }
        return next;
      });
    }, interval);
    return () => clearInterval(id);
  }, [active, totalMs]);

  return Math.min(Math.floor(pct), 100);
}

/* ─── Main component ──────────────────────────────────────── */
export default function Preloader({
  onComplete,
  duration = 2400,
}: PreloaderProps) {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');
  const [mounted, setMounted] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pct = useProgress(true, duration - 400);

  useParticleCanvas(canvasRef, mounted);

  useEffect(() => {
    // After progress hits 100, wait a beat then trigger exit
    const exitDelay = duration - 200;
    const exitTimer = setTimeout(() => setPhase('out'), exitDelay);
    return () => clearTimeout(exitTimer);
  }, [duration]);

  const handleExitComplete = useCallback(() => {
    setMounted(false);
    onComplete?.();
  }, [onComplete]);

  if (!mounted) return null;

  return (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {phase !== 'out' && (
        <motion.div
          key="preloader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
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
          {/* ── Particle canvas ────────────────────────── */}
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
            }}
          />

          {/* ── Radial vignette glow ───────────────────── */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(ellipse 60% 55% at 50% 50%, rgba(27,59,139,0.18) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          {/* ── Corner brackets ────────────────────────── */}
          {(['tl', 'tr', 'bl', 'br'] as const).map((pos) => (
            <motion.div
              key={pos}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.4, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                width: 22,
                height: 22,
                borderColor: 'rgba(65,105,225,0.45)',
                borderStyle: 'solid',
                borderWidth:
                  pos === 'tl'
                    ? '1px 0 0 1px'
                    : pos === 'tr'
                      ? '1px 1px 0 0'
                      : pos === 'bl'
                        ? '0 0 1px 1px'
                        : '0 1px 1px 0',
                top: pos.startsWith('t') ? 24 : undefined,
                bottom: pos.startsWith('b') ? 24 : undefined,
                left: pos.endsWith('l') ? 24 : undefined,
                right: pos.endsWith('r') ? 24 : undefined,
              }}
            />
          ))}

          {/* ── Drifting scan line ─────────────────────── */}
          <motion.div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: 1,
              background:
                'linear-gradient(90deg, transparent, rgba(65,105,225,0.25), transparent)',
              pointerEvents: 'none',
            }}
            animate={{ top: ['15%', '85%'] }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut',
            }}
          />

          {/* ── Core: orbit + logo ─────────────────────── */}
          <div
            style={{
              position: 'relative',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, ease: [0, 0, 0.2, 1.2] }}
              style={{
                position: 'relative',
                width: 200,
                height: 200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Orbit ring 1 — outer slow */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
                style={{
                  position: 'absolute',
                  width: 200,
                  height: 200,
                  borderRadius: '50%',
                  border: '1px solid rgba(27,59,139,0.22)',
                }}
              >
                {/* Dot on ring */}
                <div
                  style={{
                    position: 'absolute',
                    top: -3,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#1B3B8B',
                    boxShadow:
                      '0 0 10px #4169E1, 0 0 20px rgba(65,105,225,0.4)',
                  }}
                />
              </motion.div>

              {/* Orbit ring 2 — mid reverse */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                style={{
                  position: 'absolute',
                  width: 158,
                  height: 158,
                  borderRadius: '50%',
                  border: '1px solid rgba(65,105,225,0.3)',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    bottom: -2.5,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: '#4169E1',
                    boxShadow: '0 0 8px #4169E1, 0 0 16px rgba(65,105,225,0.5)',
                  }}
                />
              </motion.div>

              {/* Orbit ring 3 — inner fast */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
                style={{
                  position: 'absolute',
                  width: 116,
                  height: 116,
                  borderRadius: '50%',
                  border: '1px solid rgba(147,180,248,0.2)',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: -2,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: '#93b4f8',
                    boxShadow: '0 0 6px #93b4f8',
                  }}
                />
              </motion.div>

              {/* Logo box */}
              <LogoBox />
            </motion.div>

            {/* ── Progress bar ───────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              style={{
                marginTop: 40,
                width: 210,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
              }}
            >
              {/* Track */}
              <div
                style={{
                  width: '100%',
                  height: 2,
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: 2,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <motion.div
                  style={{
                    height: '100%',
                    background:
                      'linear-gradient(90deg, #0d1f5c, #1B3B8B, #4169E1, #93b4f8)',
                    borderRadius: 2,
                    position: 'relative',
                  }}
                  initial={{ width: '0%' }}
                  animate={{ width: `${pct}%` }}
                  transition={{ ease: 'linear', duration: 0.08 }}
                >
                  {/* Glowing tip */}
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '50%',
                      transform: 'translate(50%, -50%)',
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      background: '#93b4f8',
                      boxShadow:
                        '0 0 8px #93b4f8, 0 0 16px rgba(147,180,248,0.6)',
                    }}
                  />
                </motion.div>
              </div>

              {/* Percentage */}
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: 11,
                  letterSpacing: '0.2em',
                  color: 'rgba(147,180,248,0.65)',
                }}
              >
                {String(pct).padStart(3, '0')}%
              </span>
            </motion.div>
          </div>

          {/* ── Exit curtain — two panels wipe up & down ── */}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Logo box with conic-gradient inner spin ─────────────── */
function LogoBox() {
  return (
    <div
      style={{
        position: 'relative',
        width: 78,
        height: 78,
        borderRadius: 20,
        background:
          'linear-gradient(145deg, #0d1f5c 0%, #1B3B8B 60%, #2e52c4 100%)',
        border: '1px solid rgba(65,105,225,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Ambient pulse */}
      <motion.div
        style={{
          position: 'absolute',
          inset: -1,
          borderRadius: 21,
        }}
        animate={{
          boxShadow: [
            '0 0 20px rgba(27,59,139,0.5), 0 0 40px rgba(27,59,139,0.2)',
            '0 0 35px rgba(65,105,225,0.7), 0 0 70px rgba(65,105,225,0.3)',
            '0 0 20px rgba(27,59,139,0.5), 0 0 40px rgba(27,59,139,0.2)',
          ],
        }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Conic gradient sweep */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 20,
          background:
            'conic-gradient(from 0deg, transparent 0deg, rgba(65,105,225,0.35) 60deg, transparent 120deg)',
        }}
      />

      {/* Inner bright ring */}
      <div
        style={{
          position: 'absolute',
          inset: 6,
          borderRadius: 14,
          border: '1px solid rgba(147,180,248,0.2)',
        }}
      />

      {/* Logo image — falls back to styled "M" if not found */}
      <LogoImage />
    </div>
  );
}

function LogoImage() {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <span
        style={{
          position: 'relative',
          zIndex: 2,
          color: '#fff',
          fontSize: 30,
          fontWeight: 900,
          fontFamily: 'system-ui, sans-serif',
          letterSpacing: -2,
          textShadow: '0 0 16px rgba(147,180,248,0.6)',
        }}
      >
        M
      </span>
    );
  }

  /* eslint-disable @next/next/no-img-element */
  return (
    <img
      src="/img/logo/icon.png"
      alt=""
      aria-hidden="true"
      width={44}
      height={44}
      style={{
        position: 'relative',
        zIndex: 2,
        objectFit: 'contain',
        filter: 'brightness(1.1)',
      }}
      onError={() => setErrored(true)}
    />
  );
}

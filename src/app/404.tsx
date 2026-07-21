// src/app/404.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Custom404() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [glitch, setGlitch] = useState(false);
  const [scanLine, setScanLine] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 30,
        y: (e.clientY / window.innerHeight - 0.5) * 30,
      });
    };

    // Random glitch effect
    const glitchInterval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 150);
    }, 3000);

    // Animated scan line
    const scanInterval = setInterval(() => {
      setScanLine(prev => (prev + 1) % 100);
    }, 50);

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(glitchInterval);
      clearInterval(scanInterval);
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0D1F5C] via-[#1B3B8B] to-[#0D1F5C]">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 opacity-20">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(transparent 0px, transparent 39px, rgba(65,105,225,0.3) 40px),
                             repeating-linear-gradient(90deg, transparent 0px, transparent 39px, rgba(65,105,225,0.3) 40px)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Animated Scan Line */}
      <motion.div
        className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#4169E1] to-transparent z-20"
        style={{ top: `${scanLine}%` }}
        animate={{ opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 1, repeat: Infinity }}
      />

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-[#4169E1]/20"
            style={{
              width: Math.random() * 4 + 2,
              height: Math.random() * 4 + 2,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="max-w-4xl w-full">
          {/* Glitch Effect 404 */}
          <div className="relative text-center mb-8">
            <motion.h1
              animate={glitch ? {
                x: [0, -3, 5, -2, 3, 0],
                textShadow: [
                  '0 0 0px rgba(65,105,225,0)',
                  '-2px 0 5px rgba(65,105,225,0.5), 2px 0 5px rgba(27,59,139,0.5)',
                  '0 0 0px rgba(65,105,225,0)',
                ],
              } : {}}
              transition={{ duration: 0.1 }}
              className="text-[12vw] font-black tracking-tighter font-manrope"
              style={{
                background: 'linear-gradient(135deg, #4169E1, #1B3B8B, #6389F5)',
                backgroundSize: '200% 200%',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              404
            </motion.h1>
            
            {/* Glitch Overlay */}
            <motion.div
              animate={glitch ? { x: [0, 3, -2, 4, -1, 0] } : {}}
              className="absolute inset-0 text-[12vw] font-black tracking-tighter font-manrope pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, #4169E1, #1B3B8B)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                opacity: 0.3,
                clipPath: 'polygon(0 45%, 100% 45%, 100% 55%, 0 55%)',
              }}
            >
              404
            </motion.div>
          </div>

          {/* Tech Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
            className="flex justify-center mb-6"
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-[#4169E1]/20 blur-xl animate-pulse" />
              <div className="relative w-24 h-24 rounded-2xl flex items-center justify-center overflow-hidden"
                   style={{ background: 'linear-gradient(135deg, #1B3B8B, #4169E1)' }}>
                <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M12 14v.01M12 18h.01" />
                </svg>
                {/* Animated border */}
                <div className="absolute inset-0 border-2 border-white/30 rounded-2xl animate-pulse" />
              </div>
            </div>
          </motion.div>

          {/* Title with typing effect */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-3xl md:text-4xl font-bold text-center mb-4 font-manrope text-white"
          >
            Page Not Found
          </motion.h2>

          {/* Message with typewriter effect - FIXED: escaped apostrophe */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center"
          >
            <p className="text-[#9bb6e0] text-lg mb-8 max-w-md mx-auto">
              The page you&apos;re looking for seems to have wandered off into the digital wilderness.
            </p>
          </motion.div>

          {/* Binary Code Animation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 0.8 }}
            className="text-center mb-8 font-mono text-xs text-[#4169E1]/60"
          >
            <div className="flex justify-center gap-2 flex-wrap">
              {[...Array(8)].map((_, i) => (
                <motion.span
                  key={i}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                >
                  {Math.random().toString(2).substring(2, 8)}
                </motion.span>
              ))}
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <Link href="/">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="group relative overflow-hidden px-8 py-3 rounded-xl font-bold text-white transition-all duration-300 flex items-center gap-2"
                style={{ background: 'linear-gradient(135deg, #1B3B8B, #4169E1)' }}
              >
                <i className="fas fa-home text-sm"></i>
                <span>Return Home</span>
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </motion.button>
            </Link>
            <Link href="/contact">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-3 rounded-xl font-semibold text-white transition-all duration-300 flex items-center gap-2 border border-white/30 hover:bg-white/10"
              >
                <i className="fas fa-envelope text-sm"></i>
                <span>Contact Support</span>
              </motion.button>
            </Link>
          </motion.div>

          {/* Search Suggestions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center"
          >
            <p className="text-[#9bb6e0] text-sm mb-3">You might be looking for:</p>
            <div className="flex flex-wrap gap-3 justify-center">
              {['Programs', 'Admissions', 'Campus Life', 'News', 'About Us'].map((item) => (
                <Link key={item} href={`/${item.toLowerCase().replace(' ', '-')}`}>
                  <motion.span
                    whileHover={{ scale: 1.05, color: '#4169E1' }}
                    className="text-sm text-[#9bb6e0]/70 hover:text-[#4169E1] cursor-pointer transition-colors px-3 py-1 rounded-full bg-white/5"
                  >
                    {item}
                  </motion.span>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Error Code Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="absolute bottom-8 left-0 right-0 text-center"
          >
            <p className="text-[#9bb6e0]/40 text-xs font-mono">
              ERROR_404: RESOURCE_NOT_FOUND | TIMESTAMP: {new Date().toLocaleTimeString()}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Mouse Parallax Effect */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-0"
        animate={{
          background: `radial-gradient(circle at ${50 + mousePosition.x * 0.5}% ${50 + mousePosition.y * 0.5}%, rgba(65,105,225,0.15) 0%, transparent 50%)`,
        }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      />
    </div>
  );
}
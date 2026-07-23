// src/components/landing/Navbar.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence, motion, Variants } from 'framer-motion';
import { Menu, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mobile menu variants
const mobileMenuVariants: Variants = {
  hidden: {
    opacity: 0,
    x: '100%',
    transition: { duration: 0.3, ease: 'easeInOut' },
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: 'easeInOut' },
  },
  exit: {
    opacity: 0,
    x: '100%',
    transition: { duration: 0.25, ease: 'easeInOut' },
  },
};

// Nav link variants
const navLinkVariants: Variants = {
  hidden: { opacity: 0, y: -10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3, ease: 'easeOut' },
  }),
};

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'How It Works', href: '#how' },
    { name: 'Plans', href: '#plans' },
  ];

  return (
    <>
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          isScrolled
            ? 'bg-navy/95 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/10'
            : 'bg-transparent',
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2.5 group flex-shrink-0"
            >
              <motion.div
                whileHover={{ scale: 1.05, rotate: -2 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="relative w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-primary to-accent-500 shadow-blue group-hover:shadow-glow-blue transition-all duration-300"
              >
                <Image
                  src="/img/logo/icon.png"
                  alt="Boostly"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                  priority
                />
                {/* Subtle glow overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </motion.div>
              <div className="hidden sm:block">
                <div className="font-rebond-bold text-base leading-none flex items-center gap-1">
                  <span className="text-white">Boost</span>
                  <span className="text-gold">ly</span>
                  <Sparkles className="w-3 h-3 text-gold/60 ml-0.5" />
                </div>
                <div className="text-[10px] text-white/40 leading-none mt-0.5 tracking-wide font-medium">
                  Earn. Play. Grow.
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.name}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={navLinkVariants}
                >
                  <Link
                    href={link.href}
                    className="relative px-4 py-2 text-sm font-medium text-white/60 hover:text-white transition-colors duration-200 group"
                  >
                    {link.name}
                    {/* Hover underline */}
                    <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gold group-hover:w-4/5 transition-all duration-300 -translate-x-1/2 rounded-full opacity-0 group-hover:opacity-100" />
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="hidden lg:flex items-center gap-2.5">
              <Link
                href="/login"
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white border border-white/10 hover:border-white/30 transition-all duration-200 hover:bg-white/5"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-navy bg-gold hover:bg-gold-hover transition-all duration-200 shadow-gold hover:shadow-gold/50 hover:scale-105 active:scale-95"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2.5 rounded-xl text-white hover:bg-white/10 transition-colors touch-manipulation"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu - Full opaque background */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-40 bg-navy lg:hidden"
            style={{
              backgroundColor: '#0F172A', // Solid navy, no transparency
            }}
          >
            <div className="flex flex-col h-full pt-20 pb-8">
              {/* Gradient header decoration */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-gold to-accent-500" />

              <div className="flex-1 overflow-y-auto px-6 py-4">
                {navLinks.map((link, idx) => (
                  <motion.div
                    key={link.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.08, duration: 0.3 }}
                  >
                    <Link
                      href={link.href}
                      className="flex items-center justify-between py-4 text-white/70 hover:text-white text-lg font-medium border-b border-white/5 transition-colors group"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span>{link.name}</span>
                      <span className="text-gold/30 group-hover:text-gold/60 transition-colors text-sm">
                        →
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </div>

              <div className="px-6 pt-6 border-t border-white/10 bg-white/5">
                <div className="flex flex-col gap-3">
                  <Link
                    href="/login"
                    className="w-full text-center py-3.5 rounded-xl text-white/80 border border-white/10 hover:border-primary/50 hover:bg-white/5 transition-all"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Log In
                  </Link>
                  <Link
                    href="/register"
                    className="w-full text-center py-3.5 rounded-xl text-navy bg-gold hover:bg-gold-hover transition-all font-semibold shadow-gold/30 hover:shadow-gold/50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </div>
                <p className="text-center text-[10px] text-white/20 mt-4">
                  © {new Date().getFullYear()} Boostly
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

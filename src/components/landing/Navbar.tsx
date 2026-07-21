// src/components/landing/Navbar.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
  Menu,
  X,
  ChevronDown,
  BookOpen,
  HelpCircle,
  FileText,
  MessageCircle,
  ExternalLink,
  Trophy,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Resources dropdown items
const resourcesItems = [
  {
    title: 'Documentation',
    description: 'Learn how to use Boostly',
    icon: BookOpen,
    href: '/resources/documentation',
  },
  {
    title: 'User Guides',
    description: 'Step-by-step tutorials',
    icon: FileText,
    href: '/resources/guides',
  },
  {
    title: 'FAQ',
    description: 'Frequently asked questions',
    icon: HelpCircle,
    href: '/resources/faq',
  },
  {
    title: 'API Reference',
    description: 'Integrate with our API',
    icon: FileText,
    href: '/resources/api',
  },
];

// Company dropdown items
const companyItems = [
  {
    title: 'About Us',
    description: 'Learn about Boostly',
    icon: Users,
    href: '/about',
  },
  {
    title: 'Blog',
    description: 'Latest news and updates',
    icon: FileText,
    href: '/blog',
  },
  {
    title: 'Careers',
    description: 'Join our team',
    icon: Trophy,
    href: '/careers',
  },
  {
    title: 'Contact',
    description: 'Get in touch with us',
    icon: MessageCircle,
    href: '/contact',
  },
];

// Dropdown animation variants - FIXED ease values
const dropdownVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -8,
    scale: 0.95,
    transition: { duration: 0.15, ease: 'easeOut' },
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.2, ease: 'easeInOut' },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.95,
    transition: { duration: 0.1, ease: 'easeIn' },
  },
};

// Mobile menu variants - FIXED ease values
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
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const [isCompanyOpen, setIsCompanyOpen] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMouseEnter = (type: 'resources' | 'company') => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (type === 'resources') {
      setIsResourcesOpen(true);
    } else {
      setIsCompanyOpen(true);
    }
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsResourcesOpen(false);
      setIsCompanyOpen(false);
    }, 200);
  };

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'How It Works', href: '#how' },
    { name: 'Plans', href: '#plans' },
    {
      name: 'Resources',
      href: '#',
      hasDropdown: true,
      type: 'resources' as const,
    },
    { name: 'Company', href: '#', hasDropdown: true, type: 'company' as const },
  ];

  return (
    <>
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          isScrolled
            ? 'bg-navy/95 backdrop-blur-xl border-b border-white/10'
            : 'bg-transparent',
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-3 group flex-shrink-0"
            >
              <motion.div
                whileHover={{ scale: 1.05, rotate: -3 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="relative w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-primary to-accent-500 shadow-blue group-hover:shadow-glow-blue transition-all duration-300"
              >
                <Image
                  src="/img/logo/logo.png"
                  alt="Boostly"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                  priority
                />
              </motion.div>
              <div className="hidden sm:block">
                <div className="font-rebond-bold text-base leading-none">
                  <span className="text-white">Boost</span>
                  <span className="text-gold">ly</span>
                </div>
                <div className="text-[10px] text-white/40 leading-none mt-0.5 tracking-wide">
                  Earn. Play. Grow.
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.name}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={navLinkVariants}
                  className="relative"
                >
                  {link.hasDropdown ? (
                    <div
                      ref={dropdownRef}
                      onMouseEnter={() => handleMouseEnter(link.type)}
                      onMouseLeave={handleMouseLeave}
                      className="relative inline-block"
                    >
                      <button
                        className="flex items-center gap-1 text-white/70 hover:text-white transition-colors duration-200 text-sm font-medium focus:outline-none group"
                        aria-expanded={
                          link.type === 'resources'
                            ? isResourcesOpen
                            : isCompanyOpen
                        }
                      >
                        {link.name}
                        <ChevronDown
                          className={cn(
                            'w-3.5 h-3.5 transition-transform duration-200',
                            (link.type === 'resources'
                              ? isResourcesOpen
                              : isCompanyOpen) && 'rotate-180',
                          )}
                        />
                      </button>

                      <AnimatePresence>
                        {(link.type === 'resources'
                          ? isResourcesOpen
                          : isCompanyOpen) && (
                          <motion.div
                            variants={dropdownVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            onMouseEnter={() => handleMouseEnter(link.type)}
                            onMouseLeave={handleMouseLeave}
                            className="absolute left-0 mt-2 w-[280px] z-50"
                          >
                            <div className="bg-navy-light/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-glow p-2">
                              {(link.type === 'resources'
                                ? resourcesItems
                                : companyItems
                              ).map((item) => (
                                <Link
                                  key={item.title}
                                  href={item.href}
                                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-all duration-200 cursor-pointer group"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/30 transition-colors">
                                    <item.icon className="w-4 h-4 text-primary-light" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="text-sm font-semibold text-white mb-0.5 flex items-center gap-1">
                                      {item.title}
                                      <ExternalLink className="w-3 h-3 text-white/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <div className="text-xs text-white/40">
                                      {item.description}
                                    </div>
                                  </div>
                                </Link>
                              ))}
                              <div className="h-px bg-white/10 my-2" />
                              <Link
                                href="/support"
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all duration-200 cursor-pointer"
                              >
                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                  <MessageCircle className="w-4 h-4 text-white/60" />
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-white">
                                    24/7 Support
                                  </div>
                                  <div className="text-xs text-white/40">
                                    Get help anytime
                                  </div>
                                </div>
                              </Link>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-white/70 hover:text-white transition-colors duration-200 text-sm font-medium"
                    >
                      {link.name}
                    </Link>
                  )}
                </motion.div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="hidden lg:flex items-center gap-3">
              <Link
                href="/login"
                className="px-5 py-2 rounded-xl text-sm font-medium text-white/80 hover:text-white border border-white/20 hover:border-primary/50 transition-all duration-200"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="px-5 py-2 rounded-xl text-sm font-semibold text-navy bg-gold hover:bg-gold-hover transition-all duration-200 shadow-gold hover:shadow-gold/50"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-40 bg-navy/98 backdrop-blur-xl lg:hidden"
          >
            <div className="flex flex-col h-full pt-20 pb-8">
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {navLinks.map((link) => (
                  <div key={link.name}>
                    {link.hasDropdown ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1, ease: 'easeOut' }}
                        className="py-3"
                      >
                        <div className="text-white/60 text-lg font-medium mb-3">
                          {link.name}
                        </div>
                        <div className="space-y-2 pl-4">
                          {(link.type === 'resources'
                            ? resourcesItems
                            : companyItems
                          ).map((item, i) => (
                            <motion.div
                              key={item.title}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05, ease: 'easeOut' }}
                            >
                              <Link
                                href={item.href}
                                className="flex items-start gap-3 py-3 px-3 rounded-xl hover:bg-white/5 transition-all"
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                                  <item.icon className="w-4 h-4 text-primary-light" />
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-white">
                                    {item.title}
                                  </div>
                                  <div className="text-xs text-white/40">
                                    {item.description}
                                  </div>
                                </div>
                              </Link>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    ) : (
                      <Link
                        href={link.href}
                        className="block text-white/70 hover:text-white text-lg font-medium py-3 border-b border-white/5"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {link.name}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
              <div className="px-6 pt-6 border-t border-white/10">
                <div className="flex flex-col gap-3">
                  <Link
                    href="/login"
                    className="w-full text-center py-3 rounded-xl text-white/80 border border-white/20 hover:border-primary/50 transition-all"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Log In
                  </Link>
                  <Link
                    href="/register"
                    className="w-full text-center py-3 rounded-xl text-navy bg-gold hover:bg-gold-hover transition-all font-semibold"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

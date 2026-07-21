// src/app/resources/documentation/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Code,
  Database,
  Key,
  Shield,
  Users,
  ArrowLeft,
  Search,
  Menu,
  X,
} from 'lucide-react';

const docsSections = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: <BookOpen className="w-4 h-4" />,
    content: `Welcome to MotoTrack ERP. This guide will help you set up your account and start managing your business operations.`,
  },
  {
    id: 'api-reference',
    title: 'API Reference',
    icon: <Code className="w-4 h-4" />,
    content: `The MotoTrack API allows you to integrate your existing systems with our platform. All API endpoints are RESTful and return JSON.`,
  },
  {
    id: 'database',
    title: 'Database Schema',
    icon: <Database className="w-4 h-4" />,
    content: `Our database is built on SQLite with Drizzle ORM. This ensures fast queries and reliable data storage for your business.`,
  },
  {
    id: 'authentication',
    title: 'Authentication',
    icon: <Key className="w-4 h-4" />,
    content: `MotoTrack supports JWT-based authentication with optional Two-Factor Authentication (2FA) via email or authenticator apps.`,
  },
  {
    id: 'security',
    title: 'Security',
    icon: <Shield className="w-4 h-4" />,
    content: `We implement TLS/SSL encryption, role-based access control, session management, and regular security audits.`,
  },
  {
    id: 'roles',
    title: 'Roles & Permissions',
    icon: <Users className="w-4 h-4" />,
    content: `Roles include Super Admin, Manager, Accountant, and Sales Person. Each role has granular permissions for different modules.`,
  },
];

export default function DocumentationPage() {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const activeDoc = docsSections.find((s) => s.id === activeSection);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Close mobile menu on window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640) setMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSectionChange = (id: string) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
  };

  const filteredSections = docsSections.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.content.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#050B1A]">
      {/* Top Nav */}
      <div className="sticky top-0 z-30 bg-[#0A0F1A]/95 backdrop-blur-md border-b border-white/5 safe-top">
        <div className="flex items-center justify-between px-3 sm:px-6 h-12 sm:h-14">
          <Link
            href="/"
            className="flex items-center gap-1.5 sm:gap-2 text-gray-400 hover:text-white touch-manipulation min-h-[44px] px-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs">Back</span>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Search - hidden on very small screens, visible sm+ */}
            <div className="relative hidden xs:block">
              <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-600" />
              <input
                type="text"
                placeholder="Search docs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-28 sm:w-40 md:w-48 pl-7 sm:pl-9 pr-2 sm:pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-[11px] sm:text-xs focus:outline-none focus:border-primary-500/50 transition-all"
              />
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 text-gray-400 hover:text-white touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto flex relative">
        {/* Desktop Sidebar */}
        <aside className="hidden sm:block w-52 md:w-56 flex-shrink-0 border-r border-white/5 min-h-[calc(100vh-56px)] bg-[#0A0F1A]/30 p-3 md:p-4 sticky top-14">
          <nav className="space-y-0.5">
            {filteredSections.map((section) => (
              <button
                key={section.id}
                onClick={() => handleSectionChange(section.id)}
                className={`w-full flex items-center gap-2 px-2.5 md:px-3 py-2 rounded-lg text-[11px] md:text-xs transition-all text-left touch-manipulation ${
                  activeSection === section.id
                    ? 'bg-primary-500/10 border border-primary-500/20 text-primary-400'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="flex-shrink-0">{section.icon}</span>
                <span className="truncate">{section.title}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 sm:hidden"
                onClick={() => setMobileMenuOpen(false)}
              />

              {/* Slide-in menu */}
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed top-0 left-0 bottom-0 w-64 max-w-[80vw] bg-[#0A0F1A] border-r border-white/10 z-30 sm:hidden overflow-y-auto safe-top safe-bottom"
              >
                {/* Mobile menu header */}
                <div className="flex items-center justify-between p-4 border-b border-white/5">
                  <span className="text-sm font-bold text-white">
                    Documentation
                  </span>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 text-gray-400 hover:text-white touch-manipulation rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Mobile search */}
                <div className="p-3 border-b border-white/5">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
                    <input
                      type="text"
                      placeholder="Search docs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-primary-500/50"
                    />
                  </div>
                </div>

                <nav className="p-3 space-y-0.5">
                  {filteredSections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => handleSectionChange(section.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs transition-all text-left touch-manipulation min-h-[44px] ${
                        activeSection === section.id
                          ? 'bg-primary-500/10 border border-primary-500/20 text-primary-400'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {section.icon}
                      <span>{section.title}</span>
                    </button>
                  ))}
                </nav>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-8">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Mobile: show current section selector */}
            <div className="sm:hidden mb-4">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs touch-manipulation"
              >
                <div className="flex items-center gap-2">
                  {activeDoc?.icon}
                  <span>{activeDoc?.title}</span>
                </div>
                <span className="text-gray-500 text-[10px]">Tap to browse</span>
              </button>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400 flex-shrink-0">
                {activeDoc?.icon}
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-white truncate">
                  {activeDoc?.title}
                </h1>
                <p className="text-[10px] sm:text-xs text-gray-500">
                  Documentation
                </p>
              </div>
            </div>

            <div className="prose prose-invert max-w-none">
              <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                {activeDoc?.content}
              </p>
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-[11px] sm:text-xs text-gray-500">
                  📝 More detailed documentation coming soon.
                </p>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}

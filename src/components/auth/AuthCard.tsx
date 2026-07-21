// components/auth/AuthCard.tsx
'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface AuthCardProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  showLogo?: boolean;
}

export function AuthCard({
  children,
  title,
  subtitle,
  showLogo = true,
}: AuthCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-[95%] xs:max-w-sm sm:max-w-md mx-auto"
    >
      {showLogo && (
        <div className="text-center mb-6 sm:mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 sm:gap-3 group touch-manipulation min-h-[44px]"
            aria-label="MotoTrack Home"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-all duration-300 flex-shrink-0 overflow-hidden">
              <Image
                src="/img/logo/logo.png"
                alt="MotoTrack"
                width={32}
                height={32}
                className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                priority
              />
            </div>
            <div className="text-left">
              <div className="font-rebond-bold text-lg sm:text-xl text-white tracking-tight">
                Moto<span className="text-blue-400">Track</span>
              </div>
              <div className="text-[10px] sm:text-xs text-gray-500 hidden xs:block">
                ERP Management System
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Added overflow-hidden + min-w-0 to contain children */}
      <div className="bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/10 p-4 sm:p-6 md:p-8 shadow-xl hover:border-white/20 transition-all duration-300 overflow-hidden min-w-0">
        <div className="text-center mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-rebond-bold text-white mb-1 sm:mb-2">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-gray-400 px-2">{subtitle}</p>
          )}
        </div>
        {children}
      </div>
    </motion.div>
  );
}

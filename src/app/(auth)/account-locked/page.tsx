// src/app/(auth)/account-locked/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import {
  Lock,
  Shield,
  Mail,
  Phone,
  Clock,
  AlertTriangle,
  ArrowLeft,
  Send,
  RefreshCw,
  Headphones,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export default function AccountLockedPage() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();
  const [countdown, setCountdown] = useState(30);
  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleContactSupport = async () => {
    setIsSending(true);
    try {
      await fetch('/api/auth/notify-locked', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          email: user?.email,
          reason: 'account_locked',
        }),
      });
      toast.success('Support team notified successfully');
      setCountdown(30);
    } catch {
      toast.error('Failed to notify support');
    } finally {
      setIsSending(false);
    }
  };

  const handleCheckStatus = async () => {
    setIsRefreshing(true);
    await refreshUser();
    setIsRefreshing(false);
  };

  const handleLogout = async () => {
    await logout();
    setTimeout(() => router.push('/login'), 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#2563EB]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#2563EB]/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#2563EB]/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-md z-10"
      >
        {/* Main Card */}
        <div className="bg-[#1E293B]/80 backdrop-blur-xl rounded-2xl border border-[#334155] shadow-2xl overflow-hidden">
          {/* Animated Warning Header */}
          <div className="relative bg-gradient-to-r from-red-500/20 via-red-600/10 to-red-500/20 p-6 text-center border-b border-red-500/20">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="relative w-20 h-20 mx-auto mb-4"
            >
              <div className="absolute inset-0 rounded-full bg-red-500/20 animate-pulse" />
              <div className="relative w-20 h-20 rounded-full bg-red-500/30 border-2 border-red-500/40 flex items-center justify-center">
                <Lock className="w-10 h-10 text-red-400" />
              </div>
            </motion.div>

            <h1 className="text-2xl font-bold text-white font-outfit mb-2">
              Account Locked
            </h1>
            <p className="text-sm text-red-300 font-medium">
              Your account has been temporarily locked for security
            </p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Lock Reason */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-red-500/5 rounded-xl p-4 border border-red-500/10"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1 font-outfit">
                    Why is my account locked?
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Too many failed login attempts or suspicious activity
                    detected. This is a security measure to protect your account
                    and earnings.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Account Information */}
            {user && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-3"
              >
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider font-outfit">
                  Account Information
                </h3>
                <div className="space-y-2 bg-[#0F172A]/50 rounded-xl p-3 border border-[#334155]">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">{user.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300">
                      Status:{' '}
                      <span className="text-red-400 font-semibold">Locked</span>
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Contact Options */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-3"
            >
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider font-outfit">
                How to regain access
              </h3>
              <div className="space-y-2.5">
                <button
                  onClick={handleContactSupport}
                  disabled={isSending || countdown > 0}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white font-semibold text-sm hover:from-[#1D4ED8] hover:to-[#1E3A8A] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
                >
                  {isSending ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : countdown > 0 ? (
                    <>
                      <Clock className="w-4 h-4" />
                      Notify Support ({countdown}s)
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Notify Support Team
                    </>
                  )}
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#334155]" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-[#1E293B] text-gray-500 font-medium">
                      or
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <Link
                    href="mailto:support@boostly.buzz"
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#0F172A]/50 border border-[#334155] text-gray-300 hover:text-white hover:bg-[#334155] transition-all text-sm font-medium"
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </Link>
                  <a
                    href="tel:+250788123456"
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#0F172A]/50 border border-[#334155] text-gray-300 hover:text-white hover:bg-[#334155] transition-all text-sm font-medium"
                  >
                    <Phone className="w-4 h-4" />
                    Call
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-2 gap-2.5"
            >
              <button
                onClick={handleCheckStatus}
                disabled={isRefreshing}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#0F172A]/50 border border-[#334155] text-blue-400 hover:text-blue-300 hover:bg-[#334155]/50 transition-all text-sm font-medium disabled:opacity-50"
              >
                {isRefreshing ? (
                  <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Check Status
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#0F172A]/50 border border-[#334155] text-gray-400 hover:text-white hover:bg-[#334155]/50 transition-all text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Sign Out
              </button>
            </motion.div>

            {/* Security Notice */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="bg-amber-500/5 rounded-xl p-3 border border-amber-500/10"
            >
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-400 leading-relaxed">
                  For security reasons, account recovery requires admin
                  verification. Our support team will reach out to you shortly
                  after notification.
                </p>
              </div>
            </motion.div>

            {/* Support Hours */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex items-center justify-center gap-4 text-xs text-gray-500 pt-2 border-t border-[#334155]"
            >
              <div className="flex items-center gap-1.5">
                <Headphones className="w-3.5 h-3.5" />
                <span>24/7 Support</span>
              </div>
              <span className="text-[#334155]">•</span>
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Live Chat Available</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-center mt-6"
        >
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <div className="relative w-4 h-4">
              <Image
                src="/img/logo/icon.png"
                alt="Boostly"
                fill
                className="object-contain"
              />
            </div>
            <span className="font-medium text-gray-400">Boostly</span>
            <span className="text-gray-600">•</span>
            <span>Security &amp; Trust</span>
          </div>
          <p className="text-[10px] text-gray-600 mt-2">
            Your account security is our priority
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

// components/auth/ForgotPasswordHero.tsx
'use client';

import { motion } from 'framer-motion';
import { Key, Shield, Clock, Mail as MailIcon } from 'lucide-react';

export function ForgotPasswordHero() {
  return (
    <div className="relative flex-1 hidden lg:flex flex-col justify-between p-8 xl:p-12 overflow-hidden bg-gradient-to-br from-[#0A1530] via-[#071122] to-[#050B1A]">
      {/* Animated floating elements */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.4, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="absolute top-1/4 right-10 hidden xl:block"
      >
        <motion.div
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
        >
          <Key className="w-8 h-8 text-accent-400/30" />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.4, scale: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="absolute bottom-1/4 left-10 hidden xl:block"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 4, repeat: Infinity, delay: 1 }}
        >
          <Shield className="w-8 h-8 text-primary-400/30" />
        </motion.div>
      </motion.div>

      {/* Content */}
      <div className="relative z-10">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3 mb-12"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg">
            <Key className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-rebond-bold text-xl text-white">
              Password<span className="text-gradient-blue">Reset</span>
            </div>
            <div className="text-xs text-gray-500">Secure Account Recovery</div>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-4xl xl:text-5xl font-rebond-bold text-white leading-tight mb-4">
            Forgot Your
            <br />
            <span className="text-gradient-blue">Password?</span>
          </h1>
          <p className="text-gray-400 text-base max-w-md leading-relaxed">
            Don&apos;t worry, it happens. Enter your email address and
            we&apos;ll send you a link to reset your password.
          </p>
        </motion.div>

        {/* Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
              <MailIcon className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-white">
                1. Enter Email
              </div>
              <div className="text-xs text-gray-500">
                Provide your registered email
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-accent-500/20 flex items-center justify-center">
              <MailIcon className="w-5 h-5 text-accent-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-white">
                2. Check Inbox
              </div>
              <div className="text-xs text-gray-500">
                We&apos;ll send a reset link
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Key className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-white">
                3. Reset Password
              </div>
              <div className="text-xs text-gray-500">Create a new password</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer Text */}
      <div className="relative z-10 mt-auto pt-8">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Clock className="w-3 h-3" />
          <span>Reset link expires in 1 hour</span>
        </div>
      </div>

      {/* Background gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary-500/10 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-accent-500/10 blur-3xl" />
    </div>
  );
}

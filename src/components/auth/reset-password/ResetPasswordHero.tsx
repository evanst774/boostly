// components/auth/reset-password/ResetPasswordHero.tsx
'use client';

import { motion } from 'framer-motion';
import { Key, Shield, Lock, Sparkles } from 'lucide-react';

export function ResetPasswordHero() {
  const floatingElements = [
    { icon: Shield, x: '10%', y: '25%', delay: 0 },
    { icon: Key, x: '85%', y: '20%', delay: 1 },
    { icon: Lock, x: '90%', y: '75%', delay: 2 },
  ];

  return (
    <div className="relative flex-1 hidden lg:flex flex-col justify-between p-8 xl:p-12 overflow-hidden bg-gradient-to-br from-[#0A1530] via-[#071122] to-[#050B1A]">
      {floatingElements.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.4, scale: 1 }}
          transition={{ delay: item.delay, duration: 0.8 }}
          className="absolute hidden xl:block"
          style={{ left: item.x, top: item.y }}
        >
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 5, repeat: Infinity, delay: item.delay }}
          >
            <item.icon className="w-8 h-8 text-primary-400/30" />
          </motion.div>
        </motion.div>
      ))}

      <div className="relative z-10">
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
              Reset<span className="text-gradient-blue">Password</span>
            </div>
            <div className="text-xs text-gray-500">Secure Account Recovery</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-4xl xl:text-5xl font-rebond-bold text-white leading-tight mb-4">
            Create New
            <br />
            <span className="text-gradient-blue">Password</span>
          </h1>
          <p className="text-gray-400 text-base max-w-md leading-relaxed">
            Enter your new password below to secure your account.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
              <Lock className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-white">
                Enter New Password
              </div>
              <div className="text-xs text-gray-500">Minimum 8 characters</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-accent-500/20 flex items-center justify-center">
              <Lock className="w-5 h-5 text-accent-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-white">
                Confirm Password
              </div>
              <div className="text-xs text-gray-500">
                Must match the new password
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="relative z-10 mt-auto pt-8">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Sparkles className="w-3 h-3" />
          <span>Secure password reset</span>
        </div>
      </div>

      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary-500/10 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-accent-500/10 blur-3xl" />
    </div>
  );
}

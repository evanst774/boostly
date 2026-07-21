// src/components/admin/users/edit/EditUserHeader.tsx
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight } from 'lucide-react';

interface EditUserHeaderProps {
  userName: string;
}

export function EditUserHeader({ userName }: EditUserHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3"
    >
      <Link
        href="/admin/users"
        className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-blue-500/30 transition-all duration-200 group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
      </Link>
      <div>
        <div className="flex items-center gap-2 text-xs font-medium mb-1">
          <Link
            href="/admin/users"
            className="text-gray-500 hover:text-gray-300"
          >
            Users
          </Link>
          <ChevronRight className="w-3 h-3 text-gray-600" />
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent font-semibold">
            Edit User
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          Edit: {userName}
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Update user details and permission overrides
        </p>
      </div>
    </motion.div>
  );
}

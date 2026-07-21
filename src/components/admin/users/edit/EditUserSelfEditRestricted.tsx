// src/components/admin/users/edit/EditUserSelfEditRestricted.tsx
'use client';

import Link from 'next/link';
import { ArrowLeft, ChevronRight, AlertTriangle, User } from 'lucide-react';

export function EditUserSelfEditRestricted() {
  return (
    <div className="space-y-6 pb-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/users"
          className="p-2.5 rounded-xl bg-surface/50 border border-border-subtle text-gray-400 hover:text-white hover:bg-white/5 hover:border-blue-500/30 transition-all duration-200 group"
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
            <span className="text-gray-400">Edit User</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-rebond-bold text-white">
            Cannot Edit Yourself
          </h1>
        </div>
      </div>
      <div className="bg-gradient-to-br from-surface/80 to-surface/40 rounded-2xl border border-border-subtle p-8 text-center">
        <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-10 h-10 text-amber-400" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">
          Self-Editing Restricted
        </h2>
        <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
          For security reasons, you cannot edit your own account through the
          admin panel.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/admin/users"
            className="px-4 py-2.5 rounded-xl bg-surface/50 border border-border-subtle text-gray-300 hover:text-white transition-all text-sm font-medium"
          >
            Back to Users
          </Link>
          <Link
            href="/settings/profile"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center gap-2"
          >
            <User className="w-4 h-4" />
            Go to My Profile
          </Link>
        </div>
      </div>
    </div>
  );
}

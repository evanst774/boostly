// src/components/admin/users/detail/UserDetailProfile.tsx
'use client';

import { cn } from '@/lib/utils';
import { Mail, Calendar, Clock, Key, Phone, User } from 'lucide-react';
import { UserDetailInfoCard } from './UserDetailInfoCard';
import { roleConfig } from '../configs';
import { AlertTriangle } from 'lucide-react';
import { UserDetailData } from '@/app/admin/types';

interface UserDetailProfileProps {
  user: UserDetailData;
  formatDate: (date: string | null) => string;
  formatRelative: (date: string | null) => string;
}

export function UserDetailProfile({
  user,
  formatDate,
  formatRelative,
}: UserDetailProfileProps) {
  const rCfg = roleConfig[user.roleName] || {
    bg: 'rgba(100,116,139,0.15)',
    color: '#94a3b8',
    label: user.roleName?.replace(/_/g, ' ') || 'No Role',
    icon: <User className="w-4 h-4" />,
    gradient: 'from-gray-500/20 to-slate-500/20',
  };

  const totalPerms = user.permissions.length;
  const moduleCount = new Set(user.permissions.map((p) => p.module)).size;

  return (
    <div className="relative bg-white/5 rounded-lg border border-white/5 overflow-hidden">
      {/* Role colour band */}
      <div className={cn('h-16 bg-gradient-to-r', rCfg.gradient)} />

      <div className="px-4 pb-6 -mt-10">
        {/* Avatar + identity */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-5 mb-4">
          <div
            className={cn(
              'w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center text-xl sm:text-2xl font-bold text-white shadow-md border-2 border-white/10 flex-shrink-0',
              user.isActive
                ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                : 'bg-gradient-to-br from-gray-600 to-gray-700',
            )}
          >
            {user.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>

          <div className="flex-1 pb-0.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-white tracking-tight">
                {user.name}
              </h2>

              {/* Active / Inactive pill */}
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium border',
                  user.isActive
                    ? 'bg-green-500/10 border-green-500/20 text-green-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400',
                )}
              >
                <span
                  className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    user.isActive ? 'bg-green-400' : 'bg-red-400',
                  )}
                />
                {user.isActive ? 'Active' : 'Inactive'}
              </span>

              {/* Role pill */}
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium border"
                style={{
                  background: rCfg.bg,
                  color: rCfg.color,
                  borderColor: `${rCfg.color}30`,
                }}
              >
                {rCfg.icon}
                {rCfg.label}
              </span>

              {/* Custom override badge */}
              {user.hasOverride && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  Custom
                </span>
              )}
            </div>

            <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{user.email}</span>
            </p>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <UserDetailInfoCard
            icon={<Phone className="w-3.5 h-3.5 text-blue-400" />}
            label="Phone"
            value={user.phone || 'Not provided'}
            bg="bg-blue-500/10 border-blue-500/20"
          />
          <UserDetailInfoCard
            icon={<Calendar className="w-3.5 h-3.5 text-green-400" />}
            label="Joined"
            value={formatRelative(user.createdAt)}
            bg="bg-green-500/10 border-green-500/20"
          />
          <UserDetailInfoCard
            icon={<Clock className="w-3.5 h-3.5 text-purple-400" />}
            label="Last Login"
            value={formatRelative(user.lastLoginAt)}
            bg="bg-purple-500/10 border-purple-500/20"
          />
          <UserDetailInfoCard
            icon={<Key className="w-3.5 h-3.5 text-amber-400" />}
            label="Permissions"
            value={`${totalPerms} across ${moduleCount} modules`}
            bg="bg-amber-500/10 border-amber-500/20"
          />
        </div>

        {/* Full date rows */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-white/5 rounded-lg border border-white/5 p-3 flex items-center gap-3 hover:border-white/10 transition-all">
            <Calendar className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                Account Created
              </div>
              <div className="text-xs text-gray-300 truncate">
                {formatDate(user.createdAt)}
              </div>
            </div>
          </div>
          <div className="bg-white/5 rounded-lg border border-white/5 p-3 flex items-center gap-3 hover:border-white/10 transition-all">
            <Clock className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                Last Active
              </div>
              <div className="text-xs text-gray-300 truncate">
                {formatDate(user.lastLoginAt)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

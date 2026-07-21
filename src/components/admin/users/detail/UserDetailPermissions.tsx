// src/components/admin/users/detail/UserDetailPermissions.tsx
'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Shield, Sparkles, BadgeCheck } from 'lucide-react';
import { UserDetailData } from '@/app/admin/types';
import { getModuleIcon } from '../configs';

interface UserDetailPermissionsProps {
  user: UserDetailData;
  isSelfView: boolean;
}

export function UserDetailPermissions({
  user,
  isSelfView,
}: UserDetailPermissionsProps) {
  const groupedPermissions = user.permissions.reduce(
    (acc, perm) => {
      const mod = perm.module || 'other';
      if (!acc[mod]) acc[mod] = [];
      acc[mod].push(perm);
      return acc;
    },
    {} as Record<string, typeof user.permissions>,
  );

  const totalPerms = user.permissions.length;
  const moduleCount = Object.keys(groupedPermissions).length;

  return (
    <div className="touch-manipulation">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/25 flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 font-space-grotesk">
              Effective Permissions
              {user.hasOverride && (
                <span className="text-[10px] font-normal text-amber-400 font-space-grotesk">
                  (custom override active)
                </span>
              )}
            </h3>
            <p className="text-[10px] text-gray-500 font-space-grotesk">
              {totalPerms} permissions • {moduleCount} modules
              {!user.hasOverride && user.roleName !== 'No Role' && (
                <span className="ml-1">
                  — inherited from{' '}
                  <span className="text-gray-400">
                    {user.roleName?.replace(/_/g, ' ')}
                  </span>{' '}
                  role
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {Object.keys(groupedPermissions).length === 0 ? (
        <div className="bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-sm rounded-xl border border-white/10 p-8 text-center">
          <Sparkles className="w-10 h-10 text-gray-500/50 mx-auto mb-2" />
          <p className="text-sm text-gray-500 font-space-grotesk">
            No permissions assigned
          </p>
          <p className="text-[10px] text-gray-600 mt-1 font-space-grotesk">
            {isSelfView
              ? 'Your permissions are managed through the profile settings page'
              : 'Assign a role or add a custom permission override via Edit User'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(groupedPermissions).map(([module, perms]) => (
            <motion.div
              key={module}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-sm rounded-xl border p-4 transition-all duration-300',
                user.hasOverride
                  ? 'border-amber-500/20 hover:border-amber-500/35'
                  : 'border-white/10 hover:border-purple-500/25',
              )}
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className={cn(
                    'w-7 h-7 rounded-lg border flex items-center justify-center',
                    user.hasOverride
                      ? 'bg-amber-500/20 border-amber-500/25'
                      : 'bg-purple-500/20 border-purple-500/25',
                  )}
                >
                  {getModuleIcon(module, user.hasOverride)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white capitalize font-space-grotesk">
                    {module.replace(/_/g, ' ')}
                  </h4>
                  <p className="text-[9px] text-gray-500 font-space-grotesk">
                    {perms.length} permission{perms.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="space-y-1.5">
                {perms.slice(0, 5).map((perm, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 touch-manipulation"
                  >
                    <BadgeCheck
                      className={cn(
                        'w-3 h-3 flex-shrink-0 mt-0.5',
                        user.hasOverride ? 'text-amber-400' : 'text-green-400',
                      )}
                    />
                    <span className="text-[11px] text-gray-300 truncate font-space-grotesk">
                      {perm.description}
                    </span>
                  </div>
                ))}
                {perms.length > 5 && (
                  <p className="text-[10px] text-gray-500 pl-5 font-space-grotesk">
                    +{perms.length - 5} more
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

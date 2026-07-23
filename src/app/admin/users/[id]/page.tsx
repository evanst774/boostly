// src/app/admin/users/[id]/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Shield,
  Edit2,
  Loader2,
  Copy,
  Check,
  Users,
  Award,
  Clock,
  Activity,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import type { UserDetailData, PermissionOption } from '@/app/admin/types';

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<UserDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Fetch user - wrapped in useCallback with userId dependency
  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Fetch user on mount - now includes fetchUser in dependencies
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleCopyId = () => {
    navigator.clipboard.writeText(userId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="animate-spin text-[#2563EB]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <Users size={48} className="text-[#94A3B8] mx-auto mb-4" />
        <p className="text-[#64748B] dark:text-[#94A3B8] font-medium">
          User not found
        </p>
        <button
          onClick={() => router.push('/admin/users')}
          className="mt-4 px-4 py-2 text-sm font-medium text-[#2563EB] hover:underline"
        >
          ← Back to Users
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-outfit">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/admin/users')}
          className="p-2 rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-[#334155] transition-colors"
        >
          <ArrowLeft size={20} className="text-[#64748B] dark:text-[#94A3B8]" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white truncate">
            {user.name}
          </h1>
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
            User Details
          </p>
        </div>
        <button
          onClick={() => router.push(`/admin/users/${userId}/edit`)}
          className="px-4 py-2.5 rounded-xl bg-[#2563EB] text-white text-sm font-bold hover:bg-[#1D4ED8] transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/25"
        >
          <Edit2 size={16} />
          Edit User
        </button>
      </div>

      {/* User Profile Card */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#60A5FA] to-[#2563EB] flex items-center justify-center text-white text-3xl font-bold flex-shrink-0 shadow-lg shadow-blue-500/25">
            {user.name
              ?.split(' ')
              .map((n: string) => n[0])
              .join('')
              .toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold text-[#0F172A] dark:text-white">
                {user.name}
              </h2>
              <span
                className={cn(
                  'text-xs font-semibold px-3 py-1 rounded-full',
                  user.isActive
                    ? 'bg-[#F0FDF4] dark:bg-[#22C55E]/20 text-[#22C55E] dark:text-[#4ADE80]'
                    : 'bg-[#FEF2F2] dark:bg-[#EF4444]/20 text-[#EF4444] dark:text-[#F87171]',
                )}
              >
                {user.isActive ? 'Active' : 'Inactive'}
              </span>
              <span
                className={cn(
                  'text-xs font-semibold px-3 py-1 rounded-full',
                  user.roleName === 'SUPER_ADMIN'
                    ? 'bg-[#F5F3FF] dark:bg-[#8B5CF6]/20 text-[#8B5CF6] dark:text-[#A78BFA]'
                    : user.roleName === 'ADMIN'
                      ? 'bg-[#EFF6FF] dark:bg-[#2563EB]/20 text-[#2563EB] dark:text-[#60A5FA]'
                      : 'bg-[#F8FAFC] dark:bg-[#334155] text-[#64748B] dark:text-[#94A3B8]',
                )}
              >
                {user.roleName || 'User'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div className="flex items-center gap-2 text-sm text-[#64748B] dark:text-[#94A3B8]">
                <Mail size={16} />
                {user.email}
              </div>
              {user.phone && (
                <div className="flex items-center gap-2 text-sm text-[#64748B] dark:text-[#94A3B8]">
                  <Phone size={16} />
                  {user.phone}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-[#64748B] dark:text-[#94A3B8]">
                <Calendar size={16} />
                Joined {formatDate(user.createdAt)}
              </div>
              {user.lastLoginAt && (
                <div className="flex items-center gap-2 text-sm text-[#64748B] dark:text-[#94A3B8]">
                  <Clock size={16} />
                  Last login {formatDate(user.lastLoginAt)}
                </div>
              )}
            </div>
            <button
              onClick={handleCopyId}
              className="mt-3 text-xs text-[#64748B] dark:text-[#94A3B8] hover:text-[#2563EB] dark:hover:text-[#60A5FA] transition-colors flex items-center gap-1"
            >
              <span className="font-mono">ID: {userId.slice(0, 12)}</span>
              {copied ? (
                <Check size={12} className="text-[#22C55E]" />
              ) : (
                <Copy size={12} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Rewards"
          value="12,450 RWF"
          icon={<Award size={16} />}
          color="purple"
        />
        <StatCard
          label="Videos Watched"
          value="42"
          icon={<Users size={16} />}
          color="blue"
        />
        <StatCard
          label="Games Played"
          value="18"
          icon={<Activity size={16} />}
          color="green"
        />
        <StatCard
          label="Referrals"
          value="5"
          icon={<Users size={16} />}
          color="yellow"
        />
      </div>

      {/* Permissions Section */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm p-6">
        <h3 className="text-sm font-bold text-[#0F172A] dark:text-white mb-4 flex items-center gap-2">
          <Shield size={16} className="text-[#8B5CF6]" />
          Permissions
        </h3>
        {user.permissions && user.permissions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {user.permissions.map((perm: PermissionOption) => (
              <span
                key={perm.key}
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[#F8FAFC] dark:bg-[#334155] text-[#64748B] dark:text-[#94A3B8] border border-[#F1F5F9] dark:border-[#334155]"
              >
                {perm.description}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
            No specific permissions assigned
          </p>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm p-6">
        <h3 className="text-sm font-bold text-[#0F172A] dark:text-white mb-4">
          Recent Activity
        </h3>
        <div className="space-y-3">
          {[
            {
              action: 'Watched video: "How to earn more"',
              time: '2 hours ago',
            },
            { action: 'Claimed daily bonus', time: '5 hours ago' },
            { action: 'Played game: "Bubble Pop"', time: '1 day ago' },
            { action: 'Referred friend: John Doe', time: '2 days ago' },
          ].map((activity, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 border-b border-[#F1F5F9] dark:border-[#334155] last:border-0"
            >
              <span className="text-sm text-[#0F172A] dark:text-white">
                {activity.action}
              </span>
              <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                {activity.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  const colors: Record<string, string> = {
    blue: 'bg-[#EFF6FF] dark:bg-[#2563EB]/20 text-[#2563EB] dark:text-[#60A5FA]',
    green:
      'bg-[#F0FDF4] dark:bg-[#22C55E]/20 text-[#22C55E] dark:text-[#4ADE80]',
    yellow:
      'bg-[#FFFBEB] dark:bg-[#F59E0B]/20 text-[#F59E0B] dark:text-[#FBBF24]',
    purple:
      'bg-[#F5F3FF] dark:bg-[#8B5CF6]/20 text-[#8B5CF6] dark:text-[#A78BFA]',
    red: 'bg-[#FEF2F2] dark:bg-[#EF4444]/20 text-[#EF4444] dark:text-[#F87171]',
  };

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-[#F1F5F9] dark:border-[#334155] p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center ${colors[color]}`}
        >
          {icon}
        </div>
        <div>
          <p className="text-lg font-bold text-[#0F172A] dark:text-white">
            {value}
          </p>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">{label}</p>
        </div>
      </div>
    </div>
  );
}

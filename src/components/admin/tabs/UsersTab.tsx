// src/components/admin/tabs/UsersTab.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  UserPlus,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  Loader2,
  Eye,
  RefreshCw,
  Users as UsersIcon,
  UserCheck,
  Shield,
  Mail,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  roleName: string;
}

interface UserStats {
  total: number;
  active: number;
  inactive: number;
  admins: number;
  superAdmins: number;
}

export function UsersTab() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [userToToggle, setUserToToggle] = useState<{
    id: string;
    name: string;
    isActive: boolean;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = useCallback(async (searchTerm: string) => {
    setIsLoading(true);
    try {
      const qs = new URLSearchParams({ limit: '20' });
      if (searchTerm) qs.set('search', searchTerm);
      const response = await fetch(`/api/admin/users?${qs.toString()}`);
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/users/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Debounce: fire the search request 400ms after typing stops
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    fetchUsers(search);
  }, [search, fetchUsers]);

  const refetchAll = () => {
    fetchUsers(search);
    fetchStats();
  };

  const handleToggleStatus = (user: AdminUser) => {
    setUserToToggle({ id: user.id, name: user.name, isActive: user.isActive });
    setStatusDialogOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!userToToggle) return;
    setIsSubmitting(true);
    try {
      await fetch(`/api/admin/users/${userToToggle.id}/toggle-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !userToToggle.isActive }),
      });
      refetchAll();
      setStatusDialogOpen(false);
      setUserToToggle(null);
    } catch {
      alert('Failed to update user status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = (userId: string) => {
    setUserToDelete(userId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    setIsSubmitting(true);
    try {
      await fetch(`/api/admin/users/${userToDelete}`, { method: 'DELETE' });
      refetchAll();
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch {
      alert('Failed to delete user');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 size={32} className="animate-spin text-[#2563EB]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <MiniStat
            label="Total Users"
            value={stats.total}
            icon={<UsersIcon size={16} />}
            color="blue"
          />
          <MiniStat
            label="Active"
            value={stats.active}
            icon={<UserCheck size={16} />}
            color="green"
          />
          <MiniStat
            label="Inactive"
            value={stats.inactive}
            icon={<Lock size={16} />}
            color="red"
          />
          <MiniStat
            label="Admins"
            value={stats.admins + stats.superAdmins}
            icon={<Shield size={16} />}
            color="purple"
          />
        </div>
      )}

      {/* Search & Actions */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[180px] sm:min-w-[200px] relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]"
          />
          <input
            type="text"
            placeholder="Search by name, email..."
            className="w-full pl-11 pr-4 py-2.5 border border-[#F1F5F9] dark:border-[#334155] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all text-sm bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white placeholder:text-[#94A3B8] touch-min-target"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <button
          onClick={() => router.push('/admin/users/create')}
          className="px-4 py-2.5 rounded-xl bg-[#2563EB] text-white text-sm font-bold hover:bg-[#1D4ED8] transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/25 touch-min-target"
        >
          <UserPlus size={18} />
          <span className="hidden xs:inline">Add User</span>
        </button>
        <button
          onClick={refetchAll}
          className="px-4 py-2.5 rounded-xl border border-[#F1F5F9] dark:border-[#334155] text-sm font-medium text-[#64748B] dark:text-[#94A3B8] hover:border-[#2563EB] hover:bg-[#EFF6FF] dark:hover:bg-[#2563EB]/10 transition-colors flex items-center gap-2 touch-min-target"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          <span className="hidden xs:inline">Refresh</span>
        </button>
      </div>

      {/* Desktop Table View - hidden on mobile */}
      <div className="hidden md:block bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F8FAFC] dark:bg-[#0F172A] border-b border-[#F1F5F9] dark:border-[#334155]">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
                  User
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
                  Email
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
                  Role
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-5 py-3 text-right text-xs font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] dark:divide-[#334155]">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-[#F8FAFC] dark:hover:bg-[#0F172A] transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#60A5FA] to-[#2563EB] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {user.name
                          ?.split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase() || 'U'}
                      </div>
                      <span className="text-sm font-medium text-[#0F172A] dark:text-white">
                        {user.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-[#64748B] dark:text-[#94A3B8]">
                    {user.email}
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-[#EFF6FF] dark:bg-[#2563EB]/20 text-[#2563EB] dark:text-[#60A5FA]">
                      {user.roleName}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={cn(
                        'text-xs font-semibold px-2 py-1 rounded-full',
                        user.isActive
                          ? 'bg-[#F0FDF4] dark:bg-[#22C55E]/20 text-[#22C55E] dark:text-[#4ADE80]'
                          : 'bg-[#FEF2F2] dark:bg-[#EF4444]/20 text-[#EF4444] dark:text-[#F87171]',
                      )}
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-[#64748B] dark:text-[#94A3B8]">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        className="p-2 rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-[#334155] transition-colors touch-min-target"
                        onClick={() => router.push(`/admin/users/${user.id}`)}
                      >
                        <Eye
                          size={16}
                          className="text-[#64748B] dark:text-[#94A3B8]"
                        />
                      </button>
                      <button
                        className="p-2 rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-[#334155] transition-colors touch-min-target"
                        onClick={() => handleToggleStatus(user)}
                      >
                        {user.isActive ? (
                          <Lock size={16} className="text-[#EF4444]" />
                        ) : (
                          <Unlock size={16} className="text-[#22C55E]" />
                        )}
                      </button>
                      <button
                        className="p-2 rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-[#334155] transition-colors touch-min-target"
                        onClick={() =>
                          router.push(`/admin/users/${user.id}/edit`)
                        }
                      >
                        <Edit2
                          size={16}
                          className="text-[#64748B] dark:text-[#94A3B8]"
                        />
                      </button>
                      <button
                        className="p-2 rounded-lg hover:bg-[#FEF2F2] dark:hover:bg-[#7F1D1D]/20 transition-colors touch-min-target"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 size={16} className="text-[#EF4444]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && !isLoading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-sm text-[#64748B] dark:text-[#94A3B8]"
                  >
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-[#F1F5F9] dark:border-[#334155] flex items-center justify-between">
          <span className="text-sm text-[#64748B] dark:text-[#94A3B8]">
            Showing {users.length} users
          </span>
          <button
            className="text-sm font-semibold text-[#2563EB] dark:text-[#60A5FA] hover:underline hover:text-[#1D4ED8] dark:hover:text-[#93C5FD] transition-colors cursor-pointer touch-min-target flex items-center gap-1 group"
            onClick={() => router.push('/admin/users')}
          >
            View all users
            <ChevronRight
              size={14}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </button>
        </div>
      </div>

      {/* Mobile Card View - visible only on mobile */}
      <div className="md:hidden space-y-3">
        {users.map((user) => (
          <div
            key={user.id}
            className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm p-4 hover:shadow-md transition-shadow"
          >
            {/* User Header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#60A5FA] to-[#2563EB] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {user.name
                  ?.split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#0F172A] dark:text-white truncate">
                  {user.name}
                </p>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                      user.isActive
                        ? 'bg-[#F0FDF4] dark:bg-[#22C55E]/20 text-[#22C55E] dark:text-[#4ADE80]'
                        : 'bg-[#FEF2F2] dark:bg-[#EF4444]/20 text-[#EF4444] dark:text-[#F87171]',
                    )}
                  >
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EFF6FF] dark:bg-[#2563EB]/20 text-[#2563EB] dark:text-[#60A5FA]">
                    {user.roleName}
                  </span>
                </div>
              </div>
              <button
                className="p-1.5 rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-[#334155] transition-colors"
                onClick={() => router.push(`/admin/users/${user.id}`)}
              >
                <ChevronRight
                  size={18}
                  className="text-[#64748B] dark:text-[#94A3B8]"
                />
              </button>
            </div>

            {/* User Details */}
            <div className="space-y-2 text-sm border-t border-[#F1F5F9] dark:border-[#334155] pt-3">
              <div className="flex items-center gap-2 text-[#64748B] dark:text-[#94A3B8]">
                <Mail size={14} className="flex-shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-2 text-[#64748B] dark:text-[#94A3B8]">
                <Calendar size={14} className="flex-shrink-0" />
                <span>Joined {formatDate(user.createdAt)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-[#F1F5F9] dark:border-[#334155]">
              <button
                className="p-2 rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-[#334155] transition-colors touch-min-target"
                onClick={() => router.push(`/admin/users/${user.id}`)}
                title="View Details"
              >
                <Eye size={16} className="text-[#64748B] dark:text-[#94A3B8]" />
              </button>
              <button
                className="p-2 rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-[#334155] transition-colors touch-min-target"
                onClick={() => handleToggleStatus(user)}
                title={user.isActive ? 'Deactivate' : 'Activate'}
              >
                {user.isActive ? (
                  <Lock size={16} className="text-[#EF4444]" />
                ) : (
                  <Unlock size={16} className="text-[#22C55E]" />
                )}
              </button>
              <button
                className="p-2 rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-[#334155] transition-colors touch-min-target"
                onClick={() => router.push(`/admin/users/${user.id}/edit`)}
                title="Edit User"
              >
                <Edit2
                  size={16}
                  className="text-[#64748B] dark:text-[#94A3B8]"
                />
              </button>
              <button
                className="p-2 rounded-lg hover:bg-[#FEF2F2] dark:hover:bg-[#7F1D1D]/20 transition-colors touch-min-target"
                onClick={() => handleDeleteUser(user.id)}
                title="Delete User"
              >
                <Trash2 size={16} className="text-[#EF4444]" />
              </button>
            </div>
          </div>
        ))}

        {users.length === 0 && !isLoading && (
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm p-8 text-center">
            <UsersIcon size={40} className="mx-auto text-[#94A3B8] mb-3" />
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
              No users found
            </p>
          </div>
        )}

        {/* Mobile View All */}
        {users.length > 0 && (
          <button
            className="w-full py-3 text-sm font-semibold text-[#2563EB] dark:text-[#60A5FA] hover:underline touch-min-target"
            onClick={() => router.push('/admin/users')}
          >
            View all users →
          </button>
        )}
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete User"
        description={
          <div className="space-y-2">
            <p className="text-sm text-gray-300">
              Are you sure you want to delete this user?
            </p>
            <p className="text-xs text-red-400/70">
              This action cannot be undone.
            </p>
          </div>
        }
        confirmText="Delete User"
        cancelText="Cancel"
        onConfirm={confirmDeleteUser}
        variant="delete"
        isLoading={isSubmitting}
      />

      <ConfirmDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        title={userToToggle?.isActive ? 'Deactivate User' : 'Activate User'}
        description={
          <p className="text-sm text-gray-300">
            You are about to{' '}
            <strong
              className={
                userToToggle?.isActive ? 'text-red-400' : 'text-green-400'
              }
            >
              {userToToggle?.isActive ? 'deactivate' : 'activate'}
            </strong>{' '}
            <strong className="text-white">{userToToggle?.name}</strong>
          </p>
        }
        confirmText={userToToggle?.isActive ? 'Deactivate' : 'Activate'}
        cancelText="Cancel"
        onConfirm={confirmToggleStatus}
        variant={userToToggle?.isActive ? 'deactivate' : 'activate'}
        isLoading={isSubmitting}
      />
    </div>
  );
}

function MiniStat({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'red' | 'purple';
}) {
  const colors = {
    blue: 'bg-[#EFF6FF] dark:bg-[#2563EB]/20 text-[#2563EB] dark:text-[#60A5FA]',
    green:
      'bg-[#F0FDF4] dark:bg-[#22C55E]/20 text-[#22C55E] dark:text-[#4ADE80]',
    red: 'bg-[#FEF2F2] dark:bg-[#EF4444]/20 text-[#EF4444] dark:text-[#F87171]',
    purple:
      'bg-[#F5F3FF] dark:bg-[#8B5CF6]/20 text-[#8B5CF6] dark:text-[#A78BFA]',
  };
  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-[#F1F5F9] dark:border-[#334155] p-3 sm:p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center',
            colors[color],
          )}
        >
          {icon}
        </div>
        <div>
          <p className="text-lg sm:text-xl font-bold text-[#0F172A] dark:text-white">
            {value.toLocaleString()}
          </p>
          <p className="text-[10px] sm:text-xs text-[#64748B] dark:text-[#94A3B8]">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}

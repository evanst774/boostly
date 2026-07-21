// src/app/admin/users/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Search,
  UserPlus,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  Loader2,
  Mail,
  Phone,
  Calendar,
  Shield,
  UserCheck,
  UserX,
  Eye,
  RefreshCw,
  ArrowUpDown,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { StatCard } from '@/components/admin/StatCard';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { type User } from '@/lib/db/schema/users';

type SortField = 'name' | 'email' | 'createdAt';
type SortDirection = 'asc' | 'desc';

// Extended user type with role name from API
interface UserWithRole extends User {
  roleName: string;
  permissions: Array<{ key: string; module: string; description: string }>;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserWithRole | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [userToToggle, setUserToToggle] = useState<UserWithRole | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    admins: 0,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      setUsers(data.users || []);

      const total = data.users?.length || 0;
      const active =
        data.users?.filter((u: UserWithRole) => u.isActive).length || 0;
      const admins =
        data.users?.filter(
          (u: UserWithRole) =>
            u.roleName === 'SUPER_ADMIN' || u.roleName === 'ADMIN',
        ).length || 0;
      setStats({ total, active, inactive: total - active, admins });
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredUsers = users
    .filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.phone || '').includes(searchQuery);

      const matchesRole = roleFilter === 'all' || user.roleName === roleFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && user.isActive) ||
        (statusFilter === 'inactive' && !user.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    })
    .sort((a, b) => {
      let aVal: string | number = a[sortField] || '';
      let bVal: string | number = b[sortField] || '';

      if (sortField === 'createdAt') {
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const handleToggleStatus = (user: UserWithRole) => {
    setUserToToggle(user);
    setStatusDialogOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!userToToggle) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/admin/users/${userToToggle.id}/toggle-status`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ active: !userToToggle.isActive }),
        },
      );
      if (response.ok) {
        await fetchUsers();
        setStatusDialogOpen(false);
        setUserToToggle(null);
      }
    } catch (error) {
      console.error('Failed to toggle user status:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = (user: UserWithRole) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await fetchUsers();
        setDeleteDialogOpen(false);
        setUserToDelete(null);
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="animate-spin text-[#2563EB]" />
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
            Loading users...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-outfit">
      {/* Header - Fixed dark/light theme support */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white">
            Users
          </h1>
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
            Manage all users on the platform
          </p>
        </div>
        <button
          onClick={() => router.push('/admin/users/create')}
          className="px-4 py-2.5 rounded-xl bg-[#2563EB] text-white text-sm font-bold hover:bg-[#1D4ED8] transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/25"
        >
          <UserPlus size={18} />
          Add User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Users"
          value={stats.total}
          icon={<Users size={20} />}
          color="blue"
        />
        <StatCard
          label="Active"
          value={stats.active}
          icon={<UserCheck size={20} />}
          color="green"
        />
        <StatCard
          label="Inactive"
          value={stats.inactive}
          icon={<UserX size={20} />}
          color="red"
        />
        <StatCard
          label="Admins"
          value={stats.admins}
          icon={<Shield size={20} />}
          color="purple"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm p-4">
        <div className="flex-1 min-w-[200px] relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
          />
          <input
            type="text"
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2.5 border border-[#F1F5F9] dark:border-[#334155] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all text-sm bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white placeholder:text-[#94A3B8]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="px-4 py-2.5 border border-[#F1F5F9] dark:border-[#334155] rounded-xl text-sm bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white focus:border-[#2563EB] outline-none"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="ADMIN">Admin</option>
          <option value="USER">User</option>
        </select>
        <select
          className="px-4 py-2.5 border border-[#F1F5F9] dark:border-[#334155] rounded-xl text-sm bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white focus:border-[#2563EB] outline-none"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button
          onClick={fetchUsers}
          className="px-4 py-2.5 border border-[#F1F5F9] dark:border-[#334155] rounded-xl text-sm font-medium text-[#64748B] dark:text-[#94A3B8] hover:border-[#2563EB] hover:bg-[#EFF6FF] dark:hover:bg-[#2563EB]/10 transition-colors flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F8FAFC] dark:bg-[#0F172A] border-b border-[#F1F5F9] dark:border-[#334155]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1 hover:text-[#2563EB] transition-colors"
                  >
                    User
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('email')}
                    className="flex items-center gap-1 hover:text-[#2563EB] transition-colors"
                  >
                    Email
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('createdAt')}
                    className="flex items-center gap-1 hover:text-[#2563EB] transition-colors"
                  >
                    Joined
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] dark:divide-[#334155]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Users size={40} className="text-[#94A3B8]" />
                      <p className="text-[#64748B] dark:text-[#94A3B8] font-medium">
                        No users found
                      </p>
                      <p className="text-sm text-[#94A3B8] dark:text-[#64748B]">
                        Try adjusting your search or filters
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-[#F8FAFC] dark:hover:bg-[#0F172A] transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#60A5FA] to-[#2563EB] flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-lg shadow-blue-500/25">
                          {user.name
                            ?.split(' ')
                            .map((n: string) => n[0])
                            .join('')
                            .toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#0F172A] dark:text-white">
                            {user.name}
                          </p>
                          {user.phone && (
                            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] flex items-center gap-1">
                              <Phone size={10} />
                              {user.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Mail size={14} className="text-[#94A3B8]" />
                        <span className="text-sm text-[#64748B] dark:text-[#94A3B8] truncate max-w-[150px]">
                          {user.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
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
                    </td>
                    <td className="px-6 py-4">
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
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-[#64748B] dark:text-[#94A3B8]">
                        <Calendar size={14} className="text-[#94A3B8]" />
                        {formatDate(user.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => router.push(`/admin/users/${user.id}`)}
                          className="p-2 rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-[#334155] transition-colors"
                          title="View Details"
                        >
                          <Eye
                            size={16}
                            className="text-[#64748B] dark:text-[#94A3B8]"
                          />
                        </button>
                        <button
                          onClick={() =>
                            router.push(`/admin/users/${user.id}/edit`)
                          }
                          className="p-2 rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-[#334155] transition-colors"
                          title="Edit User"
                        >
                          <Edit2
                            size={16}
                            className="text-[#64748B] dark:text-[#94A3B8]"
                          />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={cn(
                            'p-2 rounded-lg transition-colors',
                            user.isActive
                              ? 'hover:bg-[#FEF2F2] dark:hover:bg-[#7F1D1D]/20'
                              : 'hover:bg-[#F0FDF4] dark:hover:bg-[#22C55E]/20',
                          )}
                          title={user.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {user.isActive ? (
                            <Lock size={16} className="text-[#EF4444]" />
                          ) : (
                            <Unlock size={16} className="text-[#22C55E]" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="p-2 rounded-lg hover:bg-[#FEF2F2] dark:hover:bg-[#7F1D1D]/20 transition-colors"
                          title="Delete User"
                        >
                          <Trash2 size={16} className="text-[#EF4444]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-[#F1F5F9] dark:border-[#334155] flex items-center justify-between">
          <span className="text-sm text-[#64748B] dark:text-[#94A3B8]">
            Showing {filteredUsers.length} of {users.length} users
          </span>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 rounded-lg border border-[#F1F5F9] dark:border-[#334155] text-sm font-medium text-[#64748B] dark:text-[#94A3B8] hover:border-[#2563EB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Previous
            </button>
            <button className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-bold hover:bg-[#1D4ED8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete User"
        description={
          <div className="space-y-2">
            <p className="text-sm text-gray-300">
              Are you sure you want to delete{' '}
              <strong className="text-white">{userToDelete?.name}</strong>?
            </p>
            <p className="text-xs text-red-400/70">
              This action cannot be undone. All associated data will be
              permanently removed.
            </p>
          </div>
        }
        confirmText="Delete User"
        cancelText="Cancel"
        onConfirm={confirmDeleteUser}
        variant="delete"
        isLoading={isSubmitting}
      />

      {/* Status Toggle Confirmation Dialog - Lock/Unlock */}
      <ConfirmDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        title={userToToggle?.isActive ? 'Deactivate User' : 'Activate User'}
        description={
          <div className="space-y-3">
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

            <div className="bg-[#0F172A] rounded-xl p-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Current Status</span>
                <span
                  className={cn(
                    'font-semibold',
                    userToToggle?.isActive ? 'text-green-400' : 'text-red-400',
                  )}
                >
                  {userToToggle?.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Email</span>
                <span className="text-white">{userToToggle?.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Role</span>
                <span className="text-[#60A5FA]">{userToToggle?.roleName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Joined</span>
                <span className="text-gray-300">
                  {formatDate(userToToggle?.createdAt || '')}
                </span>
              </div>
            </div>

            <div
              className={cn(
                'text-xs rounded-lg p-3 border',
                userToToggle?.isActive
                  ? 'bg-red-500/10 border-red-500/20 text-red-400'
                  : 'bg-green-500/10 border-green-500/20 text-green-400',
              )}
            >
              {userToToggle?.isActive
                ? '⚠️ This user will lose access to the platform. Any pending withdrawals will be held for review.'
                : '✅ This user will regain full access to the platform and can log in immediately.'}
            </div>
          </div>
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

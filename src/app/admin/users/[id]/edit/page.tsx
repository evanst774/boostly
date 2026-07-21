// src/app/admin/users/[id]/edit/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  User,
  Mail,
  Phone,
  Shield,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    roleId: '',
    isActive: true,
  });
  const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchUserAndRoles();
  }, [userId]);

  const fetchUserAndRoles = async () => {
    setIsLoading(true);
    try {
      const [userRes, rolesRes] = await Promise.all([
        fetch(`/api/admin/users/${userId}`),
        fetch('/api/admin/roles'),
      ]);

      const userData = await userRes.json();
      const rolesData = await rolesRes.json();

      setFormData({
        name: userData.user.name || '',
        email: userData.user.email || '',
        phone: userData.user.phone || '',
        roleId: userData.user.roleId || '',
        isActive: userData.user.isActive ?? true,
      });
      setRoles(rolesData.roles || []);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setMessage({ type: 'error', text: 'Failed to load user data' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const payload = {
        ...formData,
        ...(newPassword ? { password: newPassword } : {}),
      };

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user');
      }

      setMessage({ type: 'success', text: 'User updated successfully!' });
      setTimeout(() => router.push(`/admin/users/${userId}`), 1500);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update user',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="animate-spin text-[#2563EB]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-outfit">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push(`/admin/users/${userId}`)}
          className="p-2 rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-[#334155] transition-colors"
        >
          <ArrowLeft size={20} className="text-[#64748B] dark:text-[#94A3B8]" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white">
            Edit User
          </h1>
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
            Update user information and permissions
          </p>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm p-6"
      >
        <div className="space-y-6">
          {/* User Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] dark:text-white mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <User
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full pl-11 pr-4 py-2.5 border border-[#F1F5F9] dark:border-[#334155] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white"
                  placeholder="Enter full name"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] dark:text-white mb-1.5">
                Email Address *
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full pl-11 pr-4 py-2.5 border border-[#F1F5F9] dark:border-[#334155] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white"
                  placeholder="Enter email address"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] dark:text-white mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                />
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full pl-11 pr-4 py-2.5 border border-[#F1F5F9] dark:border-[#334155] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white"
                  placeholder="Enter phone number"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] dark:text-white mb-1.5">
                Role
              </label>
              <div className="relative">
                <Shield
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                />
                <select
                  value={formData.roleId}
                  onChange={(e) =>
                    setFormData({ ...formData, roleId: e.target.value })
                  }
                  className="w-full pl-11 pr-4 py-2.5 border border-[#F1F5F9] dark:border-[#334155] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white appearance-none"
                >
                  <option value="">Select Role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Password Reset */}
          <div>
            <label className="block text-sm font-medium text-[#0F172A] dark:text-white mb-1.5">
              Reset Password (Optional)
            </label>
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-11 pr-12 py-2.5 border border-[#F1F5F9] dark:border-[#334155] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white"
                placeholder="Enter new password (leave blank to keep current)"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1.5">
              Leave blank to keep the current password
            </p>
          </div>

          {/* Status Toggle */}
          <div className="flex items-center gap-4 py-4 border-t border-b border-[#F1F5F9] dark:border-[#334155]">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, isActive: !formData.isActive })
                }
                className={cn(
                  'w-12 h-7 rounded-full transition-colors relative flex-shrink-0',
                  formData.isActive ? 'bg-[#22C55E]' : 'bg-[#D1D5DB]',
                )}
              >
                <div
                  className={cn(
                    'absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform',
                    formData.isActive ? 'right-0.5' : 'left-0.5',
                  )}
                />
              </button>
              <div>
                <p className="text-sm font-medium text-[#0F172A] dark:text-white">
                  {formData.isActive ? 'Active' : 'Inactive'}
                </p>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                  {formData.isActive
                    ? 'User can log in and use the platform'
                    : 'User cannot log in or access the platform'}
                </p>
              </div>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div
              className={cn(
                'p-3 rounded-xl flex items-center gap-2 text-sm',
                message.type === 'success'
                  ? 'bg-[#F0FDF4] dark:bg-[#22C55E]/20 text-[#22C55E] dark:text-[#4ADE80]'
                  : 'bg-[#FEF2F2] dark:bg-[#EF4444]/20 text-[#EF4444] dark:text-[#F87171]',
              )}
            >
              {message.type === 'success' ? (
                <CheckCircle size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
              {message.text}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.push(`/admin/users/${userId}`)}
              className="px-6 py-2.5 rounded-xl border border-[#F1F5F9] dark:border-[#334155] text-sm font-medium text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F8FAFC] dark:hover:bg-[#334155] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-2.5 rounded-xl bg-[#2563EB] text-white text-sm font-bold hover:bg-[#1D4ED8] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

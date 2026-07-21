// src/components/admin/users/create/CreateUserForm.tsx
'use client';

import { CreateUserFormData, RoleOption } from '@/app/admin/types';
import {
  Mail,
  Phone,
  Lock,
  User,
  Eye,
  EyeOff,
  Send,
  UserPlus,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormSelect } from '@/components/ui/FormSelect';

interface CreateUserFormProps {
  formData: CreateUserFormData;
  roles: RoleOption[];
  showPassword: boolean;
  sendWelcomeEmail: boolean;
  onShowPasswordChange: (show: boolean) => void;
  onSendWelcomeEmailChange: (send: boolean) => void;
  onFieldChange: (field: keyof CreateUserFormData, value: string) => void;
  onRoleChange: (roleId: string) => void;
  isFormValid: () => boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
}

export function CreateUserForm({
  formData,
  roles,
  showPassword,
  sendWelcomeEmail,
  onShowPasswordChange,
  onSendWelcomeEmailChange,
  onFieldChange,
  onRoleChange,
  isFormValid,
  isSubmitting,
  onSubmit,
}: CreateUserFormProps) {
  const roleOptions = roles.map((r) => ({
    value: r.id,
    label: r.name.replace(/_/g, ' '),
    description: r.description || '',
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gradient-to-br from-white/5 to-white/2 rounded-2xl border border-white/10 p-6 sticky top-4 space-y-4 hover:border-white/20 transition-all duration-300"
    >
      <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-white/10">
        <User className="w-4 h-4 text-blue-400" />
        User Information
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">
            Full Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => onFieldChange('name', e.target.value)}
            placeholder="John Doe"
            className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-gray-600 touch-manipulation min-h-[44px]"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">
            Email <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => onFieldChange('email', e.target.value)}
              placeholder="john@example.com"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-gray-600 touch-manipulation min-h-[44px]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">
            Password <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => onFieldChange('password', e.target.value)}
              placeholder="Min 8 characters"
              className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-gray-600 touch-manipulation min-h-[44px]"
            />
            <button
              type="button"
              onClick={() => onShowPasswordChange(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 z-10 p-1 rounded-lg transition-colors touch-manipulation min-h-[32px]"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {formData.password && formData.password.length < 8 && (
            <p className="text-[10px] text-red-400 mt-1">
              Password must be at least 8 characters
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">
            Phone
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => onFieldChange('phone', e.target.value)}
              placeholder="+250 7XX XXX XXX"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-gray-600 touch-manipulation min-h-[44px]"
            />
          </div>
        </div>

        <div className="sm:col-span-2">
          <FormSelect
            label="Role"
            name="roleId"
            value={formData.roleId}
            onChange={(value) => onRoleChange(value)}
            options={roleOptions}
            required
            placeholder="Select a role..."
            searchable
            className="w-full"
          />
          <p className="text-[10px] text-gray-500 mt-1">
            Select a role to auto-fill permissions from the Matrix
          </p>
        </div>
      </div>

      {/* Welcome Email Toggle - Inside the form before submit button (matching old version) */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-blue-500/5 border border-blue-500/15">
        <div className="flex items-center gap-2">
          <Send className="w-4 h-4 text-blue-400" />
          <div>
            <div className="text-xs font-semibold text-white">
              Send Welcome Email
            </div>
            <div className="text-[10px] text-gray-500">
              Notify user with login instructions
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onSendWelcomeEmailChange(!sendWelcomeEmail)}
          className={cn(
            'w-10 h-5 rounded-full transition-all relative',
            sendWelcomeEmail ? 'bg-blue-500' : 'bg-gray-600',
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all',
              sendWelcomeEmail ? 'right-0.5' : 'left-0.5',
            )}
          />
        </button>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || !isFormValid()}
        className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2 touch-manipulation min-h-[44px]"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Creating...
          </>
        ) : (
          <>
            <UserPlus className="w-4 h-4" /> Create User
          </>
        )}
      </button>
    </form>
  );
}

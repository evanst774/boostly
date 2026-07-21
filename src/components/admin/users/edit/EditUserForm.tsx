// src/components/admin/users/edit/EditUserForm.tsx
'use client';

import { useState } from 'react';
import { EditUserFormData, RoleOption } from '@/app/admin/types';
import { cn } from '@/lib/utils';
import {
  Mail,
  Phone,
  Lock,
  User,
  UserCheck,
  UserX,
  Save,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { FormSelect } from '@/components/ui/FormSelect';

interface EditUserFormProps {
  formData: EditUserFormData;
  roles: RoleOption[];
  isSaving: boolean;
  onFieldChange: (
    field: keyof EditUserFormData,
    value: string | boolean,
  ) => void;
  onRoleChange: (roleId: string) => void;
  onSubmit: () => void;
  isFormValid: boolean;
}

export function EditUserForm({
  formData,
  roles,
  isSaving,
  onFieldChange,
  onRoleChange,
  onSubmit,
  isFormValid,
}: EditUserFormProps) {
  const [showPassword, setShowPassword] = useState(false);

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

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">
            Full Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => onFieldChange('name', e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-gray-600 touch-manipulation min-h-[44px]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">
            Email <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => onFieldChange('email', e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-gray-600 touch-manipulation min-h-[44px]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">
            New Password{' '}
            <span className="text-gray-500 font-normal">
              (leave blank to keep)
            </span>
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
              onClick={() => setShowPassword(!showPassword)}
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
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-gray-600 touch-manipulation min-h-[44px]"
            />
          </div>
        </div>

        <div>
          <FormSelect
            label="Role"
            name="roleId"
            value={formData.roleId}
            onChange={(value) => onRoleChange(value)}
            options={roleOptions}
            placeholder="Select a role..."
            searchable
            className="w-full"
          />
          <p className="text-[10px] text-gray-500 mt-1">
            Changing role resets any custom permission override
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">
            Account Status
          </label>
          <button
            type="button"
            onClick={() => onFieldChange('isActive', !formData.isActive)}
            className={cn(
              'w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all touch-manipulation min-h-[48px]',
              formData.isActive
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15'
                : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/15',
            )}
          >
            <span className="text-sm font-semibold">
              {formData.isActive ? 'Active' : 'Inactive'}
            </span>
            {formData.isActive ? (
              <UserCheck className="w-5 h-5" />
            ) : (
              <UserX className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSaving || !isFormValid}
        className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2 touch-manipulation min-h-[44px]"
      >
        {isSaving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Saving...
          </>
        ) : (
          <>
            <Save className="w-4 h-4" /> Save Changes
          </>
        )}
      </button>
    </form>
  );
}

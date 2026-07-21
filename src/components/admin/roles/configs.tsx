// src/components/admin/roles/configs.tsx
import { RoleConfig } from '@/app/admin/types';
import { Shield, UserCheck, Activity, Zap, Users } from 'lucide-react';

export const roleConfig: Record<string, RoleConfig> = {
  SUPER_ADMIN: {
    bg: 'rgba(139,92,246,0.08)',
    color: '#a78bfa',
    label: 'Super Admin',
    icon: <Shield className="w-4 h-4" />,
    gradient: 'from-purple-500/20 to-indigo-500/20',
    borderColor: 'border-purple-500/40',
  },
  MANAGER: {
    bg: 'rgba(6,182,212,0.08)',
    color: '#22d3ee',
    label: 'Manager',
    icon: <UserCheck className="w-4 h-4" />,
    gradient: 'from-cyan-500/20 to-teal-500/20',
    borderColor: 'border-cyan-500/40',
  },
  ACCOUNTANT: {
    bg: 'rgba(245,158,11,0.08)',
    color: '#fbbf24',
    label: 'Accountant',
    icon: <Activity className="w-4 h-4" />,
    gradient: 'from-amber-500/20 to-orange-500/20',
    borderColor: 'border-amber-500/40',
  },
  SALES_PERSON: {
    bg: 'rgba(34,197,94,0.08)',
    color: '#4ade80',
    label: 'Sales Person',
    icon: <Zap className="w-4 h-4" />,
    gradient: 'from-green-500/20 to-emerald-500/20',
    borderColor: 'border-green-500/40',
  },
  DEFAULT: {
    bg: 'rgba(100,116,139,0.08)',
    color: '#94a3b8',
    label: 'Custom Role',
    icon: <Users className="w-4 h-4" />,
    gradient: 'from-gray-500/20 to-slate-500/20',
    borderColor: 'border-gray-500/40',
  },
};

export function formatModuleName(module: string): string {
  return module.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

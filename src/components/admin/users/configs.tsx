// src/components/admin/users/configs.ts
import { RoleConfig } from '@/app/admin/types';
import { Shield, UserCheck, Activity, Zap, Key } from 'lucide-react';

export const PAGE_SIZE = 20;

export const roleConfig: Record<string, RoleConfig> = {
  SUPER_ADMIN: {
    bg: 'rgba(139,92,246,0.12)',
    color: '#a78bfa',
    label: 'Super Admin',
    icon: <Shield className="w-3 h-3" />,
    gradient: 'from-purple-500/20 to-indigo-500/20',
  },
  MANAGER: {
    bg: 'rgba(6,182,212,0.12)',
    color: '#22d3ee',
    label: 'Manager',
    icon: <UserCheck className="w-3 h-3" />,
    gradient: 'from-cyan-500/20 to-teal-500/20',
  },
  ACCOUNTANT: {
    bg: 'rgba(245,158,11,0.12)',
    color: '#fbbf24',
    label: 'Accountant',
    icon: <Activity className="w-3 h-3" />,
    gradient: 'from-amber-500/20 to-orange-500/20',
  },
  SALES_PERSON: {
    bg: 'rgba(34,197,94,0.12)',
    color: '#4ade80',
    label: 'Sales Person',
    icon: <Zap className="w-3 h-3" />,
    gradient: 'from-green-500/20 to-emerald-500/20',
  },
};

export const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: '🟢 Active' },
  { value: 'inactive', label: '🔴 Inactive' },
];

export function getModuleIcon(module: string, override = false) {
  const stroke = override ? '#fbbf24' : '#a78bfa';
  const size = { width: 14, height: 14 };

  const icons: Record<string, React.ReactNode> = {
    dashboard: (
      <svg
        {...size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={stroke}
        strokeWidth="2"
      >
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    inventory: (
      <svg
        {...size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={stroke}
        strokeWidth="2"
      >
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      </svg>
    ),
    sales: (
      <svg
        {...size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={stroke}
        strokeWidth="2"
      >
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    ),
    customers: (
      <svg
        {...size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={stroke}
        strokeWidth="2"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
      </svg>
    ),
    finance: (
      <svg
        {...size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={stroke}
        strokeWidth="2"
      >
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    contracts: (
      <svg
        {...size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={stroke}
        strokeWidth="2"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
    reports: (
      <svg
        {...size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={stroke}
        strokeWidth="2"
      >
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    admin: (
      <svg
        {...size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={stroke}
        strokeWidth="2"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  };

  return (
    icons[module] ?? <Key style={{ width: 14, height: 14, color: stroke }} />
  );
}

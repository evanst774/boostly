// src/components/admin/AdminUI.tsx
'use client';

import { cn } from '@/lib/utils';
import { Loader2, Inbox, AlertTriangle } from 'lucide-react';

export function AdminCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-[#334155] shadow-sm dark:shadow-xl dark:shadow-[#2563EB]/5',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionHeader({
  icon,
  title,
  subtitle,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 dark:border-[#334155]">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-9 h-9 rounded-lg bg-[#2563EB]/10 dark:bg-[#2563EB]/20 flex items-center justify-center text-[#2563EB] dark:text-[#60A5FA]">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

export function StatTile({
  label,
  value,
  subtitle,
  icon,
  color = 'blue',
}: {
  label: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red';
}) {
  const colors = {
    blue: 'bg-[#2563EB]/10 text-[#2563EB] dark:bg-[#2563EB]/20 dark:text-[#60A5FA]',
    green:
      'bg-[#22C55E]/10 text-[#16A34A] dark:bg-[#22C55E]/20 dark:text-[#4ADE80]',
    yellow:
      'bg-[#F59E0B]/10 text-[#B45309] dark:bg-[#F59E0B]/20 dark:text-[#FBBF24]',
    purple:
      'bg-[#8B5CF6]/10 text-[#7C3AED] dark:bg-[#8B5CF6]/20 dark:text-[#A78BFA]',
    red: 'bg-[#EF4444]/10 text-[#DC2626] dark:bg-[#EF4444]/20 dark:text-[#F87171]',
  };

  return (
    <AdminCard className="p-4">
      <div className="flex items-center gap-3">
        {icon && (
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
              colors[color],
            )}
          >
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-lg font-extrabold text-slate-900 dark:text-white truncate">
            {value}
          </p>
          <p className="text-xs text-slate-500 dark:text-[#94A3B8] truncate">
            {label}
          </p>
          {subtitle && (
            <p className="text-[10px] text-slate-400 dark:text-[#64748B] truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </AdminCard>
  );
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:
    'bg-[#22C55E]/10 text-[#16A34A] dark:bg-[#22C55E]/20 dark:text-[#4ADE80]',
  COMPLETED:
    'bg-[#22C55E]/10 text-[#16A34A] dark:bg-[#22C55E]/20 dark:text-[#4ADE80]',
  PENDING:
    'bg-[#F59E0B]/10 text-[#B45309] dark:bg-[#F59E0B]/20 dark:text-[#FBBF24]',
  PROCESSING:
    'bg-[#2563EB]/10 text-[#2563EB] dark:bg-[#2563EB]/20 dark:text-[#60A5FA]',
  FAILED:
    'bg-[#EF4444]/10 text-[#DC2626] dark:bg-[#EF4444]/20 dark:text-[#F87171]',
  INACTIVE: 'bg-slate-100 text-slate-500 dark:bg-[#334155] dark:text-[#94A3B8]',
  DRAFT: 'bg-slate-100 text-slate-500 dark:bg-[#334155] dark:text-[#94A3B8]',
  CANCELLED:
    'bg-[#EF4444]/10 text-[#DC2626] dark:bg-[#EF4444]/20 dark:text-[#F87171]',
};

export function StatusPill({ status }: { status: string }) {
  const style =
    STATUS_STYLES[status?.toUpperCase()] ||
    'bg-slate-100 text-slate-500 dark:bg-[#334155] dark:text-[#94A3B8]';
  return (
    <span
      className={cn(
        'text-[10px] font-semibold px-2 py-1 rounded-full whitespace-nowrap',
        style,
      )}
    >
      {status}
    </span>
  );
}

export function LoadingBlock({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <Loader2 className="animate-spin text-[#2563EB]" size={28} />
      <p className="text-sm text-slate-500 dark:text-[#94A3B8]">{label}</p>
    </div>
  );
}

export function EmptyState({
  label = 'Nothing here yet',
  icon,
}: {
  label?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <div className="text-slate-300 dark:text-[#334155]">
        {icon || <Inbox size={32} />}
      </div>
      <p className="text-sm text-slate-500 dark:text-[#94A3B8]">{label}</p>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <AlertTriangle className="text-[#F87171]" size={28} />
      <p className="text-sm text-slate-500 dark:text-[#94A3B8]">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#2563EB] text-white hover:bg-[#1D4ED8] transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function TableShell({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-[#334155] text-left">
            {headers.map((h) => (
              <th
                key={h}
                className="px-5 py-3 text-xs font-semibold text-slate-500 dark:text-[#94A3B8] whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-[#334155]">
          {children}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 dark:border-[#334155]">
      <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        <button
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#334155] text-slate-600 dark:text-[#94A3B8] disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
        >
          Previous
        </button>
        <button
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#334155] text-slate-600 dark:text-[#94A3B8] disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}

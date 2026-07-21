// src/components/admin/audit-logs/AuditLogsFilters.tsx
'use client';

import { Search, X } from 'lucide-react';
import {
  actionFilterOptions,
  moduleFilterOptions,
  dateRangeOptions,
} from './configs';

interface AuditLogsFiltersProps {
  searchInput: string;
  setSearchInput: (value: string) => void;
  actionFilter: string;
  setActionFilter: (value: string) => void;
  moduleFilter: string;
  setModuleFilter: (value: string) => void;
  dateFilter: string;
  setDateFilter: (value: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function AuditLogsFilters({
  searchInput,
  setSearchInput,
  actionFilter,
  setActionFilter,
  moduleFilter,
  setModuleFilter,
  dateFilter,
  setDateFilter,
  onClearFilters,
  hasActiveFilters,
}: AuditLogsFiltersProps) {
  return (
    <div className="p-4 border-b border-white/10 flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px] max-w-[360px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by user, action, or record ID..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#0a1020] border border-white/10 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition-all"
        />
      </div>
      <select
        value={actionFilter}
        onChange={(e) => setActionFilter(e.target.value)}
        className="px-3 py-2.5 rounded-xl bg-[#0a1020] border border-white/10 text-gray-300 text-sm focus:outline-none focus:border-blue-500/50 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222.5%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_10px_center] bg-no-repeat pr-8"
      >
        {actionFilterOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <select
        value={moduleFilter}
        onChange={(e) => setModuleFilter(e.target.value)}
        className="px-3 py-2.5 rounded-xl bg-[#0a1020] border border-white/10 text-gray-300 text-sm focus:outline-none focus:border-blue-500/50 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222.5%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_10px_center] bg-no-repeat pr-8"
      >
        {moduleFilterOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <select
        value={dateFilter}
        onChange={(e) => setDateFilter(e.target.value)}
        className="px-3 py-2.5 rounded-xl bg-[#0a1020] border border-white/10 text-gray-300 text-sm focus:outline-none focus:border-blue-500/50 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222.5%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_10px_center] bg-no-repeat pr-8"
      >
        {dateRangeOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
        >
          <X className="w-3 h-3" />
          Clear
        </button>
      )}
    </div>
  );
}

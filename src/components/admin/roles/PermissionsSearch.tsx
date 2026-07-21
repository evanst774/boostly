// src/components/admin/roles/PermissionsSearch.tsx
'use client';

import { Search, X } from 'lucide-react';

interface PermissionsSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onClear: () => void;
  selectedPermCount: number;
  totalPermCount: number;
}

export function PermissionsSearch({
  searchTerm,
  onSearchChange,
  onClear,
  selectedPermCount,
  totalPermCount,
}: PermissionsSearchProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full">
      <div className="relative flex-1 w-full sm:max-w-[360px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search permissions..."
          className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-space-grotesk placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all duration-200 touch-manipulation"
          aria-label="Search permissions"
        />
        {searchTerm && (
          <button
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors touch-min-target p-1 rounded-lg"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 text-xs font-space-grotesk text-gray-500 flex-shrink-0">
        <span className="text-purple-400 font-bold">{selectedPermCount}</span>{' '}
        <span className="text-gray-400">of</span>{' '}
        <span className="text-gray-400">{totalPermCount}</span>{' '}
        <span className="text-gray-500">granted</span>
      </div>
    </div>
  );
}

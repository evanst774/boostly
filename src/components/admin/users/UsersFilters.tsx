// src/components/admin/users/UsersFilters.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { FormSelect } from '@/components/ui/FormSelect';
import { statusOptions } from './configs';

interface UsersFiltersProps {
  showFilters: boolean;
  searchInput: string;
  setSearchInput: (value: string) => void;
  roleFilter: string;
  setRoleFilter: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  roleOptions: { value: string; label: string }[];
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function UsersFilters({
  showFilters,
  searchInput,
  setSearchInput,
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter,
  roleOptions,
  onClearFilters,
  hasActiveFilters,
}: UsersFiltersProps) {
  return (
    <AnimatePresence>
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className="bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-sm rounded-2xl border border-white/10 p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-[360px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by name, email or phone..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#0a1020] border border-white/10 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition-all"
                />
              </div>
              <div className="min-w-[150px]">
                <FormSelect
                  label="Role"
                  name="roleFilter"
                  value={roleFilter}
                  onChange={setRoleFilter}
                  options={roleOptions}
                  placeholder="All Roles"
                />
              </div>
              <div className="min-w-[150px]">
                <FormSelect
                  label="Status"
                  name="statusFilter"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={statusOptions}
                  placeholder="All Statuses"
                />
              </div>
              {hasActiveFilters && (
                <button
                  onClick={onClearFilters}
                  className="flex items-center gap-1 px-3 py-2.5 text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
                >
                  <X className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

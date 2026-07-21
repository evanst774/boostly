// src/components/admin/users/UsersPagination.tsx
'use client';

import { cn } from '@/lib/utils';

interface UsersPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function UsersPagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
}: UsersPaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = (): (number | '...')[] => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (page <= 3) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push('...');
    } else if (page >= totalPages - 2) {
      pages.push('...');
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push('...');
      for (let i = page - 2; i <= page + 2; i++) pages.push(i);
      pages.push('...');
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
      <span className="text-sm text-gray-500">
        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of{' '}
        {total.toLocaleString()}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-40 transition-all"
        >
          Prev
        </button>
        {getPageNumbers().map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="px-1 text-gray-500">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={cn(
                'w-9 h-9 rounded-lg text-sm font-semibold transition-all',
                page === p
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25'
                  : 'text-gray-400 hover:text-white hover:bg-white/10',
              )}
            >
              {p}
            </button>
          ),
        )}
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-40 transition-all"
        >
          Next
        </button>
      </div>
    </div>
  );
}

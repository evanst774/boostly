// src/components/admin/roles/RoleTabsSkeleton.tsx
'use client';

export function RoleTabsSkeleton() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1 animate-pulse touch-manipulation">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="flex-shrink-0 flex items-center gap-3 px-5 py-3.5 rounded-2xl border-2 border-white/10 bg-white/5"
          style={{ minWidth: '180px' }}
        >
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10" />
          <div className="space-y-2 flex-1 min-w-0">
            <div className="h-4 w-20 bg-white/10 rounded" />
            <div className="h-3 w-16 bg-white/5 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// src/components/admin/users/UsersSkeleton.tsx
'use client';

export function TableRowSkeleton() {
  return (
    <tr className="border-b border-white/5">
      {[...Array(6)].map((_, i) => (
        <td key={i} className="py-4 px-4">
          <div
            className="h-4 bg-white/5 rounded animate-pulse"
            style={{ width: i === 0 ? '24px' : i === 1 ? '120px' : '80px' }}
          />
        </td>
      ))}
    </tr>
  );
}

export function UsersSkeleton() {
  return (
    <div className="space-y-6 pb-8 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/5 animate-pulse" />
        <div>
          <div className="h-8 w-48 bg-white/10 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-64 bg-white/5 rounded animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white/5 rounded-2xl border border-white/10 h-24 animate-pulse"
          />
        ))}
      </div>
      <div className="flex gap-4">
        <div className="flex-1 bg-white/5 rounded-2xl border border-white/10 h-[400px] animate-pulse" />
        <div className="w-80 bg-white/5 rounded-2xl border border-white/10 h-[400px] animate-pulse hidden xl:block" />
      </div>
    </div>
  );
}

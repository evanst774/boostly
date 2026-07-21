// src/components/admin/users/detail/UserDetailSkeleton.tsx
'use client';

export function UserDetailSkeleton() {
  return (
    <div className="space-y-6 pb-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10" />
          <div>
            <div className="h-8 w-48 bg-white/10 rounded-lg mb-2" />
            <div className="h-4 w-64 bg-white/5 rounded" />
          </div>
        </div>
        <div className="h-10 w-36 bg-white/10 rounded-xl border border-white/10" />
      </div>

      {/* Profile Card Skeleton */}
      <div className="bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
        {/* Role band skeleton */}
        <div className="h-24 bg-white/10" />

        <div className="px-4 sm:px-6 pb-6 -mt-12">
          {/* Avatar + identity skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-5 mb-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/10 border-4 border-white/5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="h-6 w-32 bg-white/10 rounded" />
                <div className="h-6 w-16 bg-white/10 rounded-full" />
                <div className="h-6 w-20 bg-white/10 rounded-full" />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-3.5 h-3.5 bg-white/10 rounded" />
                <div className="h-4 w-48 bg-white/10 rounded" />
              </div>
            </div>
          </div>

          {/* Info grid skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/10 p-3 flex items-center gap-3 bg-white/5"
              >
                <div className="w-8 h-8 rounded-lg bg-white/10" />
                <div className="flex-1 min-w-0">
                  <div className="h-2 w-12 bg-white/10 rounded" />
                  <div className="h-3 w-16 bg-white/10 rounded mt-1" />
                </div>
              </div>
            ))}
          </div>

          {/* Date rows skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className="bg-white/5 rounded-xl border border-white/10 p-3 flex items-center gap-3"
              >
                <div className="w-4 h-4 bg-white/10 rounded" />
                <div className="flex-1 min-w-0">
                  <div className="h-2 w-20 bg-white/10 rounded" />
                  <div className="h-3 w-32 bg-white/10 rounded mt-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

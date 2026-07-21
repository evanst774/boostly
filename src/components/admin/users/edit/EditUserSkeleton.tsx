// src/components/admin/users/edit/EditUserSkeleton.tsx
'use client';

export function EditUserSkeleton() {
  return (
    <div className="space-y-6 pb-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Header Skeleton */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/10 animate-pulse" />
        <div>
          <div className="h-8 w-48 bg-white/10 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-64 bg-white/5 rounded animate-pulse" />
        </div>
      </div>

      {/* Content Grid Skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Form Skeleton */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6 space-y-4 animate-pulse">
          <div className="h-5 w-32 bg-white/10 rounded mb-4" />
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-24 bg-white/10 rounded" />
                <div className="h-11 bg-white/10 rounded-xl" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column - Permissions Table Skeleton */}
        <div className="xl:col-span-2 bg-white/5 rounded-2xl border border-white/10 p-6 space-y-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="h-5 w-32 bg-white/10 rounded" />
            <div className="h-8 w-24 bg-white/10 rounded-lg" />
          </div>
          <div className="h-10 bg-white/10 rounded-xl" />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-10 bg-white/10 rounded-lg" />
                <div className="ml-6 space-y-1">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="flex items-center gap-3 p-2">
                      <div className="w-4 h-4 bg-white/10 rounded" />
                      <div className="flex-1 h-3 bg-white/10 rounded" />
                      <div className="w-16 h-6 bg-white/10 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

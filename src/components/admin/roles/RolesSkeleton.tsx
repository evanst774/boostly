// src/components/admin/roles/RolesSkeleton.tsx
'use client';

import { RoleTabsSkeleton } from './RoleTabsSkeleton';

export function RolesSkeleton() {
  return (
    <div className="space-y-6 pb-8 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10" />
          <div>
            <div className="h-8 w-48 bg-white/10 rounded-lg mb-2" />
            <div className="h-4 w-64 bg-white/5 rounded" />
          </div>
        </div>
      </div>

      {/* Role Tabs Skeleton */}
      <RoleTabsSkeleton />

      {/* Permission Content Skeleton */}
      <div className="bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-sm rounded-2xl border border-white/10 p-6 h-[400px] overflow-hidden">
        {/* Search Bar Skeleton */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
          <div className="relative flex-1 w-full sm:max-w-[360px]">
            <div className="w-full h-11 rounded-xl bg-white/10 border border-white/10" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-8 bg-white/10 rounded" />
            <div className="h-4 w-4 bg-white/10 rounded" />
            <div className="h-4 w-8 bg-white/10 rounded" />
            <div className="h-4 w-16 bg-white/10 rounded" />
          </div>
        </div>

        {/* Module Skeletons */}
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl overflow-hidden border border-white/10"
            >
              {/* Module Header Skeleton */}
              <div className="flex items-center justify-between px-4 py-3 bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded border-2 border-white/10" />
                  <div>
                    <div className="h-4 w-32 bg-white/10 rounded" />
                    <div className="h-3 w-20 bg-white/10 rounded mt-1" />
                  </div>
                </div>
                <div className="w-4 h-4 bg-white/10 rounded" />
              </div>

              {/* Permission Items Skeleton */}
              <div className="bg-white/5 border-t border-white/10 p-2 space-y-1">
                {[...Array(4)].map((_, j) => (
                  <div
                    key={j}
                    className="flex items-center justify-between px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded border-2 border-white/10" />
                      <div className="h-3 w-40 bg-white/10 rounded" />
                    </div>
                    <div className="h-3 w-16 bg-white/10 rounded" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

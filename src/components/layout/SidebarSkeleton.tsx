// src/components/layout/SidebarSkeleton.tsx
'use client';

interface SidebarSkeletonProps {
  collapsed: boolean;
}

export function SidebarSkeleton({ collapsed }: SidebarSkeletonProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo Section Skeleton */}
      <div className="flex-shrink-0 p-4">
        <div className="flex items-center gap-3">
          {/* Logo icon shape matches Sidebar’s rounded-xl */}
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 animate-pulse overflow-hidden ring-2 ring-white/10">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
          </div>

          {!collapsed && (
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="relative h-4 w-24 bg-white/5 rounded-lg animate-pulse overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
              </div>
              <div className="relative h-2 w-16 bg-white/5 rounded-lg animate-pulse overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Section Skeleton */}
      <nav className="flex-1 min-h-0 overflow-y-auto py-4 px-3 space-y-1">
        {[
          { name: 'Dashboard', hasChildren: false },
          { name: 'Inventory', childrenCount: 4 },
          { name: 'Sales', childrenCount: 3 },
          { name: 'Customers', childrenCount: 2 },
          { name: 'Finance', childrenCount: 3 },
          { name: 'Contracts', childrenCount: 2 },
          { name: 'Reports', childrenCount: 5 },
          { name: 'Account', childrenCount: 2 },
          { name: 'System', hasChildren: false },
        ].map((item, index) => (
          <div key={item.name}>
            <div className="flex items-center justify-between px-3 py-2.5 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="relative w-5 h-5 bg-white/10 rounded-lg animate-pulse overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                </div>
                {!collapsed && (
                  <div className="relative h-4 w-20 bg-white/10 rounded-lg animate-pulse overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                  </div>
                )}
              </div>
              {!collapsed && item.childrenCount && (
                <div className="relative w-4 h-4 bg-white/5 rounded-lg animate-pulse overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                </div>
              )}
            </div>

            {/* Submenu Items */}
            {!collapsed && item.childrenCount && (
              <div className="ml-9 mt-1 space-y-0.5">
                {[...Array(item.childrenCount)].map((_, i) => (
                  <div key={`sub-${index}-${i}`} className="px-3 py-2">
                    <div className="relative h-3 w-24 bg-white/5 rounded-lg animate-pulse overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* User Profile Section Skeleton */}
      <div className="flex-shrink-0 p-3">
        <div className="flex items-center gap-3 p-2 rounded-xl">
          {/* Avatar shape matches Sidebar (rounded-lg) but with ring */}
          <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 animate-pulse overflow-hidden ring-2 ring-white/10">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
          </div>

          {!collapsed && (
            <>
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="relative h-3 w-20 bg-white/10 rounded-lg animate-pulse overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                </div>
                <div className="relative h-2 w-14 bg-white/5 rounded-lg animate-pulse overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                </div>
              </div>
              <div className="relative w-3.5 h-3.5 bg-white/5 rounded-lg animate-pulse overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Shimmer Animation Styles */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

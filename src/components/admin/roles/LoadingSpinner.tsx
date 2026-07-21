// src/components/admin/roles/LoadingSpinner.tsx
'use client';

import { Sparkles } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({
  message = 'Loading roles & permissions...',
}: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-2 border-purple-500/20 animate-[spin_3s_linear_infinite]" />
        <div className="absolute inset-2 rounded-full border-2 border-t-purple-400 border-r-transparent border-b-transparent border-l-transparent animate-[spin_1.5s_linear_infinite]" />
        <div className="absolute inset-4 rounded-full border-2 border-t-indigo-400 border-r-transparent border-b-indigo-400 border-l-transparent animate-[spin_2s_linear_infinite_reverse]" />
        <div className="absolute inset-[30%] rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 animate-pulse flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white animate-pulse" />
        </div>
      </div>
      <p className="text-sm text-gray-400 mt-4 animate-pulse">{message}</p>
    </div>
  );
}

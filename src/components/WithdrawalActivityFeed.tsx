// src/components/WithdrawalActivityFeed.tsx

'use client';

import { useState, useEffect } from 'react';
import { Wallet } from 'lucide-react';

interface PublicWithdrawal {
  id: string;
  userName: string;
  amount: number;
  currency: string;
  method: string;
  timeAgo: string;
  // Optional: show only first name or initials for privacy
  displayName: string;
}

export function WithdrawalActivityFeed({ limit = 5 }: { limit?: number }) {
  const [withdrawals, setWithdrawals] = useState<PublicWithdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPublicWithdrawals();
  }, []);

  const fetchPublicWithdrawals = async () => {
    try {
      // This endpoint returns ONLY completed withdrawals with user names
      // but limited to 10 recent ones for privacy
      const response = await fetch(
        `/api/public/withdrawals/recent?limit=${limit}`,
      );
      const data = await response.json();
      setWithdrawals(data.withdrawals || []);
    } catch (error) {
      console.error('Failed to fetch public withdrawals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-pulse flex gap-1">
          <div className="w-2 h-2 bg-[#2563EB]/30 rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-[#2563EB]/30 rounded-full animate-bounce delay-100" />
          <div className="w-2 h-2 bg-[#2563EB]/30 rounded-full animate-bounce delay-200" />
        </div>
      </div>
    );
  }

  if (withdrawals.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-[#EFF6FF] flex items-center justify-center">
          <Wallet size={16} className="text-[#2563EB]" />
        </div>
        <h3 className="text-sm font-bold">Recent Withdrawals</h3>
        <span className="text-xs text-[#6B7280] ml-auto">Live</span>
        <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
      </div>

      <div className="space-y-3">
        {withdrawals.map((w) => (
          <div
            key={w.id}
            className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F8FAFC] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center text-white text-xs font-bold">
                {w.displayName}
              </div>
              <div>
                <p className="text-sm font-medium text-[#111827]">
                  {w.displayName} withdrew {w.amount.toLocaleString()}{' '}
                  {w.currency}
                </p>
                <p className="text-xs text-[#6B7280]">{w.timeAgo}</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-[#22C55E]">
              ✓ Completed
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-[#6B7280] text-center mt-4 border-t border-[#F3F4F6] pt-4">
        Showing recent withdrawals from Boostly users
      </p>
    </div>
  );
}

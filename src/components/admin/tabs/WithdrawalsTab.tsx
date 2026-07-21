// src/components/admin/tabs/WithdrawalsTab.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Clock,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface PendingWithdrawal {
  id: string;
  userName: string;
  method: string;
  date: string;
  amount: number;
}

export function WithdrawalsTab() {
  const [withdrawals, setWithdrawals] = useState<PendingWithdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/withdrawals');
      const data = await response.json();
      setWithdrawals(data.withdrawals || []);
    } catch (error) {
      console.error('Failed to fetch withdrawals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await fetch(`/api/admin/withdrawals/${id}/approve`, { method: 'POST' });
      fetchWithdrawals();
    } catch {
      alert('Failed to approve withdrawal');
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;
    try {
      await fetch(`/api/admin/withdrawals/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      fetchWithdrawals();
    } catch {
      alert('Failed to reject withdrawal');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 size={32} className="animate-spin text-[#2563EB]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">
          Pending Withdrawals
        </h3>
        <button
          onClick={fetchWithdrawals}
          className="text-sm font-semibold text-[#2563EB] dark:text-[#60A5FA] hover:underline flex items-center gap-1"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {withdrawals.length === 0 ? (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <p className="text-[#64748B] dark:text-[#94A3B8] font-medium">
            No pending withdrawals
          </p>
          <p className="text-sm text-[#94A3B8] dark:text-[#64748B] mt-1">
            All withdrawal requests have been processed
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {withdrawals.map((withdrawal) => (
            <div
              key={withdrawal.id}
              className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm p-5 hover:border-[#2563EB] dark:hover:border-[#60A5FA] transition-colors"
            >
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#60A5FA] to-[#2563EB] flex items-center justify-center text-white text-sm font-bold">
                      {withdrawal.userName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#0F172A] dark:text-white">
                        {withdrawal.userName}
                      </p>
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                        {withdrawal.method}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-2">
                    🕐 {formatDate(withdrawal.date)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-extrabold text-[#2563EB] dark:text-[#60A5FA]">
                    {formatCurrency(withdrawal.amount)}
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-[#FFFBEB] dark:bg-[#F59E0B]/20 text-[#F59E0B] dark:text-[#FBBF24] px-3 py-1 rounded-full">
                    <Clock size={12} /> Pending
                  </span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-[#22C55E] text-white text-sm font-bold hover:bg-[#16A34A] transition-colors"
                    onClick={() => handleApprove(withdrawal.id)}
                  >
                    Approve
                  </button>
                  <button
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-[#EF4444] text-white text-sm font-bold hover:bg-[#DC2626] transition-colors"
                    onClick={() => handleReject(withdrawal.id)}
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// src/app/admin/withdrawals/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Wallet,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Search,
  Download,
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { StatCard } from '@/components/admin/StatCard';

interface WithdrawalSummary {
  id: string;
  userName: string;
  amount: number;
  method: string;
  status: string;
  date: string;
  phoneNumber?: string | null;
  bankAccount?: string | null;
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');

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
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="animate-spin text-[#2563EB]" />
      </div>
    );
  }

  const filteredWithdrawals = withdrawals.filter((w) => {
    if (filter === 'all') return true;
    return w.status === filter;
  });

  const stats = {
    total: withdrawals.length,
    pending: withdrawals.filter((w) => w.status === 'pending').length,
    completed: withdrawals.filter((w) => w.status === 'completed').length,
    failed: withdrawals.filter((w) => w.status === 'failed').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white">
            Withdrawals
          </h1>
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
            Manage all withdrawal requests
          </p>
        </div>
        <button className="px-4 py-2.5 rounded-xl border border-[#F1F5F9] dark:border-[#334155] text-sm font-medium text-[#64748B] dark:text-[#94A3B8] hover:border-[#2563EB] transition-colors flex items-center gap-2">
          <Download size={16} />
          Export
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total"
          value={stats.total}
          icon={<Wallet size={20} />}
          color="blue"
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          icon={<Clock size={20} />}
          color="yellow"
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          icon={<CheckCircle size={20} />}
          color="green"
        />
        <StatCard
          label="Failed"
          value={stats.failed}
          icon={<XCircle size={20} />}
          color="red"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          className="px-4 py-2.5 border border-[#F1F5F9] dark:border-[#334155] rounded-xl text-sm bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-white focus:border-[#2563EB] outline-none"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
        <div className="flex-1 min-w-[200px] relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
          />
          <input
            type="text"
            placeholder="Search withdrawals..."
            className="w-full pl-10 pr-4 py-2.5 border border-[#F1F5F9] dark:border-[#334155] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all text-sm bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-white placeholder:text-[#94A3B8]"
          />
        </div>
      </div>

      {/* Withdrawals List */}
      <div className="space-y-3">
        {filteredWithdrawals.length === 0 ? (
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm p-8 text-center">
            <div className="text-6xl mb-4">💰</div>
            <p className="text-[#64748B] dark:text-[#94A3B8] font-medium">
              No withdrawals found
            </p>
            <p className="text-sm text-[#94A3B8] dark:text-[#64748B] mt-1">
              All withdrawal requests have been processed
            </p>
          </div>
        ) : (
          filteredWithdrawals.map((withdrawal) => (
            <div
              key={withdrawal.id}
              className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm p-4 hover:border-[#2563EB] transition-all"
            >
              <div className="flex flex-wrap items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#60A5FA] to-[#2563EB] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {withdrawal.userName?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-bold text-[#0F172A] dark:text-white">
                      {withdrawal.userName}
                    </p>
                    <span
                      className={cn(
                        'text-xs font-semibold px-3 py-1 rounded-full',
                        withdrawal.status === 'pending'
                          ? 'bg-[#FFFBEB] dark:bg-[#F59E0B]/20 text-[#F59E0B] dark:text-[#FBBF24]'
                          : withdrawal.status === 'processing'
                            ? 'bg-[#EFF6FF] dark:bg-[#2563EB]/20 text-[#2563EB] dark:text-[#60A5FA]'
                            : withdrawal.status === 'completed'
                              ? 'bg-[#F0FDF4] dark:bg-[#22C55E]/20 text-[#22C55E] dark:text-[#4ADE80]'
                              : 'bg-[#FEF2F2] dark:bg-[#EF4444]/20 text-[#EF4444] dark:text-[#F87171]',
                      )}
                    >
                      {withdrawal.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                      {withdrawal.method}
                    </span>
                    <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                      {formatDate(withdrawal.date)}
                    </span>
                    {withdrawal.phoneNumber && (
                      <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                        📱 {withdrawal.phoneNumber}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-extrabold text-[#0F172A] dark:text-white">
                    {formatCurrency(withdrawal.amount)}
                  </p>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                    RWF
                  </p>
                </div>
                {withdrawal.status === 'pending' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(withdrawal.id)}
                      className="px-4 py-2 rounded-xl bg-[#22C55E] text-white text-sm font-bold hover:bg-[#16A34A] transition-colors flex items-center gap-1"
                    >
                      <CheckCircle size={14} />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(withdrawal.id)}
                      className="px-4 py-2 rounded-xl bg-[#EF4444] text-white text-sm font-bold hover:bg-[#DC2626] transition-colors flex items-center gap-1"
                    >
                      <XCircle size={14} />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

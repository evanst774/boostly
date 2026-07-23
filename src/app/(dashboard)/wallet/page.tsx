// src/app/(dashboard)/wallet/page.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowUpRight,
  ArrowDownRight,
  History,
  TrendingUp,
  Gift,
  ChevronRight,
  Copy,
  Check,
  Eye,
  EyeOff,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface UnifiedWalletData {
  wallet: {
    fiat: {
      balance: number;
      totalEarned: number;
      totalWithdrawn: number;
      pendingWithdrawal: number;
    };
    crypto: Array<{
      currency: string;
      balance: number;
      address: string;
      network: string;
      usdValue: number;
      rwfValue: number;
      isDefault: boolean;
    }>;
    totals: {
      totalBalanceRWF: number;
      totalBalanceUSD: number;
      cryptoTotalUSD: number;
      cryptoTotalRWF: number;
    };
    rates: Array<{
      currency: string;
      usdRate: number;
      rwfRate: number;
      change24h: number;
    }>;
  };
  transactions: Array<{
    id: string;
    type: 'fiat' | 'crypto';
    category: 'credit' | 'debit';
    amount: number;
    currency: string;
    description: string;
    status: string;
    createdAt: string;
  }>;
  stats: {
    todayEarnings: number;
    monthlyEarnings: number;
    totalEarnings: number;
  };
}

// Withdrawal Activity Types
interface WithdrawalActivityItem {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  currency: string;
  method: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  requestedAt: string;
  completedAt?: string;
  timeAgo: string;
  formattedAmount: string;
  reference?: string;
  failureReason?: string;
}

interface WithdrawalStats {
  totalWithdrawn: number;
  pendingCount: number;
  completedCount: number;
  failedCount: number;
  recentWithdrawals: WithdrawalActivityItem[];
}

export default function WalletPage() {
  const router = useRouter();
  const [data, setData] = useState<UnifiedWalletData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [copied, setCopied] = useState(false);

  // Withdrawal activity states
  const [withdrawals, setWithdrawals] = useState<WithdrawalActivityItem[]>([]);
  const [withdrawalStats, setWithdrawalStats] =
    useState<WithdrawalStats | null>(null);
  const [isWithdrawalsLoading, setIsWithdrawalsLoading] = useState(true);
  const [withdrawalFilter, setWithdrawalFilter] = useState<
    'all' | 'pending' | 'completed' | 'failed'
  >('all');

  // Fetch wallet data - wrapped in useCallback
  const fetchWalletData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/wallet?limit=5');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch withdrawal activity - wrapped in useCallback with dependency on withdrawalFilter
  const fetchWithdrawalActivity = useCallback(async () => {
    setIsWithdrawalsLoading(true);
    try {
      const params = new URLSearchParams();
      if (withdrawalFilter !== 'all') params.append('status', withdrawalFilter);
      params.append('limit', '10');

      const response = await fetch(
        `/api/wallet/withdrawals/activity?${params}`,
      );
      const result = await response.json();
      setWithdrawals(result.activities || []);
      setWithdrawalStats(result.stats);
    } catch (error) {
      console.error('Failed to fetch withdrawal activity:', error);
    } finally {
      setIsWithdrawalsLoading(false);
    }
  }, [withdrawalFilter]); // Added withdrawalFilter as dependency

  // Initial load - now includes fetchWithdrawalActivity in dependencies
  useEffect(() => {
    fetchWalletData();
    fetchWithdrawalActivity();
  }, [fetchWalletData, fetchWithdrawalActivity]); // Added both functions

  // Fetch when filter changes - now uses fetchWithdrawalActivity
  useEffect(() => {
    fetchWithdrawalActivity();
  }, [fetchWithdrawalActivity]); // Now depends on the memoized function

  const handleCopyAddress = (address: string) => {
    navigator.clipboard?.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock size={14} className="text-[#F59E0B]" />;
      case 'PROCESSING':
        return <Loader2 size={14} className="text-[#2563EB] animate-spin" />;
      case 'COMPLETED':
        return <CheckCircle2 size={14} className="text-[#22C55E]" />;
      case 'FAILED':
        return <XCircle size={14} className="text-[#EF4444]" />;
      default:
        return <Clock size={14} className="text-[#6B7280]" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]';
      case 'PROCESSING':
        return 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]';
      case 'COMPLETED':
        return 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]';
      case 'FAILED':
        return 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]';
      default:
        return 'bg-[#F8FAFC] text-[#6B7280] border-[#E5E7EB]';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#2563EB]/20 border-4 border-[#2563EB] border-t-transparent animate-spin" />
          <p className="text-[#6B7280]">Loading wallet...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-[#6B7280]">No wallet data available</p>
      </div>
    );
  }

  const { fiat, crypto, totals } = data.wallet;
  const transactions = data.transactions || [];

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Wallet</h1>
          <p className="text-sm text-[#6B7280]">
            Manage your earnings and withdrawals
          </p>
        </div>
        <button
          className="bg-[#2563EB] text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-[#1D4ED8] transition-colors"
          onClick={() => router.push('/wallet/withdraw')}
        >
          Withdraw Funds
        </button>
      </div>

      {/* Balance Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-[#3B82F6] p-6 text-white shadow-lg shadow-blue-500/25">
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 -left-10 w-40 h-40 rounded-full bg-white/5" />

        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <p className="text-sm text-white/75">Total Balance</p>
            <button
              onClick={() => setBalanceVisible(!balanceVisible)}
              className="text-white/75 hover:text-white transition-colors"
            >
              {balanceVisible ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>
          <p className="text-4xl font-extrabold tracking-tight mt-1">
            {balanceVisible ? formatCurrency(totals.totalBalanceRWF) : '••••••'}
          </p>
          <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-500/30 text-emerald-300 px-3 py-1 rounded-full mt-2">
            <ArrowUpRight size={12} />+
            {formatCurrency(data.stats.todayEarnings)} today
          </span>

          <div className="flex gap-8 mt-5 pt-5 border-t border-white/15">
            <div>
              <p className="text-xs text-white/70">Total Earned</p>
              <p className="text-lg font-bold">
                {formatCurrency(fiat.totalEarned)}
              </p>
            </div>
            <div>
              <p className="text-xs text-white/70">Withdrawn</p>
              <p className="text-lg font-bold">
                {formatCurrency(fiat.totalWithdrawn)}
              </p>
            </div>
            <div>
              <p className="text-xs text-white/70">Pending</p>
              <p className="text-lg font-bold">
                {formatCurrency(fiat.pendingWithdrawal)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm p-4 text-center">
          <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center mx-auto mb-2">
            <TrendingUp size={18} className="text-[#2563EB]" />
          </div>
          <p className="text-lg font-extrabold text-[#2563EB]">+40 RWF</p>
          <p className="text-xs text-[#6B7280]">Video Reward</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm p-4 text-center">
          <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] flex items-center justify-center mx-auto mb-2">
            <Gift size={18} className="text-[#22C55E]" />
          </div>
          <p className="text-lg font-extrabold text-[#22C55E]">+50 RWF</p>
          <p className="text-xs text-[#6B7280]">Game Reward</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm p-4 text-center">
          <div className="w-10 h-10 rounded-xl bg-[#FEF2F2] flex items-center justify-center mx-auto mb-2">
            <ArrowDownRight size={18} className="text-[#EF4444]" />
          </div>
          <p className="text-lg font-extrabold text-[#EF4444]">-5,000 RWF</p>
          <p className="text-xs text-[#6B7280]">Withdrawal</p>
        </div>
      </div>

      {/* Crypto Balances */}
      <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm p-5">
        <h3 className="text-sm font-bold mb-4">Crypto Balances</h3>
        <div className="space-y-3">
          {crypto.length === 0 ? (
            <p className="text-sm text-[#6B7280] text-center py-4">
              No crypto balances yet
            </p>
          ) : (
            crypto.map((cryptoItem) => (
              <div
                key={cryptoItem.currency}
                className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-lg">
                    ₿
                  </div>
                  <div>
                    <p className="text-sm font-bold">{cryptoItem.currency}</p>
                    <p className="text-xs text-[#6B7280]">
                      {cryptoItem.network || 'Network'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">
                    {cryptoItem.balance.toFixed(4)}
                  </p>
                  <p className="text-xs text-[#6B7280]">
                    ≈ {formatCurrency(cryptoItem.rwfValue)}
                  </p>
                </div>
                <button
                  className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8]"
                  onClick={() => handleCopyAddress(cryptoItem.address)}
                >
                  {copied ? (
                    <Check size={16} className="text-[#22C55E]" />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              </div>
            ))
          )}
        </div>
        <button
          className="w-full mt-4 text-sm font-semibold text-[#2563EB] border border-dashed border-[#2563EB] rounded-xl py-3 hover:bg-[#EFF6FF] transition-colors"
          onClick={() => router.push('/wallet/deposit')}
        >
          + Add Crypto
        </button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button
          className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm p-4 text-center hover:shadow-md transition-shadow"
          onClick={() => router.push('/wallet/withdraw')}
        >
          <div className="w-12 h-12 rounded-xl bg-[#2563EB]/10 flex items-center justify-center mx-auto mb-2">
            <ArrowUpRight size={22} className="text-[#2563EB]" />
          </div>
          <p className="text-sm font-bold">Withdraw</p>
          <p className="text-xs text-[#6B7280]">Withdraw funds</p>
        </button>
        <button
          className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm p-4 text-center hover:shadow-md transition-shadow"
          onClick={() => router.push('/wallet/history')}
        >
          <div className="w-12 h-12 rounded-xl bg-[#8B5CF6]/10 flex items-center justify-center mx-auto mb-2">
            <History size={22} className="text-[#8B5CF6]" />
          </div>
          <p className="text-sm font-bold">History</p>
          <p className="text-xs text-[#6B7280]">View transactions</p>
        </button>
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold">Recent Transactions</h3>
          <button
            className="text-xs font-semibold text-[#2563EB] flex items-center gap-1"
            onClick={() => router.push('/wallet/history')}
          >
            View all
            <ChevronRight size={14} />
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm overflow-hidden">
          {transactions.length === 0 ? (
            <p className="text-sm text-[#6B7280] text-center py-6">
              No transactions yet
            </p>
          ) : (
            transactions.slice(0, 5).map((tx, index) => (
              <div
                key={tx.id || index}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 hover:bg-[#F8FAFC] transition-colors',
                  index !== 4 && 'border-b border-[#F3F4F6]',
                )}
              >
                <div
                  className={cn(
                    'w-11 h-11 rounded-xl flex items-center justify-center',
                    tx.category === 'credit' ? 'bg-[#F0FDF4]' : 'bg-[#FEF2F2]',
                  )}
                >
                  {tx.category === 'credit' ? (
                    <ArrowUpRight size={18} className="text-[#22C55E]" />
                  ) : (
                    <ArrowDownRight size={18} className="text-[#EF4444]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#111827]">
                    {tx.description}
                  </p>
                  <p className="text-xs text-[#9CA3AF]">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      'text-sm font-bold',
                      tx.category === 'credit'
                        ? 'text-[#22C55E]'
                        : 'text-[#EF4444]',
                    )}
                  >
                    {tx.category === 'credit' ? '+' : '-'}
                    {tx.amount.toLocaleString()} {tx.currency}
                  </p>
                  <span
                    className={cn(
                      'text-[10px] font-semibold px-2 py-0.5 rounded-full text-white',
                      tx.status === 'COMPLETED' || tx.status === 'completed'
                        ? 'bg-[#22C55E]'
                        : tx.status === 'PENDING' || tx.status === 'pending'
                          ? 'bg-[#F59E0B]'
                          : 'bg-[#EF4444]',
                    )}
                  >
                    {tx.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ============================================
          WITHDRAWAL ACTIVITY SECTION
          ============================================ */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold">Withdrawal Activity</h3>
            <p className="text-xs text-[#6B7280]">
              Recent withdrawal requests and history
            </p>
          </div>
          <button
            className="p-2 rounded-xl hover:bg-[#F8FAFC] transition-colors"
            onClick={() => fetchWithdrawalActivity()}
            disabled={isWithdrawalsLoading}
          >
            <RefreshCw
              size={16}
              className={cn(
                'text-[#6B7280]',
                isWithdrawalsLoading && 'animate-spin',
              )}
            />
          </button>
        </div>

        {/* Withdrawal Stats Summary */}
        {withdrawalStats && (
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="bg-white rounded-xl border border-[#F3F4F6] shadow-sm p-3 text-center">
              <p className="text-sm font-extrabold text-[#2563EB]">
                {withdrawalStats.totalWithdrawn.toLocaleString()} RWF
              </p>
              <p className="text-[10px] text-[#6B7280]">Total Withdrawn</p>
            </div>
            <div className="bg-white rounded-xl border border-[#F3F4F6] shadow-sm p-3 text-center">
              <p className="text-sm font-extrabold text-[#F59E0B]">
                {withdrawalStats.pendingCount}
              </p>
              <p className="text-[10px] text-[#6B7280]">Pending</p>
            </div>
            <div className="bg-white rounded-xl border border-[#F3F4F6] shadow-sm p-3 text-center">
              <p className="text-sm font-extrabold text-[#22C55E]">
                {withdrawalStats.completedCount}
              </p>
              <p className="text-[10px] text-[#6B7280]">Completed</p>
            </div>
            <div className="bg-white rounded-xl border border-[#F3F4F6] shadow-sm p-3 text-center">
              <p className="text-sm font-extrabold text-[#EF4444]">
                {withdrawalStats.failedCount}
              </p>
              <p className="text-[10px] text-[#6B7280]">Failed</p>
            </div>
          </div>
        )}

        {/* Withdrawal Filter */}
        <div className="flex gap-1 bg-[#F8FAFC] rounded-xl p-1 border border-[#F3F4F6] mb-4">
          {(['all', 'pending', 'completed', 'failed'] as const).map(
            (status) => (
              <button
                key={status}
                className={cn(
                  'flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize',
                  withdrawalFilter === status
                    ? 'bg-white text-[#111827] shadow-sm'
                    : 'text-[#6B7280] hover:text-[#111827]',
                )}
                onClick={() => setWithdrawalFilter(status)}
              >
                {status}
              </button>
            ),
          )}
        </div>

        {/* Withdrawal List */}
        {isWithdrawalsLoading ? (
          <div className="flex items-center justify-center py-8 bg-white rounded-2xl border border-[#F3F4F6]">
            <Loader2 size={24} className="animate-spin text-[#2563EB]" />
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-2xl border border-[#F3F4F6]">
            <div className="text-4xl mb-3">🏦</div>
            <p className="text-[#6B7280] font-medium">No withdrawal activity</p>
            <p className="text-xs text-[#9CA3AF] mt-1">
              Your withdrawal requests will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {withdrawals.map((withdrawal) => (
              <div
                key={withdrawal.id}
                className="flex items-center gap-4 p-3 bg-white rounded-xl border border-[#F3F4F6] shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {getStatusIcon(withdrawal.status)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">
                      {withdrawal.formattedAmount}
                    </span>
                    <span className="text-xs text-[#6B7280]">
                      via {withdrawal.method.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-[#6B7280]">
                      {withdrawal.timeAgo}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                        getStatusColor(withdrawal.status),
                      )}
                    >
                      {withdrawal.status}
                    </span>
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right flex-shrink-0">
                  <p
                    className={cn(
                      'text-sm font-bold',
                      withdrawal.status === 'COMPLETED'
                        ? 'text-[#22C55E]'
                        : withdrawal.status === 'FAILED'
                          ? 'text-[#EF4444]'
                          : 'text-[#F59E0B]',
                    )}
                  >
                    {withdrawal.amount.toLocaleString()} {withdrawal.currency}
                  </p>
                  {withdrawal.completedAt && (
                    <p className="text-[10px] text-[#6B7280]">
                      {formatDistanceToNow(new Date(withdrawal.completedAt), {
                        addSuffix: true,
                      })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

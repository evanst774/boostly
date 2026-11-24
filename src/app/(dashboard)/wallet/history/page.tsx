// src/app/(dashboard)/wallet/history/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Search,
  Download,
  Video,
  Gamepad2,
  Gift,
  Users,
  Wallet,
  Award,
  Sparkles,
  CheckCircle2,
  Clock,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { cn, formatCurrency as formatMoney } from '@/lib/utils';
import { LOCALE_TAGS, useFormatNumber, useLocale, useT } from '@/lib/i18n';
import { common } from '@/lib/i18n/messages/common';
import { wallet } from '@/lib/i18n/messages/wallet';
import type { Transaction } from '@/lib/db/schema';

type TransactionType =
  | 'all'
  | 'earnings'
  | 'withdrawals'
  | 'bonuses'
  | 'referrals';
type TransactionStatus = 'all' | 'completed' | 'pending' | 'failed';

type WalletKey = keyof typeof wallet.en;

const typeOptions: { value: TransactionType; label: WalletKey }[] = [
  { value: 'all', label: 'all' },
  { value: 'earnings', label: 'earnings' },
  { value: 'withdrawals', label: 'withdrawals' },
  { value: 'bonuses', label: 'bonuses' },
  { value: 'referrals', label: 'referrals' },
];

const statusOptions: { value: TransactionStatus; label: WalletKey }[] = [
  { value: 'all', label: 'all' },
  { value: 'completed', label: 'completed' },
  { value: 'pending', label: 'pending' },
  { value: 'failed', label: 'failed' },
];

// Map transaction types to display icons
const iconMap: Record<string, { icon: LucideIcon; bg: string; color: string }> = {
  video: { icon: Video, bg: 'bg-[#EFF6FF]', color: 'text-[#2563EB]' },
  game: { icon: Gamepad2, bg: 'bg-[#F0FDF4]', color: 'text-[#22C55E]' },
  bonus: { icon: Gift, bg: 'bg-[#FFFBEB]', color: 'text-[#F59E0B]' },
  referral: { icon: Users, bg: 'bg-[#F5F3FF]', color: 'text-[#8B5CF6]' },
  withdrawal: { icon: Wallet, bg: 'bg-[#FEF2F2]', color: 'text-[#EF4444]' },
  badge: { icon: Award, bg: 'bg-[#F5F3FF]', color: 'text-[#8B5CF6]' },
  subscription: { icon: Sparkles, bg: 'bg-[#EFF6FF]', color: 'text-[#2563EB]' },
};

const statusMap: Record<string, { label: WalletKey; icon: LucideIcon; color: string }> = {
  completed: { label: 'done', icon: CheckCircle2, color: 'bg-[#22C55E]' },
  pending: { label: 'pending', icon: Clock, color: 'bg-[#F59E0B]' },
  failed: { label: 'failed', icon: XCircle, color: 'bg-[#EF4444]' },
};

export default function TransactionHistoryPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<TransactionType>('all');
  const [selectedStatus, setSelectedStatus] =
    useState<TransactionStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const t = useT(wallet);
  const tc = useT(common);
  const fmt = useFormatNumber();
  const { locale } = useLocale();
  const tag = LOCALE_TAGS[locale];
  const formatCurrency = (n: number) => formatMoney(n, 'RWF', { locale: tag });
  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString(tag, { month: 'short', day: '2-digit', year: 'numeric' }) : '—';

  const { data, isLoading, totalPages } = useTransactions({
    type: selectedType,
    status: selectedStatus,
    search: searchQuery,
    page,
    limit: 10,
  });

  const transactions = data?.transactions || [];
  const summary = data?.summary || {
    totalEarned: 0,
    totalWithdrawn: 0,
    pending: 0,
  };

  // Group transactions by date using createdAt
  const groupedTransactions = transactions.reduce<
    Record<string, Transaction[]>
  >((groups, tx) => {
    const date = new Date(tx.createdAt).toDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(tx);
    return groups;
  }, {});

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          className="w-10 h-10 rounded-xl border border-[#F3F4F6] flex items-center justify-center hover:border-[#2563EB] transition-colors"
          onClick={() => router.back()}
          aria-label={tc('back')}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold">{t('historyTitle')}</h1>
          <p className="text-sm text-[#6B7280]">{t('historySubtitle')}</p>
        </div>
        <button className="ml-auto text-sm font-semibold text-[#2563EB] flex items-center gap-1 hover:underline">
          <Download size={16} />
          {t('export')}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm p-4 text-center">
          <p className="text-xs text-[#6B7280]">{t('totalEarned')}</p>
          <p className="text-xl font-extrabold text-[#22C55E]">
            {formatCurrency(summary.totalEarned)}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm p-4 text-center">
          <p className="text-xs text-[#6B7280]">{t('withdrawn')}</p>
          <p className="text-xl font-extrabold text-[#EF4444]">
            {formatCurrency(summary.totalWithdrawn)}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm p-4 text-center">
          <p className="text-xs text-[#6B7280]">{t('pending')}</p>
          <p className="text-xl font-extrabold text-[#F59E0B]">
            {formatCurrency(summary.pending)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm p-4">
        {/* Search */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
          />
          <input
            type="text"
            placeholder={t('searchTx')}
            className="w-full pl-11 pr-4 py-2.5 border border-[#F3F4F6] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mt-4">
          {typeOptions.map((option) => (
            <button
              key={option.value}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-semibold transition-all',
                selectedType === option.value
                  ? 'bg-[#2563EB] text-white'
                  : 'bg-[#F8FAFC] text-[#6B7280] hover:bg-[#F3F4F6]',
              )}
              onClick={() => setSelectedType(option.value)}
            >
              {t(option.label)}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex flex-wrap gap-2 mt-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-semibold transition-all',
                selectedStatus === option.value
                  ? 'bg-[#2563EB] text-white'
                  : 'bg-[#F8FAFC] text-[#6B7280] hover:bg-[#F3F4F6]',
              )}
              onClick={() => setSelectedStatus(option.value)}
            >
              {t(option.label)}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-[#2563EB] border-t-transparent rounded-full" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-[#F8FAFC] flex items-center justify-center mx-auto mb-4">
              <Wallet size={24} className="text-[#9CA3AF]" />
            </div>
            <p className="text-[#6B7280] font-medium">{t('noTx')}</p>
            <p className="text-sm text-[#9CA3AF] mt-1">
              {t('noTxHint')}
            </p>
          </div>
        ) : (
          <>
            {/* Group by date */}
            {Object.entries(groupedTransactions).map(([date, txs]) => (
              <div key={date}>
                <div className="px-4 py-2 bg-[#F8FAFC] border-b border-[#F3F4F6]">
                  <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                    {date === new Date().toDateString()
                      ? t('today')
                      : new Date(date).toLocaleDateString(tag, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                {txs.map((tx: Transaction, index: number) => {
                  // Determine transaction type for icon
                  const txType = tx.type?.toLowerCase() || 'unknown';
                  const IconComponent = iconMap[txType]?.icon || Wallet;
                  const iconStyle = iconMap[txType] || {
                    bg: 'bg-[#F8FAFC]',
                    color: 'text-[#6B7280]',
                  };
                  const statusKey = tx.status?.toLowerCase() || 'completed';
                  const statusStyle =
                    statusMap[statusKey] || statusMap.completed;
                  const StatusIcon = statusStyle.icon;
                  const isPositive = tx.type === 'CREDIT';

                  return (
                    <div
                      key={tx.id || index}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 hover:bg-[#F8FAFC] transition-colors',
                        index !== txs.length - 1 && 'border-b border-[#F3F4F6]',
                      )}
                    >
                      <div
                        className={cn(
                          'w-11 h-11 rounded-xl flex items-center justify-center',
                          iconStyle.bg,
                        )}
                      >
                        <IconComponent size={18} className={iconStyle.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#111827]">
                          {tx.description}
                        </p>
                        <p className="text-xs text-[#9CA3AF]">
                          {formatDate(tx.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={cn(
                            'text-sm font-bold',
                            isPositive ? 'text-[#22C55E]' : 'text-[#EF4444]',
                          )}
                        >
                          {isPositive ? '+' : ''}
                          {tc('rwf', { amount: fmt(tx.amount) })}
                        </p>
                        <span
                          className={cn(
                            'text-[10px] font-semibold px-2 py-0.5 rounded-full text-white inline-flex items-center gap-1',
                            statusStyle.color,
                          )}
                        >
                          <StatusIcon size={10} />
                          {t(statusStyle.label)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            className="px-4 py-2 rounded-xl border border-[#F3F4F6] hover:border-[#2563EB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            {t('previous')}
          </button>
          <span className="text-sm text-[#6B7280]">
            {t('pageOf', { page, total: totalPages })}
          </span>
          <button
            className="px-4 py-2 rounded-xl border border-[#F3F4F6] hover:border-[#2563EB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            {t('next')}
          </button>
        </div>
      )}
    </div>
  );
}

// src/components/dashboard/TransactionList.tsx
import {
  Video,
  Gamepad2,
  Gift,
  Users,
  Wallet,
  CheckCircle2,
  Clock,
  XCircle,
  Award,
  Sparkles,
  Coins,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Transaction {
  id: string;
  type:
    | 'video'
    | 'game'
    | 'bonus'
    | 'referral'
    | 'withdrawal'
    | 'badge'
    | 'subscription'
    | 'reward'
    | 'earning';
  description: string;
  date: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
}

interface TransactionListProps {
  transactions: Transaction[];
}

const iconMap = {
  video: {
    icon: Video,
    bg: 'bg-[#EFF6FF] dark:bg-[#2563EB]/20',
    color: 'text-[#2563EB] dark:text-[#60A5FA]',
  },
  game: {
    icon: Gamepad2,
    bg: 'bg-[#F0FDF4] dark:bg-[#22C55E]/20',
    color: 'text-[#22C55E] dark:text-[#4ADE80]',
  },
  bonus: {
    icon: Gift,
    bg: 'bg-[#FFFBEB] dark:bg-[#F59E0B]/20',
    color: 'text-[#F59E0B] dark:text-[#FBBF24]',
  },
  referral: {
    icon: Users,
    bg: 'bg-[#F5F3FF] dark:bg-[#8B5CF6]/20',
    color: 'text-[#8B5CF6] dark:text-[#A78BFA]',
  },
  withdrawal: {
    icon: Wallet,
    bg: 'bg-[#FEF2F2] dark:bg-[#EF4444]/20',
    color: 'text-[#EF4444] dark:text-[#F87171]',
  },
  badge: {
    icon: Award,
    bg: 'bg-[#F5F3FF] dark:bg-[#8B5CF6]/20',
    color: 'text-[#8B5CF6] dark:text-[#A78BFA]',
  },
  subscription: {
    icon: Sparkles,
    bg: 'bg-[#EFF6FF] dark:bg-[#2563EB]/20',
    color: 'text-[#2563EB] dark:text-[#60A5FA]',
  },
  reward: {
    icon: Coins,
    bg: 'bg-[#FFFBEB] dark:bg-[#F59E0B]/20',
    color: 'text-[#F59E0B] dark:text-[#FBBF24]',
  },
  earning: {
    icon: TrendingUp,
    bg: 'bg-[#F0FDF4] dark:bg-[#22C55E]/20',
    color: 'text-[#22C55E] dark:text-[#4ADE80]',
  },
};

const statusMap = {
  completed: {
    label: 'Done',
    icon: CheckCircle2,
    color: 'bg-[#22C55E] dark:bg-[#22C55E]',
  },
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'bg-[#F59E0B] dark:bg-[#F59E0B]',
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    color: 'bg-[#EF4444] dark:bg-[#EF4444]',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'bg-[#6B7280] dark:bg-[#6B7280]',
  },
};

export function TransactionList({ transactions }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm p-6 text-center">
        <p className="text-sm text-[#64748B] dark:text-[#94A3B8] font-outfit">
          No recent transactions
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm overflow-hidden">
      {transactions.map((tx, index) => {
        const IconComponent = iconMap[tx.type]?.icon || Wallet;
        const iconStyle = iconMap[tx.type] || {
          bg: 'bg-[#F8FAFC] dark:bg-[#334155]',
          color: 'text-[#6B7280] dark:text-[#94A3B8]',
        };
        const statusStyle = statusMap[tx.status] || statusMap.completed;
        const StatusIcon = statusStyle.icon;
        const isPositive = tx.amount > 0;

        return (
          <div
            key={tx.id}
            className={cn(
              'flex items-center gap-3 px-4 py-2.5 hover:bg-[#F8FAFC] dark:hover:bg-[#334155] transition-colors',
              index !== transactions.length - 1 &&
                'border-b border-[#F1F5F9] dark:border-[#334155]',
            )}
          >
            <div
              className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                iconStyle.bg,
              )}
            >
              <IconComponent size={15} className={iconStyle.color} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#0F172A] dark:text-white font-outfit">
                {tx.description}
              </p>
              <p className="text-[10px] text-[#94A3B8] dark:text-[#64748B]">
                {tx.date}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p
                className={cn(
                  'text-xs font-bold',
                  isPositive
                    ? 'text-[#22C55E] dark:text-[#4ADE80]'
                    : 'text-[#EF4444] dark:text-[#F87171]',
                )}
              >
                {isPositive ? '+' : ''}
                {tx.amount.toLocaleString()} RWF
              </p>
              <span
                className={cn(
                  'text-[8px] font-semibold px-1.5 py-0.5 rounded-full text-white inline-flex items-center gap-0.5',
                  statusStyle.color,
                )}
              >
                <StatusIcon size={8} />
                {statusStyle.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

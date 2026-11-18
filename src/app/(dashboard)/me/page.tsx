// src/app/(dashboard)/me/page.tsx
//
// The "Me" tab: profile plus everything that isn't Home / Earn / Wallet /
// Plans, as one list (like an app's account screen).
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  BadgeCheck,
  ChevronRight,
  Crown,
  HelpCircle,
  LogOut,
  Settings,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

const initials = (name?: string | null) =>
  (name || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

interface Row {
  href: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  tint: string;
  count?: number;
}

function Group({ rows }: { rows: Row[] }) {
  return (
    <ul className="overflow-hidden rounded-2xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] divide-y divide-[#F1F5F9] dark:divide-[#334155]">
      {rows.map(({ href, label, hint, icon: Icon, tint, count }) => (
        <li key={href}>
          <Link
            href={href}
            className="flex items-center gap-3 px-4 py-3.5 active:bg-[#F8FAFC] dark:active:bg-[#0F172A]/40 hover:bg-[#F8FAFC] dark:hover:bg-[#0F172A]/40 transition-colors"
          >
            <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', tint)}>
              <Icon size={18} />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[15px] font-medium text-[#0F172A] dark:text-white">{label}</span>
              {hint && <span className="block text-xs text-[#64748B] dark:text-[#94A3B8] truncate">{hint}</span>}
            </span>
            {!!count && (
              <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#EF4444] text-white text-[11px] font-bold flex items-center justify-center">
                {count > 99 ? '99+' : count}
              </span>
            )}
            <ChevronRight size={18} className="text-[#CBD5E1] dark:text-[#475569]" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function MePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const isFree = !user?.plan || user.plan === 'Free';

  const signOut = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="mx-auto max-w-xl space-y-5 font-outfit">
      {/* Profile */}
      <section className="flex items-center gap-4 rounded-2xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] p-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#2563EB] text-lg font-bold text-white">
          {initials(user?.name)}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold text-[#0F172A] dark:text-white truncate">{user?.name || 'Your account'}</p>
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8] truncate">{user?.email}</p>
        </div>
        <Link
          href="/settings?tab=profile"
          className="shrink-0 rounded-full border border-[#E2E8F0] dark:border-[#334155] px-3 py-1.5 text-xs font-semibold text-[#0F172A] dark:text-white"
        >
          Edit
        </Link>
      </section>

      {/* Plan */}
      <Link
        href="/plans"
        className={cn(
          'flex items-center gap-3 rounded-2xl p-4 border',
          isFree
            ? 'border-[#FDE68A] bg-[#FFFBEB] dark:bg-[#F59E0B]/10 dark:border-[#F59E0B]/30'
            : 'border-[#BFDBFE] bg-[#EFF6FF] dark:bg-[#2563EB]/10 dark:border-[#2563EB]/30',
        )}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F59E0B] text-white">
          <Crown size={18} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[15px] font-bold text-[#0F172A] dark:text-white">
            {isFree ? 'Free plan' : `${user?.plan} plan`}
          </span>
          <span className="block text-xs text-[#64748B] dark:text-[#94A3B8]">
            {isFree ? 'Upgrade to earn more and withdraw every day' : 'You can withdraw every day'}
          </span>
        </span>
        <ChevronRight size={18} className="text-[#94A3B8]" />
      </Link>

      <Group
        rows={[
          { href: '/referrals', label: 'Invite friends', hint: 'Earn 18% of their first plan or badge', icon: Users, tint: 'bg-[#F5F3FF] text-[#7C3AED] dark:bg-[#8B5CF6]/15 dark:text-[#A78BFA]' },
          { href: '/badges', label: 'Badges', hint: 'Boost your task rewards', icon: BadgeCheck, tint: 'bg-[#FFFBEB] text-[#B45309] dark:bg-[#F59E0B]/15 dark:text-[#FBBF24]' },
          { href: '/notifications', label: 'Notifications', icon: Bell, tint: 'bg-[#EFF6FF] text-[#2563EB] dark:bg-[#2563EB]/15 dark:text-[#60A5FA]', count: unreadCount },
        ]}
      />

      <Group
        rows={[
          { href: '/settings?tab=profile', label: 'Account settings', icon: Settings, tint: 'bg-[#F1F5F9] text-[#475569] dark:bg-[#334155] dark:text-[#CBD5E1]' },
          { href: '/settings?tab=security', label: 'Security & 2FA', icon: ShieldCheck, tint: 'bg-[#F0FDF4] text-[#16A34A] dark:bg-[#22C55E]/15 dark:text-[#4ADE80]' },
          { href: '/help', label: 'Help & support', icon: HelpCircle, tint: 'bg-[#F1F5F9] text-[#475569] dark:bg-[#334155] dark:text-[#CBD5E1]' },
        ]}
      />

      <button
        type="button"
        onClick={signOut}
        className="w-full flex items-center justify-center gap-2 rounded-2xl border border-[#FECACA] dark:border-[#EF4444]/30 bg-white dark:bg-[#1E293B] py-3.5 text-[15px] font-semibold text-[#DC2626] dark:text-[#F87171] active:bg-[#FEF2F2]"
      >
        <LogOut size={18} /> Log out
      </button>
    </div>
  );
}

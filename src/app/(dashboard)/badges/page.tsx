// src/app/(dashboard)/badges/page.tsx
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Loader2, X } from 'lucide-react';
import { useBadges, type BadgeTier } from '@/hooks/useBadges';
import { cn } from '@/lib/utils';

interface BadgeCardData {
  id: string | null; // null = fallback display only, not purchasable
  tier: BadgeTier;
  name: string;
  emoji: string;
  boost: string;
  price: number;
  oneTimeReward: number;
  features: string[];
}

const rwf = (n: number) => `${Math.round(n).toLocaleString('en-US')} RWF`;

const TIER_STYLE: Record<BadgeTier, { border: string; bg: string; emoji: string }> = {
  SILVER: { border: 'border-[#94A3B8]', bg: 'bg-[#F8FAFC] dark:bg-[#94A3B8]/10', emoji: '🥈' },
  GOLD: { border: 'border-[#F59E0B]', bg: 'bg-[#FFFBEB] dark:bg-[#F59E0B]/10', emoji: '🥇' },
  PLATINUM: { border: 'border-[#8B5CF6]', bg: 'bg-[#F5F3FF] dark:bg-[#8B5CF6]/10', emoji: '💎' },
};

// Shown only when the badges API returns nothing (display only).
const FALLBACK_BADGES: BadgeCardData[] = [
  { id: null, tier: 'SILVER', name: 'Silver Badge', emoji: '🥈', boost: '+15%', price: 5000, oneTimeReward: 5000, features: ['+15% earnings boost', 'Priority support'] },
  { id: null, tier: 'GOLD', name: 'Gold Badge', emoji: '🥇', boost: '+30%', price: 10000, oneTimeReward: 10000, features: ['+30% earnings boost', 'VIP support', 'Exclusive games'] },
  { id: null, tier: 'PLATINUM', name: 'Platinum Badge', emoji: '💎', boost: '+30%', price: 20000, oneTimeReward: 20000, features: ['+30% earnings boost', 'Premium VIP support', 'Exclusive games', 'Faster withdrawals'] },
];

export default function BadgesPage() {
  const { data, isLoading, refetch } = useBadges();
  const [selected, setSelected] = useState<BadgeCardData | null>(null);
  const [isBuying, setIsBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const activeBadge = data?.activeBadge ?? null;

  const badges = useMemo<BadgeCardData[]>(() => {
    const all = data?.allBadges ?? [];
    if (all.length === 0) return FALLBACK_BADGES;
    return all.map((b) => {
      const tier = b.tier as BadgeTier;
      return {
        id: b.id,
        tier,
        name: b.name,
        emoji: b.icon || TIER_STYLE[tier]?.emoji || '🏅',
        boost: `+${Math.round(b.earningsBoost * 100)}%`,
        price: b.price,
        oneTimeReward: b.oneTimeReward,
        features: (b.features ?? []) as string[],
      };
    });
  }, [data]);

  const handleConfirmPurchase = async () => {
    if (!selected?.id) return;
    setIsBuying(true);
    setError(null);
    try {
      const res = await fetch(`/api/badges/${selected.id}/purchase`, {
        method: 'POST',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Could not buy badge');
      setSuccess(`${selected.name} is active. ${selected.boost} boost applied to your earnings.`);
      setSelected(null);
      await refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not buy badge');
    } finally {
      setIsBuying(false);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="space-y-4 font-outfit">
        <div className="h-8 w-40 rounded-lg bg-[#F1F5F9] dark:bg-[#1E293B] animate-pulse" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-[#F1F5F9] dark:bg-[#1E293B] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 font-outfit">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] dark:text-white">
          Earning badges
        </h1>
        <p className="mt-1 text-sm text-[#64748B] dark:text-[#94A3B8]">
          A one-time purchase that boosts every reward you earn.{' '}
          <Link href="/plans" className="font-semibold text-[#2563EB] dark:text-[#60A5FA]">
            Looking for plans? See Plans →
          </Link>
        </p>
      </div>

      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] p-4 text-sm text-[#166534] dark:border-[#22C55E]/30 dark:bg-[#22C55E]/10 dark:text-[#4ADE80]">
          <Check size={18} className="mt-0.5 flex-shrink-0" />
          <p className="flex-1">{success}</p>
          <button type="button" onClick={() => setSuccess(null)} aria-label="Dismiss">
            <X size={16} />
          </button>
        </div>
      )}

      {activeBadge && (
        <div className="flex items-center gap-4 rounded-2xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] p-4">
          <span className="text-4xl">
            {TIER_STYLE[activeBadge.badge.tier as BadgeTier]?.emoji ?? '🏅'}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Your active badge</p>
            <p className="font-bold text-[#0F172A] dark:text-white">{activeBadge.badge.name}</p>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              +{Math.round(activeBadge.badge.earningsBoost * 100)}% on every reward · since{' '}
              {new Date(activeBadge.purchasedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {badges.map((badge) => {
          const isActive = activeBadge?.badge.tier === badge.tier;
          const style = TIER_STYLE[badge.tier];
          return (
            <div
              key={badge.tier}
              className={cn(
                'flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border-2 bg-white dark:bg-[#1E293B] p-4',
                isActive ? `${style?.border} ${style?.bg}` : 'border-[#E2E8F0] dark:border-[#334155]',
              )}
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <span className="text-4xl">{badge.emoji}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-[#0F172A] dark:text-white">{badge.name}</h3>
                    {isActive && (
                      <span className="rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[10px] font-bold text-[#15803D]">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#22C55E] dark:text-[#4ADE80] font-semibold">
                    {badge.boost} on every reward
                  </p>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                    {badge.features.slice(0, 3).join(' · ')}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                <p className="text-lg font-extrabold text-[#0F172A] dark:text-white tabular-nums">
                  {rwf(badge.price)}
                </p>
                {!isActive && (
                  <button
                    type="button"
                    disabled={!badge.id}
                    onClick={() => {
                      setError(null);
                      setSelected(badge);
                    }}
                    className="rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-bold text-white hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Buy badge
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:p-4"
          onClick={() => !isBuying && setSelected(null)}
        >
          <div
            className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-white dark:bg-[#1E293B] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#0F172A] dark:text-white">
                Buy {selected.name}
              </h2>
              <button type="button" onClick={() => setSelected(null)} disabled={isBuying} aria-label="Close" className="text-[#64748B]">
                <X size={20} />
              </button>
            </div>
            <div className="mt-4 space-y-2 rounded-xl bg-[#F8FAFC] dark:bg-[#0F172A] p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-[#64748B] dark:text-[#94A3B8]">Price</span>
                <span className="font-bold text-[#0F172A] dark:text-white">{rwf(selected.price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B] dark:text-[#94A3B8]">One-time reward</span>
                <span className="font-bold text-[#22C55E]">+{rwf(selected.oneTimeReward)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B] dark:text-[#94A3B8]">Paid from</span>
                <span className="font-semibold text-[#0F172A] dark:text-white">Wallet balance</span>
              </div>
            </div>
            {error && (
              <p className="mt-3 rounded-lg bg-[#FEF2F2] dark:bg-[#EF4444]/10 p-3 text-sm text-[#B91C1C] dark:text-[#FCA5A5]">
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={handleConfirmPurchase}
              disabled={isBuying}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] py-3 text-sm font-bold text-white hover:bg-[#1D4ED8] disabled:opacity-50"
            >
              {isBuying ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Processing…
                </>
              ) : (
                `Pay ${rwf(selected.price)}`
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

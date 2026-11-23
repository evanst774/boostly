// src/app/admin/subscriptions/plans/page.tsx
// Admin editor for subscription plans. Every plan, key, price and limit is
// managed here; nothing is tied to the default tiers.

'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  Eye,
  EyeOff,
  Layers,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Star,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { describeIntervalDays } from '@/lib/constants/payouts';
import {
  FREE_KEY,
  PlanEditor,
  formatRwf,
  type EditorMode,
  type Plan,
  type PlanPayload,
} from '@/components/admin/plans/PlanEditor';

// Accent per list position — purely decorative.
const ACCENTS = [
  '#64748B',
  '#2563EB',
  '#22C55E',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#EF4444',
];
const accentFor = (index: number) => ACCENTS[index % ACCENTS.length];

interface Toast {
  id: number;
  kind: 'success' | 'error';
  message: string;
}

async function readError(res: Response, fallback: string) {
  try {
    const data = await res.json();
    if (data && typeof data.error === 'string') return data.error;
  } catch {
    /* non-JSON body */
  }
  if (res.status === 403) return "You don't have permission to do that.";
  return fallback;
}

function withdrawLabel(plan: Plan) {
  const days =
    plan.withdrawalIntervalDays ?? (plan.tier === FREE_KEY ? 7 : 1);
  return describeIntervalDays(days);
}

function deleteBlockReason(plan: Plan): string | null {
  if (plan.tier === FREE_KEY) return 'The Free plan is the default and cannot be deleted.';
  if (plan.activeSubscribers > 0) {
    return `${plan.activeSubscribers} member${plan.activeSubscribers === 1 ? ' is' : 's are'} on this plan. Hide it instead so new members can't pick it.`;
  }
  return null;
}

// ─── Page ───────────────────────────────────────────────────────────

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorMode | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [toDelete, setToDelete] = useState<Plan | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((kind: Toast['kind'], message: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  const fetchPlans = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/subscriptions/plans?all=1', {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(await readError(res, 'Failed to load plans.'));
      const data = await res.json();
      setPlans(Array.isArray(data.plans) ? data.plans : []);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load plans.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const patchPlan = async (id: string, body: PlanPayload) => {
    const res = await fetch(`/api/subscriptions/plans/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await readError(res, 'Failed to update plan.'));
    return (await res.json()).plan as Plan;
  };

  // ─── Actions ─────────────────────────────────────────────────────

  const handleSave = async (payload: PlanPayload): Promise<string | null> => {
    if (!editor) return null;
    try {
      if (editor.kind === 'edit') {
        await patchPlan(editor.plan.id, payload);
        toast('success', `${payload.name ?? editor.plan.name} saved.`);
      } else {
        const res = await fetch('/api/subscriptions/plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await readError(res, 'Failed to create plan.'));
        toast('success', `${payload.name} created.`);
      }
      setEditor(null);
      await fetchPlans({ silent: true });
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : 'Failed to save plan.';
    }
  };

  const toggleActive = async (plan: Plan) => {
    if (plan.tier === FREE_KEY && plan.isActive) return;
    setBusyId(plan.id);
    try {
      await patchPlan(plan.id, { isActive: !plan.isActive });
      toast(
        'success',
        plan.isActive
          ? `${plan.name} is hidden from members.`
          : `${plan.name} is now offered to members.`,
      );
      await fetchPlans({ silent: true });
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to update plan.');
    } finally {
      setBusyId(null);
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= plans.length || reordering) return;
    setReordering(true);
    try {
      const a = plans[index];
      const b = plans[target];
      const orders = plans.map((p) => p.sortOrder);
      const clean =
        orders.every((o): o is number => o !== null) &&
        new Set(orders).size === orders.length;

      const updates: { id: string; sortOrder: number }[] = [];
      if (clean) {
        updates.push({ id: a.id, sortOrder: b.sortOrder as number });
        updates.push({ id: b.id, sortOrder: a.sortOrder as number });
      } else {
        // Normalise everything to index*10, with the two plans swapped.
        const next = [...plans];
        next[index] = b;
        next[target] = a;
        next.forEach((p, i) => {
          if (p.sortOrder !== i * 10) updates.push({ id: p.id, sortOrder: i * 10 });
        });
      }

      // Optimistic swap so the list responds immediately.
      setPlans((prev) => {
        const next = [...prev];
        next[index] = prev[target];
        next[target] = prev[index];
        return next;
      });

      for (const u of updates) await patchPlan(u.id, { sortOrder: u.sortOrder });
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to reorder plans.');
    } finally {
      await fetchPlans({ silent: true });
      setReordering(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/subscriptions/plans/${toDelete.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(await readError(res, 'Failed to delete plan.'));
      toast('success', `${toDelete.name} deleted.`);
      setToDelete(null);
      await fetchPlans({ silent: true });
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete plan.');
    } finally {
      setDeleting(false);
    }
  };

  const openDelete = (plan: Plan) => {
    setDeleteError(null);
    setToDelete(plan);
  };

  // ─── Render ──────────────────────────────────────────────────────

  const activeCount = plans.filter((p) => p.isActive).length;
  const subscriberCount = plans.reduce((s, p) => s + (p.activeSubscribers || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white">
            Subscription plans
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[#64748B] dark:text-[#94A3B8]">
            Create and tune every plan members can buy: price, daily task
            limits, earning ceiling, reward boost and how often they can
            withdraw. Changes apply immediately.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditor({ kind: 'create' })}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1D4ED8]"
        >
          <Plus size={18} />
          New plan
        </button>
      </div>

      {!loading && !loadError && plans.length > 0 && (
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#64748B] dark:text-[#94A3B8]">
          <span className="inline-flex items-center gap-1.5">
            <Layers size={15} /> {plans.length} plan{plans.length === 1 ? '' : 's'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Eye size={15} /> {activeCount} active · {plans.length - activeCount} hidden
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users size={15} /> {subscriberCount.toLocaleString('en-US')} active subscribers
          </span>
        </div>
      )}

      {loading ? (
        <ListSkeleton />
      ) : loadError ? (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white px-6 py-12 text-center dark:border-[#334155] dark:bg-[#1E293B]">
          <AlertCircle size={32} className="mx-auto text-[#EF4444]" />
          <p className="mt-3 font-semibold text-[#0F172A] dark:text-white">
            Couldn&apos;t load plans
          </p>
          <p className="mt-1 text-sm text-[#64748B] dark:text-[#94A3B8]">{loadError}</p>
          <button
            type="button"
            onClick={() => fetchPlans()}
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] px-4 py-2 text-sm font-medium text-[#0F172A] transition hover:bg-[#F8FAFC] dark:border-[#334155] dark:text-white dark:hover:bg-[#334155]"
          >
            <RefreshCw size={15} /> Try again
          </button>
        </div>
      ) : plans.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E2E8F0] bg-white px-6 py-14 text-center dark:border-[#334155] dark:bg-[#1E293B]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2563EB]/10 text-[#2563EB] dark:text-[#60A5FA]">
            <Layers size={22} />
          </div>
          <p className="mt-4 font-semibold text-[#0F172A] dark:text-white">No plans yet</p>
          <p className="mt-1 text-sm text-[#64748B] dark:text-[#94A3B8]">
            Start with a FREE plan (price 0), then add paid plans.
          </p>
          <button
            type="button"
            onClick={() => setEditor({ kind: 'create' })}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1D4ED8]"
          >
            <Plus size={16} /> Create first plan
          </button>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white dark:border-[#334155] dark:bg-[#1E293B] 2xl:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] dark:border-[#334155] dark:bg-[#0F172A]/40">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[#64748B] dark:text-[#94A3B8]">
                    <th className="w-24 px-4 py-3">Order</th>
                    <th className="px-4 py-3">Plan</th>
                    <th className="px-4 py-3">Price / month</th>
                    <th className="px-4 py-3">Max / day</th>
                    <th className="px-4 py-3" title="Videos · Games · Surveys">
                      Tasks / day
                    </th>
                    <th className="px-4 py-3">Boost</th>
                    <th className="px-4 py-3">Withdraw</th>
                    <th className="px-4 py-3">Subscribers</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#334155]">
                  {plans.map((plan, i) => (
                    <tr
                      key={plan.id}
                      className={cn(
                        'transition hover:bg-[#F8FAFC] dark:hover:bg-[#0F172A]/40',
                        !plan.isActive && 'opacity-70',
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span className="w-6 text-xs tabular-nums text-[#64748B] dark:text-[#94A3B8]">
                            {i + 1}
                          </span>
                          <MoveButtons
                            index={i}
                            total={plans.length}
                            disabled={reordering}
                            onMove={move}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <PlanName plan={plan} index={i} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-[#0F172A] dark:text-white">
                        {plan.priceMonthly === 0 ? 'Free' : formatRwf(plan.priceMonthly)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[#0F172A] dark:text-white">
                        {plan.dailyEarnings > 0 ? formatRwf(plan.dailyEarnings) : 'No max'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums text-[#0F172A] dark:text-white">
                        {plan.maxDailyVideos} · {plan.maxDailyGames} · {plan.maxDailySurveys}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[#0F172A] dark:text-white">
                        {formatBoost(plan.badgeBoost)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[#0F172A] dark:text-white">
                        {withdrawLabel(plan)}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-[#0F172A] dark:text-white">
                        {plan.activeSubscribers.toLocaleString('en-US')}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill active={plan.isActive} />
                      </td>
                      <td className="px-4 py-3">
                        <RowActions
                          plan={plan}
                          busy={busyId === plan.id}
                          onEdit={() => setEditor({ kind: 'edit', plan })}
                          onDuplicate={() => setEditor({ kind: 'create', source: plan })}
                          onToggle={() => toggleActive(plan)}
                          onDelete={() => openDelete(plan)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile / tablet cards */}
          <div className="space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0 2xl:hidden">
            {plans.map((plan, i) => (
              <div
                key={plan.id}
                className={cn(
                  'rounded-2xl border border-[#E2E8F0] bg-white p-4 dark:border-[#334155] dark:bg-[#1E293B]',
                  !plan.isActive && 'opacity-80',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <PlanName plan={plan} index={i} />
                  <StatusPill active={plan.isActive} />
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
                  <Stat label="Price / month">
                    {plan.priceMonthly === 0 ? 'Free' : formatRwf(plan.priceMonthly)}
                  </Stat>
                  <Stat label="Max / day">
                    {plan.dailyEarnings > 0 ? formatRwf(plan.dailyEarnings) : 'No max'}
                  </Stat>
                  <Stat label="Videos · Games · Surveys">
                    {plan.maxDailyVideos} · {plan.maxDailyGames} · {plan.maxDailySurveys}
                  </Stat>
                  <Stat label="Boost">{formatBoost(plan.badgeBoost)}</Stat>
                  <Stat label="Withdraw">{withdrawLabel(plan)}</Stat>
                  <Stat label="Subscribers">
                    {plan.activeSubscribers.toLocaleString('en-US')}
                  </Stat>
                </dl>
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#E2E8F0] pt-3 dark:border-[#334155]">
                  <div className="flex items-center gap-1">
                    <span className="mr-1 text-xs text-[#64748B] dark:text-[#94A3B8]">
                      #{i + 1}
                    </span>
                    <MoveButtons
                      index={i}
                      total={plans.length}
                      disabled={reordering}
                      onMove={move}
                    />
                  </div>
                  <RowActions
                    plan={plan}
                    busy={busyId === plan.id}
                    onEdit={() => setEditor({ kind: 'edit', plan })}
                    onDuplicate={() => setEditor({ kind: 'create', source: plan })}
                    onToggle={() => toggleActive(plan)}
                    onDelete={() => openDelete(plan)}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Create / edit drawer */}
      <AnimatePresence>
        {editor && (
          <PlanEditor
            key={editor.kind === 'edit' ? editor.plan.id : `new-${editor.source?.id ?? ''}`}
            mode={editor}
            plans={plans}
            onClose={() => setEditor(null)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {toDelete && (
          <DeleteConfirm
            plan={toDelete}
            deleting={deleting}
            error={deleteError}
            onCancel={() => !deleting && setToDelete(null)}
            onConfirm={confirmDelete}
            onHideInstead={async () => {
              const plan = toDelete;
              setToDelete(null);
              await toggleActive(plan);
            }}
          />
        )}
      </AnimatePresence>

      {/* Toasts */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className={cn(
                'pointer-events-auto flex items-start gap-2 rounded-xl border bg-white px-4 py-3 text-sm shadow-lg dark:bg-[#1E293B]',
                t.kind === 'success'
                  ? 'border-[#22C55E]/40 text-[#0F172A] dark:text-white'
                  : 'border-[#EF4444]/40 text-[#0F172A] dark:text-white',
              )}
            >
              {t.kind === 'success' ? (
                <Check size={16} className="mt-0.5 shrink-0 text-[#22C55E]" />
              ) : (
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-[#EF4444]" />
              )}
              <span className="flex-1">{t.message}</span>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => setToasts((all) => all.filter((x) => x.id !== t.id))}
                className="text-[#64748B] hover:text-[#0F172A] dark:text-[#94A3B8] dark:hover:text-white"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Pieces ─────────────────────────────────────────────────────────

function formatBoost(boost: number) {
  if (!boost) return '—';
  return `+${Math.round(boost * 1000) / 10}%`;
}

function PlanName({ plan, index }: { plan: Plan; index: number }) {
  const accent = accentFor(index);
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
        style={{ backgroundColor: `${accent}1F`, color: accent }}
      >
        {plan.name.trim().charAt(0).toUpperCase() || '?'}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-semibold text-[#0F172A] dark:text-white">
            {plan.name}
          </span>
          {plan.isPopular && (
            <Star
              size={14}
              className="shrink-0 fill-[#F59E0B] text-[#F59E0B]"
              aria-label="Most popular"
            />
          )}
        </div>
        <span className="font-mono text-[11px] text-[#64748B] dark:text-[#94A3B8]">
          {plan.tier}
        </span>
      </div>
    </div>
  );
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        active
          ? 'bg-[#22C55E]/10 text-[#15803D] dark:text-[#4ADE80]'
          : 'bg-[#64748B]/10 text-[#475569] dark:bg-[#94A3B8]/10 dark:text-[#94A3B8]',
      )}
    >
      <span
        className={cn('h-1.5 w-1.5 rounded-full', active ? 'bg-[#22C55E]' : 'bg-[#94A3B8]')}
      />
      {active ? 'Active' : 'Hidden'}
    </span>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] uppercase tracking-wide text-[#64748B] dark:text-[#94A3B8]">
        {label}
      </dt>
      <dd className="mt-0.5 truncate font-medium text-[#0F172A] dark:text-white">{children}</dd>
    </div>
  );
}

const iconBtn =
  'rounded-lg p-2 text-[#64748B] transition hover:bg-[#F1F5F9] hover:text-[#0F172A] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:text-[#94A3B8] dark:hover:bg-[#334155] dark:hover:text-white';

function MoveButtons({
  index,
  total,
  disabled,
  onMove,
}: {
  index: number;
  total: number;
  disabled: boolean;
  onMove: (index: number, dir: -1 | 1) => void;
}) {
  return (
    <>
      <button
        type="button"
        className={cn(iconBtn, 'p-1.5')}
        disabled={disabled || index === 0}
        onClick={() => onMove(index, -1)}
        aria-label="Move up"
        title="Move up"
      >
        <ArrowUp size={14} />
      </button>
      <button
        type="button"
        className={cn(iconBtn, 'p-1.5')}
        disabled={disabled || index === total - 1}
        onClick={() => onMove(index, 1)}
        aria-label="Move down"
        title="Move down"
      >
        <ArrowDown size={14} />
      </button>
    </>
  );
}

function RowActions({
  plan,
  busy,
  onEdit,
  onDuplicate,
  onToggle,
  onDelete,
}: {
  plan: Plan;
  busy: boolean;
  onEdit: () => void;
  onDuplicate: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const isFree = plan.tier === FREE_KEY;
  const hideLocked = isFree && plan.isActive;
  const deleteReason = deleteBlockReason(plan);
  return (
    <div className="flex items-center justify-end gap-0.5">
      <button type="button" className={iconBtn} onClick={onEdit} aria-label="Edit" title="Edit">
        <Pencil size={16} />
      </button>
      <button
        type="button"
        className={iconBtn}
        onClick={onDuplicate}
        aria-label="Duplicate"
        title="Duplicate"
      >
        <Copy size={16} />
      </button>
      <button
        type="button"
        className={iconBtn}
        onClick={onToggle}
        disabled={busy || hideLocked}
        aria-label={plan.isActive ? 'Hide' : 'Show'}
        title={
          hideLocked
            ? 'The Free plan is always offered'
            : plan.isActive
              ? 'Hide from members'
              : 'Offer to members'
        }
      >
        {busy ? (
          <Loader2 size={16} className="animate-spin" />
        ) : plan.isActive ? (
          <EyeOff size={16} />
        ) : (
          <Eye size={16} />
        )}
      </button>
      <button
        type="button"
        className={cn(iconBtn, 'hover:bg-[#EF4444]/10 hover:text-[#EF4444] dark:hover:bg-[#EF4444]/10 dark:hover:text-[#F87171]')}
        onClick={onDelete}
        disabled={isFree}
        aria-label="Delete"
        title={deleteReason ?? 'Delete'}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

function DeleteConfirm({
  plan,
  deleting,
  error,
  onCancel,
  onConfirm,
  onHideInstead,
}: {
  plan: Plan;
  deleting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
  onHideInstead: () => void;
}) {
  const blocked = deleteBlockReason(plan);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-[#0F172A]/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      <motion.div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-plan-title"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="relative w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-2xl dark:border-[#334155] dark:bg-[#1E293B]"
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
              blocked ? 'bg-[#F59E0B]/10 text-[#F59E0B]' : 'bg-[#EF4444]/10 text-[#EF4444]',
            )}
          >
            {blocked ? <AlertTriangle size={20} /> : <Trash2 size={20} />}
          </div>
          <div className="min-w-0">
            <h2
              id="delete-plan-title"
              className="text-base font-semibold text-[#0F172A] dark:text-white"
            >
              {blocked ? `${plan.name} can't be deleted` : `Delete ${plan.name}?`}
            </h2>
            <p className="mt-1 text-sm text-[#64748B] dark:text-[#94A3B8]">
              {blocked ??
                'This permanently removes the plan. Members will no longer see it. This cannot be undone.'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-3 py-2.5 text-sm text-[#B91C1C] dark:text-[#FCA5A5]">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="rounded-xl border border-[#E2E8F0] px-4 py-2.5 text-sm font-medium text-[#0F172A] transition hover:bg-[#F8FAFC] disabled:opacity-50 dark:border-[#334155] dark:text-white dark:hover:bg-[#334155]"
          >
            {blocked ? 'Close' : 'Cancel'}
          </button>
          {blocked ? (
            plan.isActive &&
            plan.tier !== FREE_KEY && (
              <button
                type="button"
                onClick={onHideInstead}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1D4ED8]"
              >
                <EyeOff size={15} /> Hide plan instead
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={onConfirm}
              disabled={deleting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#EF4444] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#DC2626] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deleting && <Loader2 size={15} className="animate-spin" />}
              {deleting ? 'Deleting…' : 'Delete plan'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading plans">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex animate-pulse items-center gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-4 dark:border-[#334155] dark:bg-[#1E293B]"
        >
          <div className="h-9 w-9 rounded-xl bg-[#E2E8F0] dark:bg-[#334155]" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-40 rounded bg-[#E2E8F0] dark:bg-[#334155]" />
            <div className="h-3 w-24 rounded bg-[#E2E8F0] dark:bg-[#334155]" />
          </div>
          <div className="hidden h-3.5 w-24 rounded bg-[#E2E8F0] dark:bg-[#334155] sm:block" />
          <div className="hidden h-3.5 w-20 rounded bg-[#E2E8F0] dark:bg-[#334155] md:block" />
          <div className="h-6 w-16 rounded-full bg-[#E2E8F0] dark:bg-[#334155]" />
        </div>
      ))}
    </div>
  );
}

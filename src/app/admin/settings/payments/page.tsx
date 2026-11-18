// src/app/admin/settings/payments/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Loader2, Smartphone } from 'lucide-react';
import { formatRwandaPhone } from '@/lib/constants/payouts';

const input =
  'w-full rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#0F172A] px-3.5 py-2.5 text-sm text-[#0F172A] dark:text-white outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20';

/** Where members send money for plans. Shown on the plan checkout. */
export default function PaymentSettingsPage() {
  const [mtn, setMtn] = useState('');
  const [airtel, setAirtel] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/admin/settings/payments', { cache: 'no-store' })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Failed to load');
        setMtn(j.mtnNumber ? formatRwandaPhone(j.mtnNumber) : '');
        setAirtel(j.airtelNumber ? formatRwandaPhone(j.airtelNumber) : '');
        setName(j.accountName || '');
      })
      .catch((e) => setMessage({ ok: false, text: e.message }))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/settings/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mtnNumber: mtn, airtelNumber: airtel, accountName: name }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Could not save');
      setMessage({ ok: true, text: 'Saved. Members now see these details at checkout.' });
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : 'Could not save' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white">Mobile money</h1>
        <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
          Members pay for plans to these numbers, then submit the transaction ID and a screenshot for review.
        </p>
      </div>

      {loading ? (
        <Loader2 className="animate-spin text-[#2563EB]" />
      ) : (
        <div className="space-y-4 rounded-2xl border border-[#F1F5F9] dark:border-[#334155] bg-white dark:bg-[#1E293B] p-5">
          <div>
            <label className="text-sm font-semibold text-[#0F172A] dark:text-white">Name on the account</label>
            <input className={`${input} mt-1`} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Boostly Ltd" />
            <p className="mt-1 text-xs text-[#64748B]">Must match what members see on their phone when paying.</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-[#0F172A] dark:text-white">MTN MoMo number</label>
            <input className={`${input} mt-1`} value={mtn} onChange={(e) => setMtn(e.target.value)} placeholder="078 123 4567" inputMode="tel" />
          </div>
          <div>
            <label className="text-sm font-semibold text-[#0F172A] dark:text-white">Airtel Money number</label>
            <input className={`${input} mt-1`} value={airtel} onChange={(e) => setAirtel(e.target.value)} placeholder="073 123 4567" inputMode="tel" />
            <p className="mt-1 text-xs text-[#64748B]">Leave one empty to accept only the other network.</p>
          </div>
          {message && (
            <p className={message.ok ? 'text-sm text-[#16A34A]' : 'text-sm text-[#DC2626]'}>{message.text}</p>
          )}
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Smartphone size={15} />}
            Save
          </button>
        </div>
      )}
    </div>
  );
}

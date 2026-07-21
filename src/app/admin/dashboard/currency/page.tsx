// src/app/admin/settings/currency/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { CurrencySelector } from '@/components/CurrencySelector';
import {
  FIAT_CURRENCY_LIST,
  type FiatCurrencyType,
} from '@/lib/db/schema/currency';
import { RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminCurrencySettings() {
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [rates, setRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings/currency');
      const data = await response.json();
      setBaseCurrency(data.baseCurrency);
      setRates(data.rates);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load currency settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/settings/currency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseCurrency }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update currency');
      }

      setBaseCurrency(data.baseCurrency);
      setRates(data.rates);
      setMessage({
        type: 'success',
        text: `Base currency updated to ${data.baseCurrency}`,
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text:
          error instanceof Error ? error.message : 'Failed to update currency',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/settings/currency', {
        method: 'PUT',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to refresh rates');
      }

      setBaseCurrency(data.baseCurrency);
      setRates(data.rates);
      setMessage({
        type: 'success',
        text: 'Exchange rates refreshed successfully',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text:
          error instanceof Error ? error.message : 'Failed to refresh rates',
      });
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 size={24} className="animate-spin text-[#2563EB]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Currency Settings</h1>
        <p className="text-sm text-[#6B7280]">
          Manage platform currency and exchange rates
        </p>
      </div>

      {/* Base Currency */}
      <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm p-6">
        <h3 className="text-sm font-bold mb-4">Base Currency</h3>
        <p className="text-sm text-[#6B7280] mb-4">
          This is the main currency used for all platform transactions and
          calculations.
        </p>

        <div className="flex items-center gap-4">
          <CurrencySelector value={baseCurrency} onChange={setBaseCurrency} />
          <button
            className="px-4 py-2 bg-[#2563EB] text-white font-bold rounded-xl hover:bg-[#1D4ED8] transition-colors flex items-center gap-2 disabled:opacity-50"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCircle size={16} />
            )}
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>

        {message && (
          <div
            className={cn(
              'mt-4 p-3 rounded-xl flex items-center gap-2 text-sm',
              message.type === 'success'
                ? 'bg-[#F0FDF4] text-[#22C55E]'
                : 'bg-[#FEF2F2] text-[#EF4444]',
            )}
          >
            {message.type === 'success' ? (
              <CheckCircle size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
            {message.text}
          </div>
        )}
      </div>

      {/* Exchange Rates */}
      <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold">Exchange Rates</h3>
          <button
            className="px-4 py-2 text-sm font-medium text-[#2563EB] border border-[#2563EB] rounded-xl hover:bg-[#EFF6FF] transition-colors flex items-center gap-2 disabled:opacity-50"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            {refreshing ? 'Refreshing...' : 'Refresh Rates'}
          </button>
        </div>

        <p className="text-sm text-[#6B7280] mb-4">
          Exchange rates relative to <strong>{baseCurrency}</strong>. Rates
          update automatically every hour.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(rates)
            .filter(([currency]) =>
              FIAT_CURRENCY_LIST.includes(currency as FiatCurrencyType),
            )
            .map(([currency, rate]) => (
              <div
                key={currency}
                className="p-3 bg-[#F8FAFC] rounded-xl text-center"
              >
                <div className="text-xs text-[#6B7280]">{currency}</div>
                <div className="text-sm font-bold">{rate.toFixed(4)}</div>
              </div>
            ))}
        </div>
      </div>

      {/* Supported Currencies */}
      <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm p-6">
        <h3 className="text-sm font-bold mb-4">Supported Currencies</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {FIAT_CURRENCY_LIST.map((currency) => (
            <div
              key={currency}
              className={cn(
                'p-3 rounded-xl text-center',
                currency === baseCurrency
                  ? 'bg-[#EFF6FF] border border-[#2563EB]'
                  : 'bg-[#F8FAFC]',
              )}
            >
              <div className="text-sm font-bold">{currency}</div>
              <div className="text-xs text-[#6B7280]">
                {currency === baseCurrency && '✓ Base'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

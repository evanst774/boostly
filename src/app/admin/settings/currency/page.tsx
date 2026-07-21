// src/app/admin/settings/currency/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  DollarSign,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader2,
  Globe,
  Search,
  Edit2,
  Save,
  X,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  FIAT_CURRENCY_LIST,
  FIAT_CURRENCY_INFO,
  getAfricanCurrencies,
  getCurrenciesByRegion,
  type FiatCurrencyType
} from '@/lib/db/schema/currency';
import { useSystemCurrency } from '@/hooks/useSystemCurrency';

type Region =
  | 'All'
  | 'East Africa'
  | 'West Africa'
  | 'Central Africa'
  | 'Southern Africa'
  | 'North Africa'
  | 'Indian Ocean'
  | 'Global'
  | 'Middle East'
  | 'Asia';

const REGIONS: Region[] = [
  'All',
  'East Africa',
  'West Africa',
  'Central Africa',
  'Southern Africa',
  'North Africa',
  'Indian Ocean',
  'Global',
  'Middle East',
  'Asia',
];

export default function AdminCurrencySettings() {
  const { isLoading: currencyLoading } = useSystemCurrency();
  const [baseCurrency, setBaseCurrency] = useState('RWF');
  const [rates, setRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<Region>('All');
  const [editingRate, setEditingRate] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings/currency');
      if (!response.ok) throw new Error('Failed to fetch currency settings');
      const data = await response.json();
      setBaseCurrency(data.baseCurrency || 'RWF');
      setRates(data.rates || {});
      setLastUpdated(data.lastUpdated || null);
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
      setLastUpdated(data.lastUpdated || new Date().toISOString());
      setMessage({
        type: 'success',
        text: data.message || `Base currency updated to ${data.baseCurrency}`,
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
      const response = await fetch('/api/admin/settings/currency/refresh', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to refresh rates');
      }

      setRates(data.rates);
      setLastUpdated(data.lastUpdated || new Date().toISOString());
      setMessage({
        type: 'success',
        text: data.message || 'Exchange rates refreshed successfully',
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

  const handleEditRate = (currencyCode: string) => {
    setEditingRate(currencyCode);
    setEditValue(String(rates[currencyCode] || 1));
  };

  const handleSaveRate = async (currencyCode: string) => {
    const newRate = parseFloat(editValue);
    if (isNaN(newRate) || newRate <= 0) {
      setMessage({ type: 'error', text: 'Invalid rate value' });
      return;
    }

    try {
      const response = await fetch('/api/admin/settings/currency/rates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency: currencyCode, rate: newRate }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update rate');
      }

      const data = await response.json();
      setRates(data.rates);
      setEditingRate(null);
      setMessage({
        type: 'success',
        text: `Rate for ${currencyCode} updated successfully`,
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update rate',
      });
    }
  };

  const getFilteredCurrencies = () => {
    let currencies = FIAT_CURRENCY_LIST;

    // Filter by region
    if (selectedRegion !== 'All') {
      const regionCurrencies = getCurrenciesByRegion(selectedRegion);
      currencies = currencies.filter((code) =>
        regionCurrencies.includes(code as FiatCurrencyType),
      );
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      currencies = currencies.filter((code) => {
        const info =
          FIAT_CURRENCY_INFO[code as keyof typeof FIAT_CURRENCY_INFO];
        return (
          code.toLowerCase().includes(query) ||
          info.name.toLowerCase().includes(query) ||
          info.country.toLowerCase().includes(query)
        );
      });
    }

    return currencies;
  };

  const getRegionEmoji = (region: string) => {
    const emojis: Record<string, string> = {
      'East Africa': '🌍',
      'West Africa': '🌍',
      'Central Africa': '🌍',
      'Southern Africa': '🌍',
      'North Africa': '🌍',
      'Indian Ocean': '🌊',
      Global: '🌐',
      'Middle East': '🕌',
      Asia: '🏯',
    };
    return emojis[region] || '🌍';
  };

  if (loading || currencyLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="animate-spin text-[#2563EB]" />
      </div>
    );
  }

  const filteredCurrencies = getFilteredCurrencies();

  return (
    <div className="space-y-6 font-outfit">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white">
          Currency Settings
        </h1>
        <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
          Manage platform currency and exchange rates
        </p>
      </div>

      {/* Base Currency */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] dark:bg-[#2563EB]/20 flex items-center justify-center text-[#2563EB] dark:text-[#60A5FA]">
            <DollarSign size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">
              Base Currency
            </h3>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              Main currency for all platform transactions
            </p>
          </div>
          {lastUpdated && (
            <div className="ml-auto flex items-center gap-1.5 text-xs text-[#64748B] dark:text-[#94A3B8]">
              <Clock size={14} />
              <span>Updated: {new Date(lastUpdated).toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <select
              value={baseCurrency}
              onChange={(e) => setBaseCurrency(e.target.value)}
              className="w-full px-4 py-2.5 border border-[#F1F5F9] dark:border-[#334155] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white"
            >
              {FIAT_CURRENCY_LIST.map((code) => {
                const info =
                  FIAT_CURRENCY_INFO[code as keyof typeof FIAT_CURRENCY_INFO];
                return (
                  <option key={code} value={code}>
                    {code} - {info.symbol} ({info.name})
                  </option>
                );
              })}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2.5 bg-[#2563EB] text-white font-bold rounded-xl hover:bg-[#1D4ED8] transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2.5 border border-[#F1F5F9] dark:border-[#334155] text-[#64748B] dark:text-[#94A3B8] font-medium rounded-xl hover:bg-[#F8FAFC] dark:hover:bg-[#334155] transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {refreshing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RefreshCw size={16} />
              )}
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {message && (
          <div
            className={cn(
              'mt-4 p-3 rounded-xl flex items-center gap-2 text-sm',
              message.type === 'success'
                ? 'bg-[#F0FDF4] dark:bg-[#22C55E]/20 text-[#22C55E] dark:text-[#4ADE80]'
                : 'bg-[#FEF2F2] dark:bg-[#EF4444]/20 text-[#EF4444] dark:text-[#F87171]',
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
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFFBEB] dark:bg-[#F59E0B]/20 flex items-center justify-center text-[#F59E0B] dark:text-[#FBBF24]">
              <Globe size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">
                Exchange Rates
              </h3>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Relative to <strong>{baseCurrency}</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              {filteredCurrencies.length} currencies
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
            />
            <input
              type="text"
              placeholder="Search currencies..."
              className="w-full pl-10 pr-4 py-2 border border-[#F1F5F9] dark:border-[#334155] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all text-sm bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white placeholder:text-[#94A3B8]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value as Region)}
            className="px-4 py-2 border border-[#F1F5F9] dark:border-[#334155] rounded-xl text-sm bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white focus:border-[#2563EB] outline-none"
          >
            {REGIONS.map((region) => (
              <option key={region} value={region}>
                {region === 'All'
                  ? '🌐 All Regions'
                  : `${getRegionEmoji(region)} ${region}`}
              </option>
            ))}
          </select>
        </div>

        {/* Rates Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filteredCurrencies.map((code) => {
            const info =
              FIAT_CURRENCY_INFO[code as keyof typeof FIAT_CURRENCY_INFO];
            const rate = rates[code] || 1;
            const isBase = code === baseCurrency;
            const isEditing = editingRate === code;

            return (
              <div
                key={code}
                className={cn(
                  'p-3 rounded-xl border transition-all relative',
                  isBase
                    ? 'bg-[#EFF6FF] dark:bg-[#2563EB]/20 border-[#2563EB] dark:border-[#60A5FA]'
                    : 'bg-[#F8FAFC] dark:bg-[#0F172A] border-[#F1F5F9] dark:border-[#334155] hover:border-[#2563EB] dark:hover:border-[#60A5FA]',
                )}
              >
                {isBase && (
                  <div className="absolute -top-2 -right-2">
                    <span className="text-[8px] font-bold text-[#2563EB] dark:text-[#60A5FA] bg-white dark:bg-[#1E293B] px-1.5 py-0.5 rounded-full border border-[#2563EB] dark:border-[#60A5FA]">
                      Base
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <span className="text-sm font-bold text-[#0F172A] dark:text-white">
                      {code}
                    </span>
                    <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8] truncate max-w-[80px]">
                      {info.symbol}
                    </p>
                  </div>
                  <div className="text-right">
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.0001"
                          min="0"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-16 px-1 py-0.5 text-xs border border-[#F1F5F9] dark:border-[#334155] rounded bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white focus:border-[#2563EB] outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveRate(code)}
                          className="p-1 rounded hover:bg-[#F0FDF4] dark:hover:bg-[#22C55E]/20 text-[#22C55E]"
                        >
                          <CheckCircle size={14} />
                        </button>
                        <button
                          onClick={() => setEditingRate(null)}
                          className="p-1 rounded hover:bg-[#FEF2F2] dark:hover:bg-[#EF4444]/20 text-[#EF4444]"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-mono text-[#0F172A] dark:text-white">
                          {rate.toFixed(4)}
                        </span>
                        {!isBase && (
                          <button
                            onClick={() => handleEditRate(code)}
                            className="p-1 rounded hover:bg-[#F8FAFC] dark:hover:bg-[#334155] text-[#64748B] dark:text-[#94A3B8] hover:text-[#2563EB] dark:hover:text-[#60A5FA] transition-colors"
                          >
                            <Edit2 size={12} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-[9px] text-[#94A3B8] dark:text-[#64748B] truncate">
                  {info.country.split(',')[0]}
                </p>
                <p className="text-[9px] text-[#94A3B8] dark:text-[#64748B] mt-0.5 flex items-center gap-1">
                  <span className="text-[#94A3B8]">🌍</span>
                  {info.region}
                </p>
              </div>
            );
          })}
        </div>

        {filteredCurrencies.length === 0 && (
          <div className="text-center py-8">
            <p className="text-[#64748B] dark:text-[#94A3B8]">
              No currencies found
            </p>
            <p className="text-xs text-[#94A3B8] dark:text-[#64748B] mt-1">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>

      {/* Currency Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Total Currencies"
          value={FIAT_CURRENCY_LIST.length}
          icon={<DollarSign size={16} />}
          color="blue"
        />
        <StatCard
          label="African Currencies"
          value={getAfricanCurrencies().length}
          icon={<Globe size={16} />}
          color="green"
        />
        <StatCard
          label="Base Currency"
          value={baseCurrency}
          icon={<CheckCircle size={16} />}
          color="yellow"
        />
        <StatCard
          label="Exchange Rates"
          value={Object.keys(rates).length}
          icon={<RefreshCw size={16} />}
          color="purple"
        />
      </div>

      {/* African Currency Regions Quick Links */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm p-6">
        <h3 className="text-sm font-bold text-[#0F172A] dark:text-white mb-4">
          African Currency Regions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            {
              name: 'East Africa',
              count: getCurrenciesByRegion('East Africa').length,
              emoji: '🌍',
            },
            {
              name: 'West Africa',
              count: getCurrenciesByRegion('West Africa').length,
              emoji: '🌍',
            },
            {
              name: 'Central Africa',
              count: getCurrenciesByRegion('Central Africa').length,
              emoji: '🌍',
            },
            {
              name: 'Southern Africa',
              count: getCurrenciesByRegion('Southern Africa').length,
              emoji: '🌍',
            },
            {
              name: 'North Africa',
              count: getCurrenciesByRegion('North Africa').length,
              emoji: '🌍',
            },
            {
              name: 'Indian Ocean',
              count: getCurrenciesByRegion('Indian Ocean').length,
              emoji: '🌊',
            },
          ].map((region) => (
            <button
              key={region.name}
              onClick={() => setSelectedRegion(region.name as Region)}
              className="p-3 rounded-xl border border-[#F1F5F9] dark:border-[#334155] hover:border-[#2563EB] dark:hover:border-[#60A5FA] transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{region.emoji}</span>
                <div>
                  <p className="text-sm font-medium text-[#0F172A] dark:text-white">
                    {region.name}
                  </p>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                    {region.count} currencies
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'purple';
}) {
  const colors = {
    blue: 'bg-[#EFF6FF] dark:bg-[#2563EB]/20 text-[#2563EB] dark:text-[#60A5FA]',
    green:
      'bg-[#F0FDF4] dark:bg-[#22C55E]/20 text-[#22C55E] dark:text-[#4ADE80]',
    yellow:
      'bg-[#FFFBEB] dark:bg-[#F59E0B]/20 text-[#F59E0B] dark:text-[#FBBF24]',
    purple:
      'bg-[#F5F3FF] dark:bg-[#8B5CF6]/20 text-[#8B5CF6] dark:text-[#A78BFA]',
  };

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-[#F1F5F9] dark:border-[#334155] p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center ${colors[color]}`}
        >
          {icon}
        </div>
        <div>
          <p className="text-xl font-bold text-[#0F172A] dark:text-white">
            {value}
          </p>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">{label}</p>
        </div>
      </div>
    </div>
  );
}

// src/components/admin/tabs/SettingsTab.tsx
'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Save,
  Building2,
  Mail,
  Settings as SettingsIcon,
  DollarSign,
  Shield,
} from 'lucide-react';
import {
  FIAT_CURRENCY_INFO,
  type FiatCurrencyType,
} from '@/lib/db/schema/currency';
import { getCurrencySymbol } from '@/lib/utils/currency';

export function SettingsTab() {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<
    'general' | 'email' | 'currency' | 'security'
  >('general');
  const [settings, setSettings] = useState({
    // Company
    companyName: 'Boostly',
    website: 'https://boostly.buzz',
    phone: '',
    email: '',
    address: '',
    city: '',
    country: 'Rwanda',
    description: '',

    // Currency
    baseCurrency: 'RWF' as FiatCurrencyType,
    currencySymbol: 'FRw',
    currencyPosition: 'before',
    decimalPlaces: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    timezone: 'Africa/Kigali',

    // Email
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUsername: '',
    smtpPassword: '',
    fromName: 'Boostly',
    fromEmail: 'noreply@boostly.buzz',
    encryption: 'TLS',

    // Features
    maintenanceMode: false,
    registrationOpen: true,
    cryptoEnabled: false,
  });
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Get all available currencies from the schema
  const availableCurrencies = Object.entries(FIAT_CURRENCY_INFO).map(
    ([code, info]) => ({
      code: code as FiatCurrencyType,
      symbol: info.symbol,
      name: info.name,
      country: info.country,
      region: info.region,
      decimalPlaces: info.decimalPlaces,
    }),
  );

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings({
          companyName: data.companyName || 'Boostly',
          website: data.website || 'https://boostly.buzz',
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          city: data.city || '',
          country: data.country || 'Rwanda',
          description: data.description || '',
          baseCurrency: (data.baseCurrency as FiatCurrencyType) || 'RWF',
          currencySymbol:
            data.currencySymbol ||
            getCurrencySymbol(data.baseCurrency || 'RWF'),
          currencyPosition: data.currencyPosition || 'before',
          decimalPlaces: data.decimalPlaces || 2,
          thousandSeparator: data.thousandSeparator || ',',
          decimalSeparator: data.decimalSeparator || '.',
          timezone: data.timezone || 'Africa/Kigali',
          smtpHost: data.smtpHost || 'smtp.gmail.com',
          smtpPort: data.smtpPort || '587',
          smtpUsername: data.smtpUsername || '',
          smtpPassword: data.smtpPassword || '',
          fromName: data.fromName || 'Boostly',
          fromEmail: data.fromEmail || 'noreply@boostly.buzz',
          encryption: data.encryption || 'TLS',
          maintenanceMode: data.maintenanceMode || false,
          registrationOpen:
            data.registrationOpen !== undefined ? data.registrationOpen : true,
          cryptoEnabled: data.cryptoEnabled || false,
        });
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save settings');
      }

      setMessage({
        type: 'success',
        text: data.message || 'Settings saved successfully!',
      });

      // Refresh settings after save
      await fetchSettings();
    } catch (error) {
      setMessage({
        type: 'error',
        text:
          error instanceof Error ? error.message : 'Failed to save settings',
      });
    } finally {
      setSaving(false);
    }
  };

  const sections: Array<{
    id: 'general' | 'email' | 'currency' | 'security';
    label: string;
    icon: React.ReactNode;
  }> = [
    { id: 'general', label: 'General', icon: <SettingsIcon size={16} /> },
    { id: 'email', label: 'Email', icon: <Mail size={16} /> },
    { id: 'currency', label: 'Currency', icon: <DollarSign size={16} /> },
    { id: 'security', label: 'Security', icon: <Shield size={16} /> },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 size={32} className="animate-spin text-[#2563EB]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Tabs */}
      <div className="flex gap-1 bg-[#F8FAFC] dark:bg-[#0F172A] rounded-xl p-1 border border-[#F1F5F9] dark:border-[#334155] overflow-x-auto">
        {sections.map((section) => (
          <button
            key={section.id}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
              activeSection === section.id
                ? 'bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-white shadow-sm'
                : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-white/50 dark:hover:bg-[#1E293B]/50',
            )}
            onClick={() => setActiveSection(section.id)}
          >
            {section.icon}
            {section.label}
          </button>
        ))}
      </div>

      {/* General Settings */}
      {activeSection === 'general' && (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm p-6">
          <h3 className="text-sm font-bold text-[#0F172A] dark:text-white mb-4 flex items-center gap-2">
            <Building2 size={16} className="text-[#2563EB]" />
            Company Information
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#64748B] dark:text-[#94A3B8] mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-[#F1F5F9] dark:border-[#334155] rounded-xl text-sm bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white focus:border-[#2563EB] outline-none"
                  value={settings.companyName}
                  onChange={(e) =>
                    setSettings({ ...settings, companyName: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#64748B] dark:text-[#94A3B8] mb-1">
                  Website
                </label>
                <input
                  type="url"
                  className="w-full px-3 py-2 border border-[#F1F5F9] dark:border-[#334155] rounded-xl text-sm bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white focus:border-[#2563EB] outline-none"
                  value={settings.website}
                  onChange={(e) =>
                    setSettings({ ...settings, website: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#64748B] dark:text-[#94A3B8] mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border border-[#F1F5F9] dark:border-[#334155] rounded-xl text-sm bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white focus:border-[#2563EB] outline-none"
                  value={settings.phone}
                  onChange={(e) =>
                    setSettings({ ...settings, phone: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#64748B] dark:text-[#94A3B8] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-[#F1F5F9] dark:border-[#334155] rounded-xl text-sm bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white focus:border-[#2563EB] outline-none"
                  value={settings.email}
                  onChange={(e) =>
                    setSettings({ ...settings, email: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#64748B] dark:text-[#94A3B8] mb-1">
                Address
              </label>
              <textarea
                className="w-full px-3 py-2 border border-[#F1F5F9] dark:border-[#334155] rounded-xl text-sm bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white focus:border-[#2563EB] outline-none resize-none h-20"
                value={settings.address}
                onChange={(e) =>
                  setSettings({ ...settings, address: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#64748B] dark:text-[#94A3B8] mb-1">
                  City
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-[#F1F5F9] dark:border-[#334155] rounded-xl text-sm bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white focus:border-[#2563EB] outline-none"
                  value={settings.city}
                  onChange={(e) =>
                    setSettings({ ...settings, city: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#64748B] dark:text-[#94A3B8] mb-1">
                  Country
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-[#F1F5F9] dark:border-[#334155] rounded-xl text-sm bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white focus:border-[#2563EB] outline-none"
                  value={settings.country}
                  onChange={(e) =>
                    setSettings({ ...settings, country: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#64748B] dark:text-[#94A3B8] mb-1">
                Description
              </label>
              <textarea
                className="w-full px-3 py-2 border border-[#F1F5F9] dark:border-[#334155] rounded-xl text-sm bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white focus:border-[#2563EB] outline-none resize-none h-20"
                value={settings.description}
                onChange={(e) =>
                  setSettings({ ...settings, description: e.target.value })
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* Email Settings */}
      {activeSection === 'email' && (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm p-6">
          <h3 className="text-sm font-bold text-[#0F172A] dark:text-white mb-4 flex items-center gap-2">
            <Mail size={16} className="text-[#2563EB]" />
            Email Configuration
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#64748B] dark:text-[#94A3B8] mb-1">
                  SMTP Host
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-[#F1F5F9] dark:border-[#334155] rounded-xl text-sm bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white focus:border-[#2563EB] outline-none"
                  value={settings.smtpHost}
                  onChange={(e) =>
                    setSettings({ ...settings, smtpHost: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#64748B] dark:text-[#94A3B8] mb-1">
                  SMTP Port
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-[#F1F5F9] dark:border-[#334155] rounded-xl text-sm bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white focus:border-[#2563EB] outline-none"
                  value={settings.smtpPort}
                  onChange={(e) =>
                    setSettings({ ...settings, smtpPort: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#64748B] dark:text-[#94A3B8] mb-1">
                  SMTP Username
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-[#F1F5F9] dark:border-[#334155] rounded-xl text-sm bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white focus:border-[#2563EB] outline-none"
                  value={settings.smtpUsername}
                  onChange={(e) =>
                    setSettings({ ...settings, smtpUsername: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#64748B] dark:text-[#94A3B8] mb-1">
                  SMTP Password
                </label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-[#F1F5F9] dark:border-[#334155] rounded-xl text-sm bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white focus:border-[#2563EB] outline-none"
                  value={settings.smtpPassword}
                  onChange={(e) =>
                    setSettings({ ...settings, smtpPassword: e.target.value })
                  }
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#64748B] dark:text-[#94A3B8] mb-1">
                  From Email
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-[#F1F5F9] dark:border-[#334155] rounded-xl text-sm bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white focus:border-[#2563EB] outline-none"
                  value={settings.fromEmail}
                  onChange={(e) =>
                    setSettings({ ...settings, fromEmail: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#64748B] dark:text-[#94A3B8] mb-1">
                  From Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-[#F1F5F9] dark:border-[#334155] rounded-xl text-sm bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white focus:border-[#2563EB] outline-none"
                  value={settings.fromName}
                  onChange={(e) =>
                    setSettings({ ...settings, fromName: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#64748B] dark:text-[#94A3B8] mb-1">
                Encryption
              </label>
              <select
                className="w-full px-3 py-2 border border-[#F1F5F9] dark:border-[#334155] rounded-xl text-sm bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white focus:border-[#2563EB] outline-none"
                value={settings.encryption}
                onChange={(e) =>
                  setSettings({ ...settings, encryption: e.target.value })
                }
              >
                <option value="TLS">TLS</option>
                <option value="SSL">SSL</option>
                <option value="STARTTLS">STARTTLS</option>
                <option value="NONE">None</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Currency Settings - Dynamic from database */}
      {activeSection === 'currency' && (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm p-6">
          <h3 className="text-sm font-bold text-[#0F172A] dark:text-white mb-4 flex items-center gap-2">
            <DollarSign size={16} className="text-[#2563EB]" />
            Currency Settings
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#64748B] dark:text-[#94A3B8] mb-1">
                  Base Currency
                </label>
                <select
                  className="w-full px-3 py-2 border border-[#F1F5F9] dark:border-[#334155] rounded-xl text-sm bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white focus:border-[#2563EB] outline-none"
                  value={settings.baseCurrency}
                  onChange={(e) => {
                    const newCurrency = e.target.value as FiatCurrencyType;
                    setSettings({
                      ...settings,
                      baseCurrency: newCurrency,
                      currencySymbol: getCurrencySymbol(newCurrency),
                      decimalPlaces:
                        FIAT_CURRENCY_INFO[newCurrency]?.decimalPlaces || 2,
                    });
                  }}
                >
                  {availableCurrencies.map((curr) => (
                    <option key={curr.code} value={curr.code}>
                      {curr.code} - {curr.symbol} ({curr.name})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                  {FIAT_CURRENCY_INFO[settings.baseCurrency]?.country} •{' '}
                  {FIAT_CURRENCY_INFO[settings.baseCurrency]?.region}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#64748B] dark:text-[#94A3B8] mb-1">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-[#F1F5F9] dark:border-[#334155] rounded-xl text-sm bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white focus:border-[#2563EB] outline-none"
                  value={settings.currencySymbol}
                  onChange={(e) =>
                    setSettings({ ...settings, currencySymbol: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#64748B] dark:text-[#94A3B8] mb-1">
                  Currency Position
                </label>
                <select
                  className="w-full px-3 py-2 border border-[#F1F5F9] dark:border-[#334155] rounded-xl text-sm bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white focus:border-[#2563EB] outline-none"
                  value={settings.currencyPosition}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      currencyPosition: e.target.value as 'before' | 'after',
                    })
                  }
                >
                  <option value="before">Before (e.g., $100)</option>
                  <option value="after">After (e.g., 100$)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#64748B] dark:text-[#94A3B8] mb-1">
                  Decimal Places
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-[#F1F5F9] dark:border-[#334155] rounded-xl text-sm bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white focus:border-[#2563EB] outline-none"
                  value={settings.decimalPlaces}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      decimalPlaces: parseInt(e.target.value),
                    })
                  }
                  min="0"
                  max="4"
                />
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                  Default for {settings.baseCurrency}:{' '}
                  {FIAT_CURRENCY_INFO[settings.baseCurrency]?.decimalPlaces ||
                    2}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#64748B] dark:text-[#94A3B8] mb-1">
                  Thousand Separator
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-[#F1F5F9] dark:border-[#334155] rounded-xl text-sm bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white focus:border-[#2563EB] outline-none"
                  value={settings.thousandSeparator}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      thousandSeparator: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#64748B] dark:text-[#94A3B8] mb-1">
                  Decimal Separator
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-[#F1F5F9] dark:border-[#334155] rounded-xl text-sm bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white focus:border-[#2563EB] outline-none"
                  value={settings.decimalSeparator}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      decimalSeparator: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#64748B] dark:text-[#94A3B8] mb-1">
                Timezone
              </label>
              <select
                className="w-full px-3 py-2 border border-[#F1F5F9] dark:border-[#334155] rounded-xl text-sm bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white focus:border-[#2563EB] outline-none"
                value={settings.timezone}
                onChange={(e) =>
                  setSettings({ ...settings, timezone: e.target.value })
                }
              >
                <option value="Africa/Kigali">Africa/Kigali (Rwanda)</option>
                <option value="Africa/Nairobi">Africa/Nairobi (Kenya)</option>
                <option value="Africa/Dar_es_Salaam">
                  Africa/Dar_es_Salaam (Tanzania)
                </option>
                <option value="Africa/Kampala">Africa/Kampala (Uganda)</option>
                <option value="Africa/Johannesburg">
                  Africa/Johannesburg (South Africa)
                </option>
                <option value="Africa/Lagos">Africa/Lagos (Nigeria)</option>
                <option value="Africa/Accra">Africa/Accra (Ghana)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Security Settings */}
      {activeSection === 'security' && (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm p-6">
          <h3 className="text-sm font-bold text-[#0F172A] dark:text-white mb-4 flex items-center gap-2">
            <Shield size={16} className="text-[#2563EB]" />
            Security Settings
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-[#F1F5F9] dark:border-[#334155] last:border-b-0">
              <div>
                <p className="text-sm font-medium text-[#0F172A] dark:text-white">
                  Maintenance Mode
                </p>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                  Put the platform in maintenance mode
                </p>
              </div>
              <button
                className={cn(
                  'w-12 h-7 rounded-full transition-colors relative',
                  settings.maintenanceMode ? 'bg-[#22C55E]' : 'bg-[#D1D5DB]',
                )}
                onClick={() =>
                  setSettings({
                    ...settings,
                    maintenanceMode: !settings.maintenanceMode,
                  })
                }
              >
                <div
                  className={cn(
                    'absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform',
                    settings.maintenanceMode ? 'right-0.5' : 'left-0.5',
                  )}
                />
              </button>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#F1F5F9] dark:border-[#334155] last:border-b-0">
              <div>
                <p className="text-sm font-medium text-[#0F172A] dark:text-white">
                  Registration Open
                </p>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                  Allow new user registrations
                </p>
              </div>
              <button
                className={cn(
                  'w-12 h-7 rounded-full transition-colors relative',
                  settings.registrationOpen ? 'bg-[#22C55E]' : 'bg-[#D1D5DB]',
                )}
                onClick={() =>
                  setSettings({
                    ...settings,
                    registrationOpen: !settings.registrationOpen,
                  })
                }
              >
                <div
                  className={cn(
                    'absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform',
                    settings.registrationOpen ? 'right-0.5' : 'left-0.5',
                  )}
                />
              </button>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#F1F5F9] dark:border-[#334155] last:border-b-0">
              <div>
                <p className="text-sm font-medium text-[#0F172A] dark:text-white">
                  Crypto Features
                </p>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                  Enable cryptocurrency features
                </p>
              </div>
              <button
                className={cn(
                  'w-12 h-7 rounded-full transition-colors relative',
                  settings.cryptoEnabled ? 'bg-[#22C55E]' : 'bg-[#D1D5DB]',
                )}
                onClick={() =>
                  setSettings({
                    ...settings,
                    cryptoEnabled: !settings.cryptoEnabled,
                  })
                }
              >
                <div
                  className={cn(
                    'absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform',
                    settings.cryptoEnabled ? 'right-0.5' : 'left-0.5',
                  )}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message */}
      {message && (
        <div
          className={cn(
            'p-3 rounded-xl flex items-center gap-2 text-sm',
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

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-[#2563EB] text-white font-bold py-3 rounded-xl hover:bg-[#1D4ED8] transition-colors shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {saving ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save size={18} />
            Save Settings
          </>
        )}
      </button>
    </div>
  );
}

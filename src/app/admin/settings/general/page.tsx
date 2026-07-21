// src/app/admin/settings/general/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GeneralSettingsForm {
  companyName: string;
  description: string;
  baseCurrency: string;
  registrationOpen: boolean;
}

const EMPTY_FORM: GeneralSettingsForm = {
  companyName: '',
  description: '',
  baseCurrency: 'RWF',
  registrationOpen: true,
};

export default function AdminGeneralSettings() {
  const [form, setForm] = useState<GeneralSettingsForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/settings');
        if (!res.ok) throw new Error('Failed to load settings');
        const data = await res.json();
        setForm({
          companyName: data.companyName ?? '',
          description: data.description ?? '',
          baseCurrency: data.baseCurrency ?? 'RWF',
          registrationOpen: data.registrationOpen ?? true,
        });
      } catch {
        setMessage({ type: 'error', text: 'Failed to load settings' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleChange = <K extends keyof GeneralSettingsForm>(
    field: K,
    value: GeneralSettingsForm[K],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Save failed');
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white">
          General Settings
        </h1>
        <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
          Manage general platform settings
        </p>
      </div>

      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-[#2563EB]" />
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] dark:text-white mb-1">
                Platform Name
              </label>
              <input
                type="text"
                className="w-full max-w-md px-4 py-2.5 border border-[#F1F5F9] dark:border-[#334155] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white"
                value={form.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0F172A] dark:text-white mb-1">
                Description
              </label>
              <textarea
                className="w-full max-w-md px-4 py-2.5 border border-[#F1F5F9] dark:border-[#334155] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white resize-none h-24"
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0F172A] dark:text-white mb-1">
                Default Currency
              </label>
              <select
                className="w-full max-w-md px-4 py-2.5 border border-[#F1F5F9] dark:border-[#334155] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white"
                value={form.baseCurrency}
                onChange={(e) => handleChange('baseCurrency', e.target.value)}
              >
                <option value="RWF">RWF - Rwandan Franc</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  handleChange('registrationOpen', !form.registrationOpen)
                }
                className={cn(
                  'w-12 h-7 rounded-full transition-colors relative',
                  form.registrationOpen ? 'bg-[#22C55E]' : 'bg-[#D1D5DB]',
                )}
              >
                <div
                  className={cn(
                    'absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform',
                    form.registrationOpen ? 'right-0.5' : 'left-0.5',
                  )}
                />
              </button>
              <span className="text-sm font-medium text-[#0F172A] dark:text-white">
                Allow user registration
              </span>
            </div>

            {message && (
              <div
                className={cn(
                  'p-3 rounded-xl flex items-center gap-2 text-sm',
                  message.type === 'success'
                    ? 'bg-[#F0FDF4] text-[#22C55E] dark:bg-[#22C55E]/20'
                    : 'bg-[#FEF2F2] text-[#EF4444] dark:bg-[#EF4444]/20',
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

            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-[#2563EB] text-white font-bold rounded-xl hover:bg-[#1D4ED8] transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

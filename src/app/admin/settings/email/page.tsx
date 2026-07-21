// src/app/admin/settings/email/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Mail,
  Server,
  Key,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmailSettingsForm {
  smtpHost: string;
  smtpPort: string;
  smtpUsername: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
}

const EMPTY_FORM: EmailSettingsForm = {
  smtpHost: '',
  smtpPort: '',
  smtpUsername: '',
  smtpPassword: '',
  fromEmail: '',
  fromName: '',
};

export default function AdminEmailSettings() {
  const [form, setForm] = useState<EmailSettingsForm>(EMPTY_FORM);
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
          smtpHost: data.smtpHost ?? '',
          smtpPort: data.smtpPort ?? '',
          smtpUsername: data.smtpUsername ?? '',
          smtpPassword: data.smtpPassword ?? '',
          fromEmail: data.fromEmail ?? '',
          fromName: data.fromName ?? '',
        });
      } catch {
        setMessage({ type: 'error', text: 'Failed to load email settings' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleChange = (field: keyof EmailSettingsForm, value: string) => {
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
      setMessage({
        type: 'success',
        text: 'Email settings saved successfully!',
      });
    } catch {
      setMessage({ type: 'error', text: 'Failed to save email settings' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white">
          Email Settings
        </h1>
        <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
          Configure email server settings
        </p>
      </div>

      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-[#2563EB]" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#0F172A] dark:text-white mb-1">
                  <Server size={16} className="inline mr-2" />
                  SMTP Host
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-[#F1F5F9] dark:border-[#334155] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white"
                  value={form.smtpHost}
                  onChange={(e) => handleChange('smtpHost', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] dark:text-white mb-1">
                  <Server size={16} className="inline mr-2" />
                  SMTP Port
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-[#F1F5F9] dark:border-[#334155] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white"
                  value={form.smtpPort}
                  onChange={(e) => handleChange('smtpPort', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#0F172A] dark:text-white mb-1">
                  <User size={16} className="inline mr-2" />
                  SMTP Username
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-[#F1F5F9] dark:border-[#334155] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white"
                  value={form.smtpUsername}
                  onChange={(e) =>
                    handleChange('smtpUsername', e.target.value)
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] dark:text-white mb-1">
                  <Key size={16} className="inline mr-2" />
                  SMTP Password
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-2.5 border border-[#F1F5F9] dark:border-[#334155] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white"
                  value={form.smtpPassword}
                  onChange={(e) =>
                    handleChange('smtpPassword', e.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#0F172A] dark:text-white mb-1">
                  <Mail size={16} className="inline mr-2" />
                  From Email
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-2.5 border border-[#F1F5F9] dark:border-[#334155] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white"
                  value={form.fromEmail}
                  onChange={(e) => handleChange('fromEmail', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] dark:text-white mb-1">
                  <User size={16} className="inline mr-2" />
                  From Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-[#F1F5F9] dark:border-[#334155] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white"
                  value={form.fromName}
                  onChange={(e) => handleChange('fromName', e.target.value)}
                />
              </div>
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
              {saving ? 'Saving...' : 'Save Email Settings'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

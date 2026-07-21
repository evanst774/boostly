// src/app/admin/settings/security/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Shield,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SecuritySettingsForm {
  requireTwoFactorForAdmins: boolean;
  sessionTimeoutMinutes: number;
  failedLoginAttemptsLimit: number;
  ipWhitelistingEnabled: boolean;
}

const EMPTY_FORM: SecuritySettingsForm = {
  requireTwoFactorForAdmins: false,
  sessionTimeoutMinutes: 30,
  failedLoginAttemptsLimit: 5,
  ipWhitelistingEnabled: false,
};

export default function AdminSecuritySettings() {
  const [form, setForm] = useState<SecuritySettingsForm>(EMPTY_FORM);
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
          requireTwoFactorForAdmins: data.requireTwoFactorForAdmins ?? false,
          sessionTimeoutMinutes: data.sessionTimeoutMinutes ?? 30,
          failedLoginAttemptsLimit: data.failedLoginAttemptsLimit ?? 5,
          ipWhitelistingEnabled: data.ipWhitelistingEnabled ?? false,
        });
      } catch {
        setMessage({ type: 'error', text: 'Failed to load security settings' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleChange = <K extends keyof SecuritySettingsForm>(
    field: K,
    value: SecuritySettingsForm[K],
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
      setMessage({
        type: 'success',
        text: 'Security settings saved successfully!',
      });
    } catch {
      setMessage({ type: 'error', text: 'Failed to save security settings' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white">
          Security Settings
        </h1>
        <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
          Manage platform security settings
        </p>
      </div>

      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-[#2563EB]" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between py-3 border-b border-[#F1F5F9] dark:border-[#334155]">
              <div>
                <p className="text-sm font-medium text-[#0F172A] dark:text-white">
                  Two-Factor Authentication
                </p>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                  Require 2FA for admin accounts
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleChange(
                    'requireTwoFactorForAdmins',
                    !form.requireTwoFactorForAdmins,
                  )
                }
                className={cn(
                  'w-12 h-7 rounded-full transition-colors relative',
                  form.requireTwoFactorForAdmins
                    ? 'bg-[#22C55E]'
                    : 'bg-[#D1D5DB]',
                )}
              >
                <div
                  className={cn(
                    'absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform',
                    form.requireTwoFactorForAdmins ? 'right-0.5' : 'left-0.5',
                  )}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-[#F1F5F9] dark:border-[#334155]">
              <div>
                <p className="text-sm font-medium text-[#0F172A] dark:text-white">
                  Session Timeout
                </p>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                  Automatically logout inactive users
                </p>
              </div>
              <select
                className="px-4 py-2 border border-[#F1F5F9] dark:border-[#334155] rounded-xl bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white focus:border-[#2563EB] outline-none"
                value={form.sessionTimeoutMinutes}
                onChange={(e) =>
                  handleChange('sessionTimeoutMinutes', Number(e.target.value))
                }
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={120}>2 hours</option>
              </select>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-[#F1F5F9] dark:border-[#334155]">
              <div>
                <p className="text-sm font-medium text-[#0F172A] dark:text-white">
                  Failed Login Attempts
                </p>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                  Lock account after failed attempts
                </p>
              </div>
              <select
                className="px-4 py-2 border border-[#F1F5F9] dark:border-[#334155] rounded-xl bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white focus:border-[#2563EB] outline-none"
                value={form.failedLoginAttemptsLimit}
                onChange={(e) =>
                  handleChange(
                    'failedLoginAttemptsLimit',
                    Number(e.target.value),
                  )
                }
              >
                <option value={3}>3 attempts</option>
                <option value={5}>5 attempts</option>
                <option value={10}>10 attempts</option>
              </select>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-[#0F172A] dark:text-white">
                  IP Whitelisting
                </p>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                  Restrict admin access to specific IPs
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleChange(
                    'ipWhitelistingEnabled',
                    !form.ipWhitelistingEnabled,
                  )
                }
                className={cn(
                  'w-12 h-7 rounded-full transition-colors relative',
                  form.ipWhitelistingEnabled ? 'bg-[#22C55E]' : 'bg-[#D1D5DB]',
                )}
              >
                <div
                  className={cn(
                    'absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform',
                    form.ipWhitelistingEnabled ? 'right-0.5' : 'left-0.5',
                  )}
                />
              </button>
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
                <Shield size={16} />
              )}
              {saving ? 'Saving...' : 'Save Security Settings'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

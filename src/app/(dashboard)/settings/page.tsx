// src/app/(dashboard)/settings/page.tsx
'use client';

import { useCallback, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Camera,
  Edit2,
  Save,
  X,
  Shield,
  Lock,
  Key,
  Bell,
  Moon,
  Sun,
  Globe,
  CreditCard,
  LogOut,
  AlertTriangle,
  Check,
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  Loader2,
  Settings as SettingsIcon,
  Award,
  Crown,
  Users,
  HelpCircle,
  Fingerprint,
  Volume2,
  BarChart3,
  Headphones,
  MessageCircle,
  Monitor,
  Smartphone,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSettings } from '@/hooks/useSettings';
import { cn, formatCurrency } from '@/lib/utils';
import { ConfirmDialog, AlertDialog } from '@/components/ui/Dialog';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { LOCALE_TAGS, useLocale, useT } from '@/lib/i18n';
import { account } from '@/lib/i18n/messages/account';
import { common } from '@/lib/i18n/messages/common';
import { REFERRAL_COMMISSION_LABEL } from '@/lib/constants/referrals';

type SettingsTab =
  | 'profile'
  | 'security'
  | 'preferences'
  | 'payment'
  | 'support';

// Dialog state types
type DialogType = 'confirm' | 'alert';
type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface DialogState {
  type: DialogType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger' | 'success';
  alertVariant?: AlertVariant;
  onConfirm?: () => void;
}

export default function SettingsPage() {
  const router = useRouter();
  const t = useT(account);
  const tc = useT(common);
  const { locale } = useLocale();
  const { user, logout, refreshUser } = useAuth();
  const { dark, toggleTheme } = useTheme();
  // Accounts created with Google have no password until they set one.
  const hasPassword = user?.hasPassword !== false;
  const viaGoogle = user?.linkedProviders?.includes('google') ?? false;
  const { data, updateProfile, updatePassword, updatePreferences } =
    useSettings();

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  // Real signed-in sessions and the last payout number.
  const [sessionsList, setSessionsList] = useState<{ id: string; createdAt: string; current: boolean }[] | null>(null);
  const [payoutNumber, setPayoutNumber] = useState<string | null>(null);
  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/user/sessions', { cache: 'no-store' });
      if (res.ok) setSessionsList((await res.json()).sessions ?? []);
    } catch {
      setSessionsList([]);
    }
  }, []);
  const revokeSession = useCallback(
    async (id: string) => {
      await fetch(`/api/user/sessions?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      await loadSessions();
    },
    [loadSessions],
  );
  useEffect(() => {
    if (activeTab === 'security') void loadSessions();
    if (activeTab === 'payment') {
      fetch('/api/earn/today', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => setPayoutNumber(d?.withdrawal?.lastPhoneNumber ?? null))
        .catch(() => undefined);
    }
  }, [activeTab, loadSessions]);

  // Deep links: /settings?tab=security etc.
  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get('tab');
    const valid: SettingsTab[] = ['profile', 'security', 'preferences', 'payment', 'support'];
    if (tab && valid.includes(tab as SettingsTab)) setActiveTab(tab as SettingsTab);
  }, []);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [show2FA, setShow2FA] = useState(false);

  // Dialog states
  const [dialogState, setDialogState] = useState<DialogState | null>(null);

  // Profile form
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '+250 780 123 456',
  });

  // Password form
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Preferences
  const [preferences, setPreferences] = useState({
    darkMode: false,
    notifications: true,
    emailNotifications: true,
    soundEffects: true,
    language: 'en',
    showOnLeaderboard: true,
    analytics: true,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (data?.preferences) {
      setPreferences(data.preferences);
    }
  }, [data]);

  const showConfirm = (options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmVariant?: 'primary' | 'danger' | 'success';
    onConfirm: () => void;
  }) => {
    setDialogState({
      type: 'confirm',
      title: options.title,
      message: options.message,
      confirmText: options.confirmText,
      cancelText: options.cancelText,
      confirmVariant: options.confirmVariant || 'primary',
      onConfirm: options.onConfirm,
    });
  };

  const showAlert = (options: {
    title: string;
    message: string;
    variant?: AlertVariant;
  }) => {
    setDialogState({
      type: 'alert',
      title: options.title,
      message: options.message,
      alertVariant: options.variant || 'info',
    });
  };

  const closeDialog = () => {
    setDialogState(null);
  };

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    try {
      await updateProfile(profileData);
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      showAlert({
        title: t('error'),
        message: t('profileUpdateFailed'),
        variant: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showAlert({
        title: t('error'),
        message: t('passwordsMismatch'),
        variant: 'error',
      });
      return;
    }
    if (passwordData.newPassword.length < 8) {
      showAlert({
        title: t('error'),
        message: t('passwordTooShort'),
        variant: 'error',
      });
      return;
    }

    setIsSaving(true);
    try {
      await updatePassword({
        currentPassword: hasPassword ? passwordData.currentPassword : undefined,
        newPassword: passwordData.newPassword,
      });
      if (!hasPassword) await refreshUser();
      setShowPasswordChange(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      showAlert({
        title: t('success'),
        message: hasPassword ? t('passwordUpdated') : t('passwordSet'),
        variant: 'success',
      });
    } catch (e) {
      showAlert({
        title: t('error'),
        message: e instanceof Error ? e.message : t('passwordUpdateFailed'),
        variant: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePreferences = async () => {
    setIsSaving(true);
    try {
      await updatePreferences({ ...preferences, language: locale });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      showAlert({
        title: t('error'),
        message: t('preferencesUpdateFailed'),
        variant: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    showConfirm({
      title: t('signOut'),
      message: t('signOutConfirm'),
      confirmText: t('signOut'),
      cancelText: tc('cancel'),
      confirmVariant: 'danger',
      onConfirm: async () => {
        await logout();
        router.push('/login');
      },
    });
  };

  const handleDeleteAccount = () => {
    showConfirm({
      title: t('deleteAccount'),
      message: t('deleteAccountConfirm'),
      confirmText: t('deleteAccount'),
      cancelText: tc('cancel'),
      confirmVariant: 'danger',
      onConfirm: async () => {
        await logout();
        router.push('/login');
      },
    });
  };

  const checkPasswordStrength = (password: string) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    setPasswordStrength(score);
  };

  const getStrengthLabel = () => {
    switch (passwordStrength) {
      case 0:
        return t('strengthVeryWeak');
      case 1:
        return t('strengthWeak');
      case 2:
        return t('strengthFair');
      case 3:
        return t('strengthGood');
      case 4:
        return t('strengthStrong');
      default:
        return '';
    }
  };

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 0:
        return 'bg-[#EF4444]';
      case 1:
        return 'bg-[#EF4444]';
      case 2:
        return 'bg-[#F59E0B]';
      case 3:
        return 'bg-[#22C55E]';
      case 4:
        return 'bg-[#22C55E]';
      default:
        return 'bg-[#F3F4F6]';
    }
  };

  const settingsTabs = [
    { id: 'profile', label: t('tabProfile'), icon: <User size={18} /> },
    { id: 'security', label: t('tabSecurity'), icon: <Shield size={18} /> },
    {
      id: 'preferences',
      label: t('tabPreferences'),
      icon: <SettingsIcon size={18} />,
    },
    { id: 'payment', label: t('tabPayment'), icon: <CreditCard size={18} /> },
    { id: 'support', label: t('tabSupport'), icon: <HelpCircle size={18} /> },
  ];


  // FAQ items
  const faqs = [
    {
      id: 1,
      question: t('faq1Q'),
      answer: t('faq1A'),
    },
    {
      id: 2,
      question: t('faq2Q'),
      answer: t('faq2A'),
    },
    {
      id: 3,
      question: t('faq3Q'),
      answer: t('faq3A', { commission: REFERRAL_COMMISSION_LABEL }),
    },
    {
      id: 4,
      question: t('faq4Q'),
      answer: t('faq4A'),
    },
    {
      id: 5,
      question: t('faq5Q'),
      answer: t('faq5A'),
    },
  ];

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Dialogs */}
      {dialogState?.type === 'confirm' && (
        <ConfirmDialog
          isOpen={true}
          onClose={closeDialog}
          onConfirm={dialogState.onConfirm || (() => {})}
          title={dialogState.title}
          message={dialogState.message}
          confirmText={dialogState.confirmText}
          cancelText={dialogState.cancelText}
          confirmVariant={dialogState.confirmVariant || 'primary'}
        />
      )}
      {dialogState?.type === 'alert' && (
        <AlertDialog
          isOpen={true}
          onClose={closeDialog}
          title={dialogState.title}
          message={dialogState.message}
          type={dialogState.alertVariant || 'info'}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          className="hidden lg:flex w-10 h-10 rounded-xl border border-[#F3F4F6] items-center justify-center hover:border-[#2563EB] transition-colors" aria-label={tc('back')}
          onClick={() => router.back()}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold">{t('settings')}</h1>
          <p className="text-sm text-[#6B7280]">
            {t('settingsSubtitle')}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#F8FAFC] rounded-2xl p-1 border border-[#F3F4F6] overflow-x-auto">
        {settingsTabs.map((tab) => (
          <button
            key={tab.id}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap',
              activeTab === tab.id
                ? 'bg-white text-[#111827] shadow-sm'
                : 'text-[#6B7280] hover:text-[#111827]',
            )}
            onClick={() => setActiveTab(tab.id as SettingsTab)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Profile Header */}
          <div className="bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-[#3B82F6] rounded-2xl p-8 text-white text-center relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/5" />
            <div className="absolute -bottom-20 -left-10 w-40 h-40 rounded-full bg-white/5" />

            <div className="relative z-10">
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#60A5FA] to-[#2563EB] border-4 border-white/40 flex items-center justify-center text-3xl font-extrabold shadow-lg mx-auto">
                  {user?.name
                    ?.split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase() || 'U'}
                </div>
                <button
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white border-2 border-white flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                  aria-label={t('changePhoto')}
                  onClick={() => setIsEditing(true)}
                >
                  <Camera size={14} className="text-[#2563EB]" />
                </button>
              </div>
              <h2 className="text-xl font-bold mt-4">{user?.name || t('user')}</h2>
              <p className="text-white/75">
                {user?.email ?? ''}
              </p>
              <button
                className="mt-4 inline-flex items-center gap-2 bg-white/15 border border-white/30 text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-white/25 transition-colors"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 size={14} />
                {t('editProfile')}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 -mt-6 relative z-10">
            <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm p-4 text-center">
              <p className="text-lg font-extrabold text-[#2563EB]">
                {formatCurrency(data?.totalEarned ?? 0)}
              </p>
              <p className="text-xs text-[#6B7280]">{t('totalEarned')}</p>
            </div>
            <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm p-4 text-center">
              <p className="text-lg font-extrabold text-[#F59E0B]">{user?.plan ?? 'Free'}</p>
              <p className="text-xs text-[#6B7280]">{user?.badge ? t('badgeName', { badge: user.badge }) : t('plan')}</p>
            </div>
            <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm p-4 text-center">
              <p className="text-lg font-extrabold text-[#6B7280]">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString(LOCALE_TAGS[locale], { month: 'short', year: 'numeric' })
                  : '—'}
              </p>
              <p className="text-xs text-[#6B7280]">{t('memberSince')}</p>
            </div>
          </div>

          {/* Edit Profile Form */}
          {isEditing && (
            <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold">{t('editProfile')}</h3>
                <button
                  className="text-sm text-[#6B7280] hover:text-[#111827] transition-colors"
                  aria-label={tc('close')}
                  onClick={() => setIsEditing(false)}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-[#6B7280]">
                    {t('fullName')}
                  </label>
                  <div className="relative mt-1">
                    <User
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
                    />
                    <input
                      type="text"
                      className="w-full pl-11 pr-4 py-3 border border-[#F3F4F6] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all"
                      value={profileData.name}
                      onChange={(e) =>
                        setProfileData({ ...profileData, name: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#6B7280]">
                    {t('email')}
                  </label>
                  <div className="relative mt-1">
                    <Mail
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
                    />
                    <input
                      type="email"
                      className="w-full pl-11 pr-4 py-3 border border-[#F3F4F6] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all"
                      value={profileData.email}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#6B7280]">
                    {t('phone')}
                  </label>
                  <div className="relative mt-1">
                    <Phone
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
                    />
                    <input
                      type="tel"
                      className="w-full pl-11 pr-4 py-3 border border-[#F3F4F6] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all"
                      value={profileData.phone}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          phone: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <button
                  className="w-full bg-[#2563EB] text-white font-bold py-3 rounded-xl hover:bg-[#1D4ED8] transition-colors flex items-center justify-center gap-2"
                  onClick={handleUpdateProfile}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}
                  {isSaving ? t('saving') : t('saveChanges')}
                </button>
                {saveSuccess && (
                  <div className="flex items-center gap-2 text-[#22C55E] text-sm font-medium justify-center">
                    <Check size={16} />
                    {t('profileUpdated')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Settings Sections */}
          <div className="space-y-4">
            {[
              {
                icon: <Award size={18} />,
                title: t('myBadges'),
                subtitle: t('badgesHint'),
                onClick: () => router.push('/badges'),
              },
              {
                icon: <Crown size={18} />,
                title: t('myPlan'),
                subtitle:
                  !user?.plan || user.plan === 'Free'
                    ? t('freeUpgrade')
                    : t('namedPlan', { plan: user.plan }),
                badge: undefined as string | undefined,
                badgeColor: undefined as string | undefined,
                onClick: () => router.push('/plans'),
              },
              {
                icon: <Users size={18} />,
                title: t('referrals'),
                subtitle: t('referralsHint'),
                onClick: () => router.push('/referrals'),
              },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-4 bg-white rounded-2xl border border-[#F3F4F6] shadow-sm p-4 cursor-pointer hover:shadow-md transition-all"
                onClick={item.onClick}
              >
                <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#2563EB]">
                  {item.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">{item.title}</p>
                  <p className="text-xs text-[#6B7280]">{item.subtitle}</p>
                </div>
                {item.badge && (
                  <span
                    className={cn(
                      'text-xs font-bold text-white px-2 py-1 rounded-full',
                      item.badgeColor || 'bg-[#6B7280]',
                    )}
                  >
                    {item.badge}
                  </span>
                )}
                <ChevronRight size={16} className="text-[#9CA3AF]" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Security Score */}
          <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold">{t('securityLevel')}</h3>
                <p className="text-xs text-[#6B7280]">
                  {t('enable2faHint')}
                </p>
              </div>
              <span className="text-2xl font-extrabold text-[#F59E0B]">
                75%
              </span>
            </div>
            <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
              <div className="h-full w-[75%] bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] rounded-full" />
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F3F4F6]">
              <h3 className="text-sm font-bold">{t('accountSecurity')}</h3>
            </div>

            {/* Change Password */}
            <div
              className="flex items-center gap-4 px-5 py-4 border-b border-[#F3F4F6] cursor-pointer hover:bg-[#F8FAFC] transition-colors"
              onClick={() => setShowPasswordChange(!showPasswordChange)}
            >
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#2563EB]">
                <Key size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">
                  {hasPassword ? t('changePassword') : t('setPassword')}
                </p>
                <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
                  {hasPassword
                    ? viaGoogle
                      ? t('googleOrPassword')
                      : t('strongPasswordHint')
                    : t('googleOnlyHint')}
                </p>
              </div>
              <ChevronDown
                size={16}
                className={cn(
                  'text-[#9CA3AF] transition-transform',
                  showPasswordChange && 'rotate-180',
                )}
              />
            </div>

            {showPasswordChange && (
              <div className="px-5 py-4 border-b border-[#F3F4F6] bg-[#F8FAFC]">
                <div className="space-y-4">
                  {hasPassword && (
                  <div>
                    <label className="text-sm font-medium text-[#6B7280]">
                      {t('currentPassword')}
                    </label>
                    <div className="relative mt-1">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="w-full px-4 py-3 border border-[#F3F4F6] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all bg-white"
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            currentPassword: e.target.value,
                          })
                        }
                      />
                      <button
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#111827]"
                        aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-[#6B7280]">
                      {t('newPassword')}
                    </label>
                    <div className="relative mt-1">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="w-full px-4 py-3 border border-[#F3F4F6] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all bg-white"
                        value={passwordData.newPassword}
                        onChange={(e) => {
                          setPasswordData({
                            ...passwordData,
                            newPassword: e.target.value,
                          });
                          checkPasswordStrength(e.target.value);
                        }}
                      />
                    </div>
                    {passwordData.newPassword && (
                      <div className="mt-2">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className={cn(
                                'flex-1 h-1.5 rounded-full transition-all',
                                i <= passwordStrength
                                  ? getStrengthColor()
                                  : 'bg-[#F3F4F6]',
                              )}
                            />
                          ))}
                        </div>
                        <p
                          className={cn(
                            'text-xs mt-1 font-medium',
                            passwordStrength <= 1
                              ? 'text-[#EF4444]'
                              : passwordStrength <= 2
                                ? 'text-[#F59E0B]'
                                : 'text-[#22C55E]',
                          )}
                        >
                          {getStrengthLabel()}
                        </p>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#6B7280]">
                      {t('confirmPassword')}
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="w-full mt-1 px-4 py-3 border border-[#F3F4F6] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all bg-white"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          confirmPassword: e.target.value,
                        })
                      }
                    />
                  </div>
                  <button
                    className="w-full bg-[#2563EB] text-white font-bold py-3 rounded-xl hover:bg-[#1D4ED8] transition-colors flex items-center justify-center gap-2"
                    onClick={handleChangePassword}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Lock size={18} />
                    )}
                    {isSaving ? t('updating') : t('updatePassword')}
                  </button>
                </div>
              </div>
            )}

            {/* 2FA */}
            <div className="flex items-center gap-4 px-5 py-4 border-b border-[#F3F4F6]">
              <div className="w-10 h-10 rounded-xl bg-[#FFFBEB] flex items-center justify-center text-[#F59E0B]">
                <Fingerprint size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">{t('twoFactor')}</p>
                <p className="text-xs text-[#6B7280]">
                  {t('twoFactorHint')}
                </p>
              </div>
              <button
                className={cn(
                  'w-12 h-7 rounded-full transition-colors relative',
                  show2FA ? 'bg-[#22C55E]' : 'bg-[#D1D5DB]',
                )}
                aria-label={t('twoFactor')}
                aria-pressed={show2FA}
                onClick={() => setShow2FA(!show2FA)}
              >
                <div
                  className={cn(
                    'absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform keep-light',
                    show2FA ? 'right-0.5' : 'left-0.5',
                  )}
                />
              </button>
            </div>

          </div>

          {/* Active Sessions */}
          <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F3F4F6]">
              <h3 className="text-sm font-bold">{t('activeSessions')}</h3>
            </div>
            {sessionsList === null ? (
              <p className="px-5 py-4 text-xs text-[#6B7280]">{tc('loading')}</p>
            ) : (
              sessionsList.map((session, index) => (
                <div
                  key={session.id}
                  className={cn(
                    'flex items-center gap-4 px-5 py-4',
                    index !== sessionsList.length - 1 && 'border-b border-[#F3F4F6]',
                  )}
                >
                  <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] flex items-center justify-center flex-shrink-0">
                    {session.current ? <Smartphone size={20} className="text-[#6B7280]" /> : <Monitor size={20} className="text-[#6B7280]" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">{session.current ? t('thisDevice') : t('otherDevice')}</p>
                    <p className="text-xs text-[#6B7280]">
                      {t('signedInOn', { date: new Date(session.createdAt).toLocaleString(LOCALE_TAGS[locale], { dateStyle: 'medium', timeStyle: 'short' }) })}
                    </p>
                  </div>
                  {session.current ? (
                    <span className="text-xs font-bold text-[#22C55E] bg-[#F0FDF4] px-3 py-1 rounded-full">
                      {t('current')}
                    </span>
                  ) : (
                    <button
                      className="text-xs font-semibold text-[#EF4444] hover:underline"
                      onClick={() => void revokeSession(session.id)}
                    >
                      {t('revoke')}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Logout All */}
          <button
            className="w-full py-4 rounded-xl border border-[#EF4444] text-[#EF4444] font-bold hover:bg-[#FEF2F2] transition-colors flex items-center justify-center gap-2"
            onClick={() => {
              showConfirm({
                title: t('logoutAllDevices'),
                message: t('logoutAllConfirm'),
                confirmText: t('logoutAll'),
                cancelText: tc('cancel'),
                confirmVariant: 'danger',
                onConfirm: async () => {
                  const res = await fetch('/api/user/sessions?all=others', { method: 'DELETE' });
                  const json = await res.json().catch(() => ({}));
                  await loadSessions();
                  showAlert({
                    title: res.ok ? t('success') : t('error'),
                    message: res.ok ? t('sessionsSignedOut', { count: json.signedOut ?? 0 }) : json.error || t('error'),
                    variant: res.ok ? 'success' : 'error',
                  });
                },
              });
            }}
          >
            <LogOut size={18} />
            {t('logoutAllDevices')}
          </button>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="space-y-6">
          {/* Notifications */}
          <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F3F4F6]">
              <h3 className="text-sm font-bold">{t('notifications')}</h3>
            </div>
            {[
              {
                id: 'notifications',
                label: t('pushNotifications'),
                desc: t('pushHint'),
                icon: <Bell size={18} />,
                iconBg: 'bg-[#EFF6FF]',
                iconColor: 'text-[#2563EB]',
              },
              {
                id: 'emailNotifications',
                label: t('emailNotifications'),
                desc: t('emailHint'),
                icon: <Mail size={18} />,
                iconBg: 'bg-[#F0FDF4]',
                iconColor: 'text-[#22C55E]',
              },
              {
                id: 'soundEffects',
                label: t('soundEffects'),
                desc: t('soundHint'),
                icon: <Volume2 size={18} />,
                iconBg: 'bg-[#FFFBEB]',
                iconColor: 'text-[#F59E0B]',
              },
            ].map((item) => (
              <div
                key={item.id}
                className={cn(
                  'flex items-center gap-4 px-5 py-4',
                  item.id !== 'soundEffects' && 'border-b border-[#F3F4F6]',
                )}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center',
                    item.iconBg,
                    item.iconColor,
                  )}
                >
                  {item.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">{item.label}</p>
                  <p className="text-xs text-[#6B7280]">{item.desc}</p>
                </div>
                <button
                  className={cn(
                    'w-12 h-7 rounded-full transition-colors relative',
                    preferences[item.id as keyof typeof preferences]
                      ? 'bg-[#22C55E]'
                      : 'bg-[#D1D5DB]',
                  )}
                  onClick={() =>
                    setPreferences({
                      ...preferences,
                      [item.id]:
                        !preferences[item.id as keyof typeof preferences],
                    })
                  }
                >
                  <div
                    className={cn(
                      'absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform keep-light',
                      preferences[item.id as keyof typeof preferences]
                        ? 'right-0.5'
                        : 'left-0.5',
                    )}
                  />
                </button>
              </div>
            ))}
          </div>

          {/* Appearance */}
          <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F3F4F6]">
              <h3 className="text-sm font-bold">{t('appearance')}</h3>
            </div>
            <div className="flex items-center gap-4 px-5 py-4 border-b border-[#F3F4F6]">
              <div className="w-10 h-10 rounded-xl bg-[#1E293B] flex items-center justify-center text-white">
                {dark ? <Moon size={18} /> : <Sun size={18} />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">{t('darkMode')}</p>
                <p className="text-xs text-[#6B7280]">{t('darkModeHint')}</p>
              </div>
              <button
                className={cn(
                  'w-12 h-7 rounded-full transition-colors relative',
                  dark ? 'bg-[#22C55E]' : 'bg-[#D1D5DB]',
                )}
                aria-label={t('darkMode')}
                aria-pressed={dark}
                onClick={() => {
                  // Applies immediately and is remembered on this device; the
                  // top-bar toggle uses the same setting.
                  toggleTheme();
                  setPreferences({ ...preferences, darkMode: !dark });
                }}
              >
                <div
                  className={cn(
                    'keep-light absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform',
                    dark ? 'right-0.5' : 'left-0.5',
                  )}
                />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] border border-[#F3F4F6] flex items-center justify-center">
                  <Globe size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">{tc('language')}</p>
                  <p className="text-xs text-[#6B7280]">
                    {t('languageHint')}
                  </p>
                </div>
              </div>
              {/* Applies immediately and is remembered on this device. */}
              <LanguageSwitcher />
            </div>
          </div>

          {/* Privacy */}
          <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F3F4F6]">
              <h3 className="text-sm font-bold">{t('privacy')}</h3>
            </div>
            {[
              {
                id: 'analytics',
                label: t('analytics'),
                desc: t('analyticsHint'),
                icon: <BarChart3 size={18} />,
                iconBg: 'bg-[#EFF6FF]',
                iconColor: 'text-[#2563EB]',
              },
              {
                id: 'showOnLeaderboard',
                label: t('showOnLeaderboard'),
                desc: t('leaderboardHint'),
                icon: <Users size={18} />,
                iconBg: 'bg-[#F5F3FF]',
                iconColor: 'text-[#8B5CF6]',
              },
            ].map((item) => (
              <div
                key={item.id}
                className={cn(
                  'flex items-center gap-4 px-5 py-4',
                  item.id !== 'showOnLeaderboard' &&
                    'border-b border-[#F3F4F6]',
                )}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center',
                    item.iconBg,
                    item.iconColor,
                  )}
                >
                  {item.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">{item.label}</p>
                  <p className="text-xs text-[#6B7280]">{item.desc}</p>
                </div>
                <button
                  className={cn(
                    'w-12 h-7 rounded-full transition-colors relative',
                    preferences[item.id as keyof typeof preferences]
                      ? 'bg-[#22C55E]'
                      : 'bg-[#D1D5DB]',
                  )}
                  onClick={() =>
                    setPreferences({
                      ...preferences,
                      [item.id]:
                        !preferences[item.id as keyof typeof preferences],
                    })
                  }
                >
                  <div
                    className={cn(
                      'absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform keep-light',
                      preferences[item.id as keyof typeof preferences]
                        ? 'right-0.5'
                        : 'left-0.5',
                    )}
                  />
                </button>
              </div>
            ))}
          </div>

          {/* Save Button */}
          <button
            className="w-full bg-[#2563EB] text-white font-bold py-3 rounded-xl hover:bg-[#1D4ED8] transition-colors flex items-center justify-center gap-2"
            onClick={handleUpdatePreferences}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {isSaving ? t('saving') : t('savePreferences')}
          </button>
          {saveSuccess && (
            <div className="flex items-center gap-2 text-[#22C55E] text-sm font-medium justify-center">
              <Check size={16} />
              {t('preferencesUpdated')}
            </div>
          )}
        </div>
      )}

      {/* Payment Tab */}
      {activeTab === 'payment' && (
        <div className="space-y-6">
          <p className="text-sm text-[#6B7280]">
            {t('paymentIntro')}
          </p>

          <div className="bg-white rounded-2xl border-2 border-[#2563EB] p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <Smartphone size={30} className="text-[#2563EB] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">{t('mobileMoney')}</p>
                <p className="text-xs text-[#6B7280] truncate">
                  {payoutNumber ? t('lastUsedNumber', { number: payoutNumber }) : t('noPayoutYet')}
                </p>
              </div>
              <Link
                href="/wallet/withdraw"
                className="text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-3 py-1.5 rounded-full hover:bg-[#DBEAFE]"
              >
                {t('goWithdraw')}
              </Link>
            </div>
            <p className="mt-3 pt-3 border-t border-[#F3F4F6] text-xs text-[#6B7280]">{t('payoutNumberHint')}</p>
          </div>

          {/* Info Note */}
          <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl p-4 flex gap-3">
            <AlertTriangle
              size={20}
              className="text-[#2563EB] flex-shrink-0 mt-0.5"
            />
            <div>
              <p className="text-sm font-semibold text-[#2563EB]">
                {t('payoutBefore')}{' '}
                <strong>{t('payoutTime')}</strong>
              </p>
              <p className="text-sm text-[#2563EB]/80 mt-0.5">
                {t('payoutAfter')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Support Tab */}
      {activeTab === 'support' && (
        <div className="space-y-6">
          {/* Hero */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-[#3B82F6] p-8 text-white text-center">
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/5" />
            <div className="absolute -bottom-20 -left-10 w-40 h-40 rounded-full bg-white/5" />

            <div className="relative z-10">
              <div className="w-16 h-16 rounded-full bg-white/15 border-2 border-white/25 flex items-center justify-center text-3xl mx-auto mb-4">
                <Headphones size={28} />
              </div>
              <h2 className="text-xl font-bold">{t('howCanWeHelp')}</h2>
              <p className="text-white/75">{t('support247')}</p>
            </div>
          </div>

          {/* Contact Options */}
          <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F3F4F6]">
              <h3 className="text-sm font-bold">{t('contactUs')}</h3>
            </div>
            {[
              {
                icon: MessageCircle,
                title: t('liveChat'),
                desc: t('liveChatHint'),
                badge: t('online'),
                badgeColor: 'bg-[#22C55E]',
              },
              {
                icon: Mail,
                title: t('emailSupport'),
                desc: 'support@boostly.buzz',
              },
              {
                icon: Phone,
                title: t('callSupport'),
                desc: `+250 788 000 000 · ${t('callHours')}`,
              },
            ].map((item, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-[#F8FAFC] transition-colors',
                  index !== 2 && 'border-b border-[#F3F4F6]',
                )}
                onClick={() => {
                  showAlert({
                    title: item.title,
                    message: t('openingSoon', { name: item.title }),
                    variant: 'info',
                  });
                }}
              >
                <item.icon size={24} className="text-[#2563EB] flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-bold">{item.title}</p>
                  <p className="text-xs text-[#6B7280]">{item.desc}</p>
                </div>
                {item.badge && (
                  <span
                    className={cn(
                      'text-xs font-bold text-white px-3 py-1 rounded-full flex items-center gap-1',
                      item.badgeColor || 'bg-[#6B7280]',
                    )}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    {item.badge}
                  </span>
                )}
                <ChevronRight size={16} className="text-[#9CA3AF]" />
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F3F4F6]">
              <h3 className="text-sm font-bold">{t('faqTitle')}</h3>
            </div>
            {faqs.map((faq) => (
              <div
                key={faq.id}
                className="border-b border-[#F3F4F6] last:border-b-0"
              >
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#F8FAFC] transition-colors"
                  onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                >
                  <span className="text-sm font-medium">{faq.question}</span>
                  <ChevronDown
                    size={16}
                    className={cn(
                      'text-[#9CA3AF] transition-transform flex-shrink-0 ml-4',
                      openFaq === faq.id && 'rotate-180',
                    )}
                  />
                </button>
                {openFaq === faq.id && (
                  <div className="px-5 pb-4 text-sm text-[#6B7280] leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* App Version */}
          <div className="flex items-center justify-between bg-white rounded-2xl border border-[#F3F4F6] shadow-sm p-5">
            <div>
              <p className="text-sm font-bold">{t('appVersion')}</p>
              <p className="text-xs text-[#6B7280]">v2.4.1 · {t('upToDate')}</p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#22C55E] bg-[#F0FDF4] px-3 py-1 rounded-full">
              <Check size={12} /> {t('latest')}
            </span>
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-2xl p-5 mt-6">
        <h4 className="text-sm font-bold text-[#EF4444] mb-3">{t('dangerZone')}</h4>
        <div className="flex flex-wrap gap-3">
          <button
            className="px-4 py-2 rounded-xl border border-[#EF4444] text-[#EF4444] text-sm font-medium hover:bg-[#FEF2F2] transition-colors"
            onClick={() => {
              showConfirm({
                title: t('logoutAllDevices'),
                message: t('logoutAllConfirm'),
                confirmText: t('logoutAll'),
                cancelText: tc('cancel'),
                confirmVariant: 'danger',
                onConfirm: () => {
                  showAlert({
                    title: t('success'),
                    message: t('sessionsTerminated'),
                    variant: 'success',
                  });
                },
              });
            }}
          >
            {t('logoutAllDevices')}
          </button>
          <button
            className="px-4 py-2 rounded-xl bg-[#EF4444] text-white text-sm font-medium hover:bg-[#DC2626] transition-colors"
            onClick={handleDeleteAccount}
          >
            {t('deleteAccount')}
          </button>
        </div>
      </div>

      {/* Sign Out */}
      <button
        className="w-full py-4 rounded-xl bg-[#EF4444] text-white font-bold hover:bg-[#DC2626] transition-colors flex items-center justify-center gap-2"
        onClick={handleLogout}
      >
        <LogOut size={18} />
        {t('signOut')}
      </button>
    </div>
  );
}

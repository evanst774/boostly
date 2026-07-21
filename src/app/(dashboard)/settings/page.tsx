// src/app/(dashboard)/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
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
  Plus,
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
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/hooks/useSettings';
import { cn, formatCurrency } from '@/lib/utils';
import { ConfirmDialog, AlertDialog } from '@/components/ui/Dialog';

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
  const { user, logout } = useAuth();
  const { data, updateProfile, updatePassword, updatePreferences } =
    useSettings();

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
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
        title: 'Error',
        message: 'Failed to update profile. Please try again.',
        variant: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showAlert({
        title: 'Error',
        message: 'Passwords do not match.',
        variant: 'error',
      });
      return;
    }
    if (passwordData.newPassword.length < 8) {
      showAlert({
        title: 'Error',
        message: 'Password must be at least 8 characters.',
        variant: 'error',
      });
      return;
    }

    setIsSaving(true);
    try {
      await updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setShowPasswordChange(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      showAlert({
        title: 'Success',
        message: 'Password updated successfully!',
        variant: 'success',
      });
    } catch {
      showAlert({
        title: 'Error',
        message: 'Failed to update password. Please try again.',
        variant: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePreferences = async () => {
    setIsSaving(true);
    try {
      await updatePreferences(preferences);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      showAlert({
        title: 'Error',
        message: 'Failed to update preferences.',
        variant: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    showConfirm({
      title: 'Sign Out',
      message: 'Are you sure you want to sign out?',
      confirmText: 'Sign Out',
      cancelText: 'Cancel',
      confirmVariant: 'danger',
      onConfirm: async () => {
        await logout();
        router.push('/auth/login');
      },
    });
  };

  const handleDeleteAccount = () => {
    showConfirm({
      title: 'Delete Account',
      message:
        'Are you sure you want to delete your account? This action cannot be undone.',
      confirmText: 'Delete Account',
      cancelText: 'Cancel',
      confirmVariant: 'danger',
      onConfirm: async () => {
        await logout();
        router.push('/auth/login');
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
        return 'Very Weak';
      case 1:
        return 'Weak';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Strong';
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
    { id: 'profile', label: 'Profile', icon: <User size={18} /> },
    { id: 'security', label: 'Security', icon: <Shield size={18} /> },
    {
      id: 'preferences',
      label: 'Preferences',
      icon: <SettingsIcon size={18} />,
    },
    { id: 'payment', label: 'Payment', icon: <CreditCard size={18} /> },
    { id: 'support', label: 'Support', icon: <HelpCircle size={18} /> },
  ];

  // Payment methods
  const paymentMethods = [
    {
      id: 'mobile',
      name: 'Mobile Money',
      detail: '+250 780 123 XXX · Airtime / MTN',
      default: true,
      icon: '📱',
    },
    {
      id: 'bank',
      name: 'Bank Account',
      detail: 'BK · **** **** **** 1234',
      default: false,
      icon: '🏦',
    },
  ];

  // FAQ items
  const faqs = [
    {
      id: 1,
      question: 'How do I withdraw my earnings?',
      answer:
        'Withdrawals are processed on the 1st–5th of each month. Go to Wallet → Withdraw, select your preferred method (Mobile Money or Bank Transfer), enter the amount and confirm.',
    },
    {
      id: 2,
      question: 'How do verification badges work?',
      answer:
        'Verification badges are one-time purchases that boost your earnings. Silver gives +15%, Gold gives +30%, and Platinum gives +30% plus VIP support.',
    },
    {
      id: 3,
      question: 'How does the referral program work?',
      answer:
        'Share your unique referral code with friends. When they sign up and start earning, you receive 200 RWF per referral. No limit on referrals!',
    },
    {
      id: 4,
      question: "What's the minimum withdrawal amount?",
      answer:
        'The minimum withdrawal amount is 1,000 RWF. There are no fees for Mobile Money transfers.',
    },
    {
      id: 5,
      question: 'Can I cancel my subscription?',
      answer:
        'Yes, you can cancel your subscription at any time from Settings → My Subscription → Manage Subscription.',
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
          className="w-10 h-10 rounded-xl border border-[#F3F4F6] flex items-center justify-center hover:border-[#2563EB] transition-colors"
          onClick={() => router.back()}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold">Settings</h1>
          <p className="text-sm text-[#6B7280]">
            Manage your account and preferences
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
                  onClick={() => setIsEditing(true)}
                >
                  <Camera size={14} className="text-[#2563EB]" />
                </button>
              </div>
              <h2 className="text-xl font-bold mt-4">{user?.name || 'User'}</h2>
              <p className="text-white/75">
                {user?.email || 'user@example.com'}
              </p>
              <button
                className="mt-4 inline-flex items-center gap-2 bg-white/15 border border-white/30 text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-white/25 transition-colors"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 size={14} />
                Edit Profile
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 -mt-6 relative z-10">
            <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm p-4 text-center">
              <p className="text-lg font-extrabold text-[#2563EB]">
                {formatCurrency(data?.totalEarned || 45750)}
              </p>
              <p className="text-xs text-[#6B7280]">Total Earned</p>
            </div>
            <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm p-4 text-center">
              <p className="text-lg font-extrabold text-[#F59E0B]">Gold</p>
              <p className="text-xs text-[#6B7280]">Badge Tier</p>
            </div>
            <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm p-4 text-center">
              <p className="text-lg font-extrabold text-[#6B7280]">
                May 15, 2024
              </p>
              <p className="text-xs text-[#6B7280]">Member Since</p>
            </div>
          </div>

          {/* Edit Profile Form */}
          {isEditing && (
            <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold">Edit Profile</h3>
                <button
                  className="text-sm text-[#6B7280] hover:text-[#111827] transition-colors"
                  onClick={() => setIsEditing(false)}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-[#6B7280]">
                    Full Name
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
                    Email
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
                    Phone
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
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                {saveSuccess && (
                  <div className="flex items-center gap-2 text-[#22C55E] text-sm font-medium justify-center">
                    <Check size={16} />
                    Profile updated successfully!
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
                title: 'My Badges',
                subtitle: 'Gold Badge — Active',
                badge: 'Active',
                badgeColor: 'bg-[#22C55E]',
                onClick: () => router.push('/badges'),
              },
              {
                icon: <Crown size={18} />,
                title: 'My Subscription',
                subtitle: 'Pro Plan — Active',
                badge: 'Active',
                badgeColor: 'bg-[#22C55E]',
                onClick: () => router.push('/badges'),
              },
              {
                icon: <Users size={18} />,
                title: 'Referrals',
                subtitle: '23 friends invited',
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
                <h3 className="text-sm font-bold">Security Level</h3>
                <p className="text-xs text-[#6B7280]">
                  Enable 2FA to reach 100%
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
              <h3 className="text-sm font-bold">Account Security</h3>
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
                <p className="text-sm font-bold">Change Password</p>
                <p className="text-xs text-[#6B7280]">
                  Last changed 30 days ago
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
                  <div>
                    <label className="text-sm font-medium text-[#6B7280]">
                      Current Password
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
                  <div>
                    <label className="text-sm font-medium text-[#6B7280]">
                      New Password
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
                      Confirm Password
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
                    {isSaving ? 'Updating...' : 'Update Password'}
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
                <p className="text-sm font-bold">Two-Factor Authentication</p>
                <p className="text-xs text-[#6B7280]">
                  Add an extra layer of security
                </p>
              </div>
              <button
                className={cn(
                  'w-12 h-7 rounded-full transition-colors relative',
                  show2FA ? 'bg-[#22C55E]' : 'bg-[#D1D5DB]',
                )}
                onClick={() => setShow2FA(!show2FA)}
              >
                <div
                  className={cn(
                    'absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform',
                    show2FA ? 'right-0.5' : 'left-0.5',
                  )}
                />
              </button>
            </div>

            {/* Login Alerts */}
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] flex items-center justify-center text-[#22C55E]">
                <Bell size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">Login Alerts</p>
                <p className="text-xs text-[#6B7280]">
                  Get notified on new logins
                </p>
              </div>
              <button className="w-12 h-7 rounded-full bg-[#22C55E] relative">
                <div className="absolute top-0.5 right-0.5 w-6 h-6 rounded-full bg-white shadow-sm" />
              </button>
            </div>
          </div>

          {/* Active Sessions */}
          <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F3F4F6]">
              <h3 className="text-sm font-bold">Active Sessions</h3>
            </div>
            {[
              {
                device: 'iPhone 14 Pro',
                location: 'Kigali, Rwanda',
                time: 'Just now',
                current: true,
                icon: '📱',
              },
              {
                device: 'MacBook Pro',
                location: 'Kigali, Rwanda',
                time: '2 hours ago',
                current: false,
                icon: '💻',
              },
              {
                device: 'Windows PC',
                location: 'Musanze, Rwanda',
                time: 'Yesterday',
                current: false,
                icon: '🖥️',
              },
            ].map((session, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-center gap-4 px-5 py-4',
                  index !== 2 && 'border-b border-[#F3F4F6]',
                )}
              >
                <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] flex items-center justify-center text-xl flex-shrink-0">
                  {session.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">{session.device}</p>
                  <p className="text-xs text-[#6B7280]">
                    {session.location} · {session.time}
                  </p>
                </div>
                {session.current ? (
                  <span className="text-xs font-bold text-[#22C55E] bg-[#F0FDF4] px-3 py-1 rounded-full">
                    Current
                  </span>
                ) : (
                  <button className="text-xs font-semibold text-[#EF4444] hover:underline">
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Logout All */}
          <button
            className="w-full py-4 rounded-xl border border-[#EF4444] text-[#EF4444] font-bold hover:bg-[#FEF2F2] transition-colors flex items-center justify-center gap-2"
            onClick={() => {
              showConfirm({
                title: 'Logout All Devices',
                message:
                  'This will log out all devices including this one. Continue?',
                confirmText: 'Logout All',
                cancelText: 'Cancel',
                confirmVariant: 'danger',
                onConfirm: () => {
                  showAlert({
                    title: 'Success',
                    message: 'All sessions terminated successfully.',
                    variant: 'success',
                  });
                },
              });
            }}
          >
            <LogOut size={18} />
            Logout All Devices
          </button>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="space-y-6">
          {/* Notifications */}
          <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F3F4F6]">
              <h3 className="text-sm font-bold">Notifications</h3>
            </div>
            {[
              {
                id: 'notifications',
                label: 'Push Notifications',
                desc: 'Get notified about rewards & bonuses',
                icon: <Bell size={18} />,
                iconBg: 'bg-[#EFF6FF]',
                iconColor: 'text-[#2563EB]',
              },
              {
                id: 'emailNotifications',
                label: 'Email Notifications',
                desc: 'Weekly summaries and updates',
                icon: <Mail size={18} />,
                iconBg: 'bg-[#F0FDF4]',
                iconColor: 'text-[#22C55E]',
              },
              {
                id: 'soundEffects',
                label: 'Sound Effects',
                desc: 'In-app sounds for rewards',
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
                      'absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform',
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
              <h3 className="text-sm font-bold">Appearance</h3>
            </div>
            <div className="flex items-center gap-4 px-5 py-4 border-b border-[#F3F4F6]">
              <div className="w-10 h-10 rounded-xl bg-[#1E293B] flex items-center justify-center text-white">
                {preferences.darkMode ? <Moon size={18} /> : <Sun size={18} />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">Dark Mode</p>
                <p className="text-xs text-[#6B7280]">Switch to dark theme</p>
              </div>
              <button
                className={cn(
                  'w-12 h-7 rounded-full transition-colors relative',
                  preferences.darkMode ? 'bg-[#22C55E]' : 'bg-[#D1D5DB]',
                )}
                onClick={() =>
                  setPreferences({
                    ...preferences,
                    darkMode: !preferences.darkMode,
                  })
                }
              >
                <div
                  className={cn(
                    'absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform',
                    preferences.darkMode ? 'right-0.5' : 'left-0.5',
                  )}
                />
              </button>
            </div>
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] border border-[#F3F4F6] flex items-center justify-center">
                <Globe size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">Language</p>
                <p className="text-xs text-[#6B7280]">
                  Choose your preferred language
                </p>
              </div>
              <select
                className="px-3 py-2 border border-[#F3F4F6] rounded-xl text-sm bg-white focus:border-[#2563EB] outline-none"
                value={preferences.language}
                onChange={(e) =>
                  setPreferences({ ...preferences, language: e.target.value })
                }
              >
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="rw">Kinyarwanda</option>
                <option value="sw">Swahili</option>
              </select>
            </div>
          </div>

          {/* Privacy */}
          <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F3F4F6]">
              <h3 className="text-sm font-bold">Privacy</h3>
            </div>
            {[
              {
                id: 'analytics',
                label: 'Analytics',
                desc: 'Share usage data to improve the app',
                icon: <BarChart3 size={18} />,
                iconBg: 'bg-[#EFF6FF]',
                iconColor: 'text-[#2563EB]',
              },
              {
                id: 'showOnLeaderboard',
                label: 'Show on Leaderboard',
                desc: 'Let others see your ranking',
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
                      'absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform',
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
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </button>
          {saveSuccess && (
            <div className="flex items-center gap-2 text-[#22C55E] text-sm font-medium justify-center">
              <Check size={16} />
              Preferences updated successfully!
            </div>
          )}
        </div>
      )}

      {/* Payment Tab */}
      {activeTab === 'payment' && (
        <div className="space-y-6">
          <p className="text-sm text-[#6B7280]">
            Manage your withdrawal methods. The default method is used for
            automatic payouts.
          </p>

          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className={cn(
                'bg-white rounded-2xl border-2 p-5 transition-all cursor-pointer',
                method.default
                  ? 'border-[#2563EB] shadow-sm'
                  : 'border-[#F3F4F6] hover:border-[#2563EB]',
              )}
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">{method.icon}</div>
                <div className="flex-1">
                  <p className="text-sm font-bold">{method.name}</p>
                  <p className="text-xs text-[#6B7280]">{method.detail}</p>
                </div>
                {method.default && (
                  <span className="text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-3 py-1 rounded-full">
                    Default
                  </span>
                )}
                <button className="w-8 h-8 rounded-lg border border-[#F3F4F6] flex items-center justify-center hover:border-[#2563EB] transition-colors">
                  <Edit2 size={14} className="text-[#6B7280]" />
                </button>
              </div>
              {method.default && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#F3F4F6]">
                  <Check size={14} className="text-[#22C55E]" />
                  <span className="text-xs text-[#22C55E] font-medium">
                    Verified · Used for last withdrawal
                  </span>
                </div>
              )}
            </div>
          ))}

          {/* Add Method */}
          <button
            className="w-full py-4 rounded-2xl border-2 border-dashed border-[#F3F4F6] text-[#6B7280] font-semibold hover:border-[#2563EB] hover:text-[#2563EB] transition-colors flex items-center justify-center gap-2"
            onClick={() => {
              showAlert({
                title: 'Coming Soon',
                message: 'Add new payment method will be available soon.',
                variant: 'info',
              });
            }}
          >
            <Plus size={18} />
            Add New Method
          </button>

          {/* Info Note */}
          <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl p-4 flex gap-3">
            <AlertTriangle
              size={20}
              className="text-[#2563EB] flex-shrink-0 mt-0.5"
            />
            <div>
              <p className="text-sm font-semibold text-[#2563EB]">
                Withdrawals are processed on the{' '}
                <strong>1st–5th of each month</strong>
              </p>
              <p className="text-sm text-[#2563EB]/80 mt-0.5">
                Make sure your payment method is verified before the payout
                date.
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
                🎧
              </div>
              <h2 className="text-xl font-bold">How can we help?</h2>
              <p className="text-white/75">Our support team is here 24/7</p>
            </div>
          </div>

          {/* Contact Options */}
          <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F3F4F6]">
              <h3 className="text-sm font-bold">Contact Us</h3>
            </div>
            {[
              {
                icon: '💬',
                title: 'Live Chat',
                desc: 'Available 24/7 · Avg response: 2 min',
                badge: 'Online',
                badgeColor: 'bg-[#22C55E]',
              },
              {
                icon: '📧',
                title: 'Email Support',
                desc: 'support@boostly.buzz',
              },
              {
                icon: '📞',
                title: 'Call Support',
                desc: '+250 788 000 000 · Mon–Fri 8am–6pm',
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
                    message: `Opening ${item.title}... This feature will be available soon.`,
                    variant: 'info',
                  });
                }}
              >
                <div className="text-2xl">{item.icon}</div>
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
              <h3 className="text-sm font-bold">Frequently Asked Questions</h3>
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
              <p className="text-sm font-bold">App Version</p>
              <p className="text-xs text-[#6B7280]">v2.4.1 · Up to date</p>
            </div>
            <span className="text-xs font-bold text-[#22C55E] bg-[#F0FDF4] px-3 py-1 rounded-full">
              ✓ Latest
            </span>
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-2xl p-5 mt-6">
        <h4 className="text-sm font-bold text-[#EF4444] mb-3">Danger Zone</h4>
        <div className="flex flex-wrap gap-3">
          <button
            className="px-4 py-2 rounded-xl border border-[#EF4444] text-[#EF4444] text-sm font-medium hover:bg-[#FEF2F2] transition-colors"
            onClick={() => {
              showConfirm({
                title: 'Logout All Devices',
                message:
                  'This will log out all devices including this one. Continue?',
                confirmText: 'Logout All',
                cancelText: 'Cancel',
                confirmVariant: 'danger',
                onConfirm: () => {
                  showAlert({
                    title: 'Success',
                    message: 'All sessions terminated successfully.',
                    variant: 'success',
                  });
                },
              });
            }}
          >
            Logout All Devices
          </button>
          <button
            className="px-4 py-2 rounded-xl bg-[#EF4444] text-white text-sm font-medium hover:bg-[#DC2626] transition-colors"
            onClick={handleDeleteAccount}
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Sign Out */}
      <button
        className="w-full py-4 rounded-xl bg-[#EF4444] text-white font-bold hover:bg-[#DC2626] transition-colors flex items-center justify-center gap-2"
        onClick={handleLogout}
      >
        <LogOut size={18} />
        Sign Out
      </button>
    </div>
  );
}

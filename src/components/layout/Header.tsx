// components/layout/Header.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Bell,
  ChevronDown,
  User,
  LogOut,
  Shield,
  Menu,
  Store,
  Loader2,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSudoMode } from '@/hooks/useSudoMode';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { SUDO_CONFIG } from '@/lib/constants/sudo';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import toast from 'react-hot-toast';

interface HeaderProps {
  onMenuClick: () => void;
  onToggleSidebar: () => void;
}

function PanelIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="1.25"
        y="1.25"
        width="15.5"
        height="15.5"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <line
        x1="6"
        y1="1.25"
        x2="6"
        y2="16.75"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function Header({ onMenuClick, onToggleSidebar }: HeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  // ─── Confirm Dialog State ──────────────────────────────────────────────
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  // ─── Sudo Mode ──────────────────────────────────────────────────────────

  const {
    isActive: sudoActive,
    remainingMinutes,
    isExpiringSoon,
    deactivateSudo,
  } = useSudoMode();

  // ─── Global Search Shortcut (⌘K / Ctrl+K) ───────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ─── Sudo Deactivation Handler with ConfirmDialog ─────────────────────

  const handleDeactivateSudo = useCallback(() => {
    if (!sudoActive) return;
    setShowConfirmDialog(true);
  }, [sudoActive]);

  const handleConfirmDeactivate = useCallback(async () => {
    setIsDeactivating(true);

    try {
      // Deactivate sudo
      await deactivateSudo();
      // Force a re-render of the current page to ensure fresh server data
      router.replace(window.location.pathname);
    } catch (error) {
      toast.error('Failed to deactivate sudo mode. Please try again.');
      console.error('Sudo deactivation error:', error);
    } finally {
      setIsDeactivating(false);
      setShowConfirmDialog(false);
    }
  }, [deactivateSudo, router]);

  // Company branding
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('MotoTrack');
  const [logoLoading, setLogoLoading] = useState(true);
  const [logoError, setLogoError] = useState(false);

  const fetchCompanySettings = useCallback(async () => {
    setLogoLoading(true);
    try {
      const res = await fetch('/api/settings', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data?.company?.logoUrl) setCompanyLogo(data.company.logoUrl);
        if (data?.company?.companyName?.trim())
          setCompanyName(data.company.companyName.trim());
      }
    } catch (error) {
      console.error('Failed to fetch company settings:', error);
    } finally {
      setLogoLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanySettings();
  }, [fetchCompanySettings]);

  // User derived data
  const avatarUrl = user?.avatar || null;
  const userInitial =
    user?.name?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    'U';
  const displayName = user?.name || user?.email?.split('@')[0] || 'User';
  const userRole = user?.role || 'User';

  const formatRole = (role: string) =>
    role
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');

  const truncatedName =
    companyName.length > 14 ? companyName.substring(0, 14) + '…' : companyName;

  // Enhanced avatar renderer with better visibility
  const renderAvatar = (size: 'sm' | 'lg' | 'xs') => {
    const sizeMap = {
      xs: 28,
      sm: 32,
      lg: 40,
    };

    const sizeClasses = {
      xs: 'w-7 h-7',
      sm: 'w-8 h-8',
      lg: 'w-10 h-10',
    };

    return (
      <div
        className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg overflow-hidden shrink-0 ring-2 ring-white/10`}
        style={{
          minWidth: size === 'xs' ? '28px' : size === 'sm' ? '32px' : '40px',
        }}
      >
        {avatarUrl && !imgError ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            width={sizeMap[size]}
            height={sizeMap[size]}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <span
            className={`${size === 'lg' ? 'text-sm' : 'text-xs'} font-bold text-white drop-shadow-sm`}
          >
            {userInitial}
          </span>
        )}
      </div>
    );
  };

  // Mobile logo renderer
  const renderMobileLogo = () => {
    if (logoLoading)
      return <Loader2 className="w-5 h-5 text-white animate-spin" />;
    if (companyLogo && !logoError) {
      return (
        <Image
          src={companyLogo}
          alt={companyName}
          width={32}
          height={32}
          className="w-8 h-8 object-contain p-0.5"
          onError={() => setLogoError(true)}
          style={{ minWidth: '32px', minHeight: '32px' }}
        />
      );
    }
    return <Store className="w-5 h-5 text-white" />;
  };

  // Notification badge
  const notificationCount = 3;

  return (
    <>
      <header
        className="flex-shrink-0 px-3 sm:px-6 safe-top"
        style={{
          height: '64px',
          background: '#0D1829',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div className="flex items-center justify-between w-full h-full gap-2">
          {/* LEFT SECTION */}
          <div className="flex items-center gap-2">
            {/* Mobile hamburger */}
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 active:bg-white/20 transition-all"
              aria-label="Open navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop panel toggle */}
            <button
              onClick={onToggleSidebar}
              className="hidden lg:flex p-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              aria-label="Toggle sidebar"
            >
              <PanelIcon />
            </button>

            {/* ─── Sudo Mode Indicator ──────────────────────────────────────── */}

            {/* Desktop: Full indicator */}
            {sudoActive && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
                <Shield className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span className="text-xs font-medium text-green-400 whitespace-nowrap">
                  Sudo Active
                </span>
                <span className="text-[10px] text-green-400/70 whitespace-nowrap">
                  {remainingMinutes || SUDO_CONFIG.SESSION_DURATION_MINUTES}m
                  left
                </span>
                {isExpiringSoon && (
                  <span className="text-amber-400 text-[10px]">⚠️</span>
                )}
                <button
                  onClick={handleDeactivateSudo}
                  className="ml-1 px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-medium hover:bg-red-500/20 transition-all"
                  title="Deactivate sudo mode"
                >
                  End
                </button>
              </div>
            )}

            {/* Mobile: Compact indicator */}
            {sudoActive && (
              <div className="flex sm:hidden items-center gap-1.5 px-2 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
                <Shield className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span className="text-[10px] font-medium text-green-400">
                  {remainingMinutes || SUDO_CONFIG.SESSION_DURATION_MINUTES}m
                </span>
                {isExpiringSoon && (
                  <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
                )}
                <button
                  onClick={handleDeactivateSudo}
                  className="px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-medium hover:bg-red-500/20 transition-all"
                  title="Deactivate sudo mode"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* MOBILE CENTER - Brand Logo + Name */}
          <Link
            href="/dashboard"
            className="lg:hidden flex items-center gap-2.5 absolute left-1/2 -translate-x-1/2 group"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg overflow-hidden flex-shrink-0 ring-2 ring-white/20 group-hover:ring-white/30 transition-all">
              {renderMobileLogo()}
            </div>
            <span className="text-sm font-semibold text-white tracking-wide hidden sm:block">
              {truncatedName}
            </span>
          </Link>

          {/* RIGHT SECTION */}
          <div className="flex items-center gap-1 sm:gap-2 ml-auto">
            {/* Search Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 p-2.5 sm:px-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 active:bg-white/20 transition-all"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
              <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] text-gray-500 bg-white/5 rounded border border-white/10">
                ⌘K
              </kbd>
            </button>

            {/* Notifications Button */}
            <button
              className="relative p-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 active:bg-white/20 transition-all"
              aria-label={`Notifications${notificationCount ? ` (${notificationCount} unread)` : ''}`}
            >
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <span className="absolute top-2 right-2 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1">
                  {notificationCount}
                </span>
              )}
            </button>

            {/* User Avatar - Always visible */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="flex items-center gap-2.5 cursor-pointer px-2 py-1.5 rounded-lg hover:bg-white/5 active:bg-white/10 transition-all duration-200 group">
                  {renderAvatar('sm')}
                  {/* Name + role — visible on md+ */}
                  <div className="hidden md:block text-left min-w-0">
                    <div className="text-sm font-semibold text-white truncate max-w-[120px]">
                      {displayName}
                    </div>
                    <div className="text-[11px] text-gray-400 truncate max-w-[120px]">
                      {formatRole(userRole)}
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 hidden md:block group-hover:text-white transition-colors shrink-0" />
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="min-w-[260px] bg-[#0D1829]/98 backdrop-blur-xl rounded-2xl py-2 shadow-2xl border border-white/10 z-[100]"
                  sideOffset={8}
                  align="end"
                >
                  {/* User info header */}
                  <div className="px-4 py-3.5 border-b border-white/10 mb-1">
                    <div className="flex items-center gap-3">
                      {renderAvatar('lg')}
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white truncate">
                          {displayName}
                        </div>
                        <div className="text-xs text-gray-400 truncate mt-0.5">
                          {user?.email}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2.5">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                        {formatRole(userRole)}
                      </span>
                    </div>
                  </div>

                  <DropdownMenu.Item
                    className="px-4 py-2.5 text-sm cursor-pointer outline-none flex items-center gap-3 text-gray-300 hover:text-white hover:bg-white/5 transition-colors mx-1.5 rounded-lg"
                    onSelect={() => router.push('/settings/profile')}
                  >
                    <User className="w-4 h-4 text-gray-400" />
                    Profile Settings
                  </DropdownMenu.Item>

                  <DropdownMenu.Item
                    className="px-4 py-2.5 text-sm cursor-pointer outline-none flex items-center gap-3 text-gray-300 hover:text-white hover:bg-white/5 transition-colors mx-1.5 rounded-lg"
                    onSelect={() => router.push('/settings/security')}
                  >
                    <Shield className="w-4 h-4 text-gray-400" />
                    Security
                  </DropdownMenu.Item>

                  <DropdownMenu.Separator className="h-px my-1.5 mx-2 bg-white/10" />

                  <DropdownMenu.Item
                    onSelect={() => logout()}
                    className="px-4 py-2.5 text-sm cursor-pointer outline-none flex items-center gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors mx-1.5 rounded-lg"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </DropdownMenu.Item>

                  <DropdownMenu.Arrow className="fill-[#0D1829]" />
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </div>
      </header>

      {/* ─── Global Search Palette ────────────────────────────────────────── */}

      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* ─── Confirm Dialog for Sudo Deactivation ────────────────────────── */}

      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title="Deactivate Sudo Mode?"
        description={
          <div className="space-y-2">
            <p>
              This will deactivate sudo mode and require re-verification for
              sensitive actions.
            </p>
            <p className="text-xs text-yellow-400/70">
              ⚠️ You&apos;ll need to verify again to perform protected
              operations.
            </p>
          </div>
        }
        confirmText="Deactivate"
        cancelText="Cancel"
        onConfirm={handleConfirmDeactivate}
        variant="warning"
        isLoading={isDeactivating}
      />
    </>
  );
}

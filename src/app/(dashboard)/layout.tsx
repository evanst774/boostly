// src/app/(dashboard)/layout.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Wallet,
  Settings,
  ChevronRight,
  ChevronLeft,
  Users,
  Sun,
  Moon,
  HelpCircle,
  ChevronDown,
  Crown,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutDashboard,
  PlayCircle,
  Trophy,
  ClipboardCheck,
  Smartphone,
  BadgeCheck,
  UserCircle,
  LogOut as LogOutIcon,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { TabBar } from '@/components/app/TabBar';
import { cn } from '@/lib/utils';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useT } from '@/lib/i18n';
import { common } from '@/lib/i18n/messages/common';
import { shell } from '@/lib/i18n/messages/shell';

type CommonKey = keyof typeof common.en;
type ShellKey = keyof typeof shell.en;
/** A translatable label: a shared word or a shell string. */
type Label = { common: CommonKey } | { shell: ShellKey };

interface NavItem {
  /** Stable id (keys, tour targets). */
  name: string;
  label: Label;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  badgeColor?: 'default' | 'green' | 'purple' | 'gold';
  section?: 'main' | 'finance' | 'account';
  match?: string[];
  isNew?: boolean;
}

const navItems: NavItem[] = [
  {
    name: 'Home',
    label: { common: 'home' },
    href: '/dashboard',
    icon: <LayoutDashboard size={18} />,
    section: 'main',
    match: ['/dashboard'],
  },
  {
    name: 'Sponsored Videos',
    label: { shell: 'navSponsoredVideos' },
    href: '/earn/videos',
    icon: <PlayCircle size={18} />,
    section: 'main',
    match: ['/earn/videos'],
  },
  {
    name: 'Games',
    label: { common: 'games' },
    href: '/earn/games',
    icon: <Trophy size={18} />,
    section: 'main',
    match: ['/earn/games'],
  },
  {
    name: 'Surveys',
    label: { common: 'surveys' },
    href: '/earn/surveys',
    icon: <ClipboardCheck size={18} />,
    section: 'main',
    match: ['/earn/surveys'],
  },
  {
    name: 'Withdraw',
    label: { shell: 'navWithdraw' },
    href: '/wallet/withdraw',
    icon: <Smartphone size={18} />,
    section: 'finance',
    match: ['/wallet/withdraw'],
  },
  {
    name: 'Wallet',
    label: { common: 'wallet' },
    href: '/wallet',
    icon: <Wallet size={18} />,
    section: 'finance',
    match: ['/wallet'],
  },
  {
    name: 'Plans',
    label: { common: 'plans' },
    href: '/plans',
    icon: <Crown size={18} />,
    section: 'account',
    match: ['/plans'],
  },
  {
    name: 'Badges',
    label: { shell: 'navBadges' },
    href: '/badges',
    icon: <BadgeCheck size={18} />,
    section: 'account',
    match: ['/badges'],
  },
  {
    name: 'Referrals',
    label: { shell: 'navReferrals' },
    href: '/referrals',
    icon: <Users size={18} />,
    section: 'account',
    match: ['/referrals'],
  },
  {
    name: 'Settings',
    label: { shell: 'navSettings' },
    href: '/settings',
    icon: <Settings size={18} />,
    section: 'account',
    match: ['/settings', '/notifications'],
  },
];


// Quick actions
const quickActions = [
  { icon: <Smartphone size={14} />, id: 'Withdraw', label: { shell: 'navWithdraw' }, href: '/wallet/withdraw' },
  { icon: <Crown size={14} />, id: 'Plans', label: { common: 'plans' }, href: '/plans' },
] satisfies { icon: React.ReactNode; id: string; label: Label; href: string }[];

/** Desktop sidebar items that the welcome tour points at. */
const DESKTOP_TOUR_IDS: Record<string, string> = {
  'Sponsored Videos': 'nav-earn',
  Wallet: 'nav-wallet',
  Plans: 'nav-plans',
  Settings: 'nav-me',
};

const MOBILE_SCREENS: { prefix: string; title: Label; back?: string }[] = [
  { prefix: '/wallet/withdraw', title: { shell: 'navWithdraw' }, back: '/wallet' },
  { prefix: '/wallet/history', title: { shell: 'titleHistory' }, back: '/wallet' },
  { prefix: '/wallet/earnings', title: { shell: 'titleEarnings' }, back: '/wallet' },
  { prefix: '/wallet', title: { common: 'wallet' } },
  { prefix: '/earn', title: { common: 'earn' } },
  { prefix: '/plans', title: { common: 'plans' } },
  { prefix: '/referrals', title: { shell: 'titleInvite' }, back: '/me' },
  { prefix: '/badges', title: { shell: 'navBadges' }, back: '/me' },
  { prefix: '/notifications', title: { shell: 'titleNotifications' }, back: '/me' },
  { prefix: '/settings', title: { shell: 'navSettings' }, back: '/me' },
  { prefix: '/me', title: { common: 'me' } },
  { prefix: '/dashboard', title: { common: 'home' } },
];

function getMobileScreen(pathname: string): { title: Label | null; back?: string } {
  return (
    MOBILE_SCREENS.find((s) => pathname === s.prefix || pathname.startsWith(`${s.prefix}/`)) ?? {
      title: null, // shows "Boostly"
      back: '/dashboard',
    }
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  // Shared, saved theme (also used by Settings).
  const { dark: isDarkMode, toggleTheme } = useTheme();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const tc = useT(common);
  const t = useT(shell);
  const say = (l: Label) => ('common' in l ? tc(l.common) : t(l.shell));

  // ─── Restore desktop sidebar collapse preference ──────
  useEffect(() => {
    const stored = window.localStorage.getItem('sidebar-collapsed');
    if (stored === 'true') setIsCollapsed(true);
  }, []);

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });
  };

  // ─── Scroll detection ──────────────────────────────
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ─── Keyboard shortcuts ──────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSidebarOpen(false);
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ─── Lock body scroll while the mobile sidebar is open ────
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  // ─── Click outside to close profile dropdown ──────────
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.profile-dropdown')) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // ─── Get page title ──────────────────────────────────
  // Most specific match wins, so /wallet/withdraw highlights "Withdraw" only.
  const activeNavItem = navItems
    .flatMap((i) =>
      (i.match ?? []).filter((m) => pathname?.startsWith(m)).map((m) => ({ i, len: m.length })),
    )
    .sort((a, b) => b.len - a.len)[0]?.i;

  const getPageTitle = () => (activeNavItem ? say(activeNavItem.label) : t('dashboard'));

  // Phone title + back target. Tab roots have no back arrow; sub-screens go
  // back to their tab.
  const mobileScreen = getMobileScreen(pathname || '/dashboard');

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const toggleDarkMode = () => {
    toggleTheme();
  };

  return (
    <div
      className={cn(
        'app-theme min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] text-[#111827] dark:text-[#F1F5F9] font-outfit antialiased',
      )}
    >
      {/* ─── Sidebar Overlay ─────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ─── Sidebar ─────────────────────────────────────── */}
      <aside
        className={cn(
          'fixed left-0 top-0 bottom-0 w-[272px] bg-white dark:bg-[#1E293B] border-r border-[#F1F5F9] dark:border-[#334155] z-50 flex flex-col transition-[transform,width] duration-300 ease-in-out shadow-xl lg:shadow-none',
          isCollapsed ? 'lg:w-[76px]' : 'lg:w-[272px]',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Logo + desktop collapse toggle */}
        <div
          className={cn(
            'flex items-center h-[72px] border-b border-[#F1F5F9] dark:border-[#334155]',
            isCollapsed
              ? 'justify-between px-5 lg:justify-center lg:px-3'
              : 'justify-between px-5',
          )}
        >
          {/* Mobile / tablet: compact icon + wordmark (sidebar is off-canvas here,
              so this is the only brand mark visible until it's opened) */}
          <div className="lg:hidden flex items-center gap-2.5">
            <div className="relative w-8 h-8 flex-shrink-0">
              <Image
                src="/img/logo/icon.png"
                alt=""
                width={32}
                height={32}
                className="rounded-lg"
              />
            </div>
            <span className="text-base font-bold text-[#111827] dark:text-white tracking-tight">
              Boostly
            </span>
          </div>

          {/* Desktop / laptop, expanded: wordmark only — no separate icon mark,
              so the header reads as one clean logo instead of two competing marks */}
          {!isCollapsed && (
            <div className="hidden lg:block relative h-9 w-[140px]">
              <Image
                src="/img/logo/logo-side.png"
                alt="Boostly"
                fill
                sizes="140px"
                className="object-contain object-left dark:brightness-200"
                priority
              />
            </div>
          )}

          {/* Desktop sidebar toggle — crucial for web view so people can
              reclaim horizontal space on large screens without leaving the page */}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={isCollapsed ? t('expandSidebar') : t('collapseSidebar')}
            title={isCollapsed ? t('expandSidebar') : t('collapseSidebar')}
            className="hidden lg:flex w-8 h-8 rounded-lg items-center justify-center text-[#94A3B8] dark:text-[#64748B] hover:text-[#2563EB] dark:hover:text-[#60A5FA] hover:bg-[#EFF6FF] dark:hover:bg-[#2563EB]/10 transition-colors flex-shrink-0"
          >
            {isCollapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav
          className={cn(
            'flex-1 overflow-y-auto py-5 scrollbar-thin',
            isCollapsed ? 'lg:px-2 px-3' : 'px-3',
          )}
        >
          {(['main', 'finance', 'account'] as const).map((section) => (
            <div key={section} className="mb-1">
              {/* Section label — collapses to a hairline divider so the rail
                  stays tidy instead of showing clipped text */}
              <div
                className={cn(
                  'px-3 py-2.5',
                  isCollapsed && 'lg:flex lg:justify-center lg:px-0 lg:py-3',
                )}
              >
                <span
                  className={cn(
                    'text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] dark:text-[#64748B]',
                    isCollapsed && 'lg:hidden',
                  )}
                >
                  {section === 'main' && t('sectionEarn')}
                  {section === 'finance' && t('sectionMoney')}
                  {section === 'account' && t('sectionAccount')}
                </span>
                {isCollapsed && (
                  <span className="hidden lg:block w-6 h-px bg-[#E2E8F0] dark:bg-[#334155]" />
                )}
              </div>
              {navItems
                .filter((item) => item.section === section)
                .map((item) => {
                  const isActive = activeNavItem === item;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      data-tour={DESKTOP_TOUR_IDS[item.name]}
                      title={isCollapsed ? say(item.label) : undefined}
                      className={cn(
                        'flex items-center rounded-lg text-sm font-medium transition-colors duration-150 group relative',
                        isCollapsed
                          ? 'gap-3 px-3 py-2.5 lg:justify-center lg:mx-auto lg:w-11 lg:px-0'
                          : 'gap-3 px-3 py-2.5',
                        isActive
                          ? 'bg-[#EFF6FF] dark:bg-[#2563EB]/15 text-[#2563EB] dark:text-[#60A5FA]'
                          : 'text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F8FAFC] dark:hover:bg-[#334155] hover:text-[#0F172A] dark:hover:text-white',
                      )}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span
                        className={cn(
                          'flex-shrink-0 transition-colors',
                          isActive
                            ? 'text-[#2563EB] dark:text-[#60A5FA]'
                            : 'text-[#94A3B8] dark:text-[#64748B] group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA]',
                        )}
                      >
                        {item.icon}
                      </span>
                      <span
                        className={cn('flex-1', isCollapsed && 'lg:hidden')}
                      >
                        {say(item.label)}
                      </span>
                      {item.badge && (
                        <span
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-full text-white',
                            isCollapsed && 'lg:hidden',
                            item.badgeColor === 'green'
                              ? 'bg-[#22C55E]'
                              : item.badgeColor === 'purple'
                                ? 'bg-[#8B5CF6]'
                                : item.badgeColor === 'gold'
                                  ? 'bg-[#F59E0B]'
                                  : 'bg-[#EF4444]',
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                      {item.isNew && (
                        <span
                          className={cn(
                            'text-[9px] font-bold text-[#8B5CF6] bg-[#F5F3FF] dark:bg-[#8B5CF6]/20 px-2 py-0.5 rounded-full',
                            isCollapsed && 'lg:hidden',
                          )}
                        >
                          {t('newBadge')}
                        </span>
                      )}
                      {/* Collapsed rail: swap the badge/new pill for a small dot
                          so there's still a hint without breaking the layout */}
                      {isCollapsed && (item.badge || item.isNew) && (
                        <span className="hidden lg:block absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                      )}
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-[#2563EB] dark:bg-[#60A5FA]" />
                      )}
                    </Link>
                  );
                })}
            </div>
          ))}
        </nav>

        {/* Footer - User Profile */}
        <div className="border-t border-[#F1F5F9] dark:border-[#334155] p-3">
          <button
            type="button"
            title={isCollapsed ? user?.name || t('profile') : undefined}
            className={cn(
              'w-full flex items-center rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-[#334155] transition-colors group text-left',
              isCollapsed
                ? 'gap-3 px-3 py-2.5 lg:justify-center lg:px-0'
                : 'gap-3 px-3 py-2.5',
            )}
            onClick={() => router.push('/settings/profile')}
          >
            <div className="w-9 h-9 rounded-full bg-[#2563EB] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.name ? getInitials(user.name) : 'U'}
            </div>
            <div className={cn('flex-1 min-w-0', isCollapsed && 'lg:hidden')}>
              <div className="text-sm font-semibold text-[#0F172A] dark:text-white truncate">
                {user?.name || t('user')}
              </div>
              <div className="text-xs text-[#64748B] dark:text-[#94A3B8] flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                  {user?.plan || 'Free'}
                </span>
              </div>
            </div>
            <ChevronRight
              size={16}
              className={cn(
                'text-[#94A3B8] dark:text-[#64748B] group-hover:translate-x-0.5 transition-transform flex-shrink-0',
                isCollapsed && 'lg:hidden',
              )}
            />
          </button>
        </div>
      </aside>

      {/* ─── Main Content ────────────────────────────────── */}
      <div
        className={cn(
          'min-h-screen flex flex-col pb-[calc(64px+env(safe-area-inset-bottom))] lg:pb-0 transition-[margin] duration-300 ease-in-out',
          isCollapsed ? 'lg:ml-[76px]' : 'lg:ml-[272px]',
        )}
      >
        {/* ─── Topbar ─────────────────────────────────────── */}
        <header
          className={cn(
            'sticky top-0 z-30 bg-white/90 dark:bg-[#1E293B]/90 backdrop-blur-md border-b border-[#F1F5F9] dark:border-[#334155] transition-shadow duration-200',
            isScrolled && 'shadow-sm',
          )}
          // Notch / status-bar space sits ABOVE the fixed-height row.
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="h-14 lg:h-16 px-4 lg:px-8 flex items-center gap-3">
          {/* Phones: back arrow on sub-screens, logo on tab roots */}
          {mobileScreen.back ? (
            <Link
              href={mobileScreen.back}
              aria-label={tc('back')}
              className="lg:hidden -ml-2 w-10 h-10 rounded-full flex items-center justify-center text-[#0F172A] dark:text-white active:bg-[#F1F5F9] dark:active:bg-[#334155]"
            >
              <ChevronLeft size={24} />
            </Link>
          ) : (
            <div className="lg:hidden relative w-8 h-8 flex-shrink-0">
              <Image
                src="/img/logo/icon.png"
                alt="Boostly"
                width={32}
                height={32}
                className="rounded-lg"
              />
            </div>
          )}

          {/* Title: screen name on phones, section name on desktop */}
          <div className="flex-1 min-w-0">
            <h1 className="text-[19px] lg:text-xl font-bold tracking-tight text-[#0F172A] dark:text-white truncate font-outfit">
              <span className="lg:hidden">{mobileScreen.title ? say(mobileScreen.title) : 'Boostly'}</span>
              <span className="hidden lg:inline">{getPageTitle()}</span>
            </h1>
          </div>

          {/* Quick Actions (Desktop) */}
          <div className="hidden md:flex items-center gap-1">
            {quickActions.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => router.push(action.href)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F8FAFC] dark:hover:bg-[#334155] hover:text-[#0F172A] dark:hover:text-white transition-colors"
              >
                {action.icon}
                <span className="hidden xl:inline">{say(action.label)}</span>
              </button>
            ))}
            <span className="w-px h-6 bg-[#E2E8F0] dark:bg-[#334155] mx-1.5" />
          </div>

          <div className="flex items-center gap-2">
            {/* Dark Mode Toggle */}
            <button
              type="button"
              aria-label={t('toggleDark')}
              onClick={toggleDarkMode}
              className="hidden sm:flex w-10 h-10 rounded-lg border border-[#F1F5F9] dark:border-[#334155] items-center justify-center hover:border-[#2563EB] hover:bg-[#EFF6FF] dark:hover:bg-[#2563EB]/10 transition-colors"
            >
              {isDarkMode ? (
                <Sun size={18} className="text-[#F59E0B]" />
              ) : (
                <Moon size={18} className="text-[#64748B]" />
              )}
            </button>

            {/* Notification Bell */}
            <NotificationBell />

            {/* Phones: avatar opens the Me screen */}
            <Link
              href="/me"
              aria-label={tc('me')}
              className="lg:hidden w-9 h-9 rounded-full bg-[#2563EB] flex items-center justify-center text-white text-xs font-bold"
            >
              {user?.name ? getInitials(user.name) : 'U'}
            </Link>

            {/* Desktop: profile dropdown */}
            <div className="relative profile-dropdown hidden lg:block">
              <button
                type="button"
                aria-label={t('accountMenu')}
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-[#F1F5F9] dark:bg-[#334155] border border-transparent hover:border-[#2563EB] transition-colors hover:bg-white dark:hover:bg-[#2D3A4F]"
              >
                <div className="w-7 h-7 rounded-full bg-[#2563EB] flex items-center justify-center text-white text-xs font-bold">
                  {user?.name ? getInitials(user.name) : 'U'}
                </div>
                <ChevronDown
                  size={14}
                  className={cn(
                    'text-[#64748B] dark:text-[#94A3B8] transition-transform duration-200',
                    isProfileOpen && 'rotate-180',
                  )}
                />
              </button>

              {/* Dropdown */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#1E293B] rounded-xl shadow-xl border border-[#F1F5F9] dark:border-[#334155] overflow-hidden z-50 animate-slide-down">
                  <div className="px-4 py-4 border-b border-[#F1F5F9] dark:border-[#334155] flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-[#2563EB] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {user?.name ? getInitials(user.name) : 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0F172A] dark:text-white truncate">
                        {user?.name || t('user')}
                      </p>
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8] truncate">
                        {user?.email ?? ''}
                      </p>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                  </div>

                  <div className="py-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        router.push('/settings/profile');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F8FAFC] dark:hover:bg-[#334155] hover:text-[#0F172A] dark:hover:text-white transition-colors"
                    >
                      <UserCircle size={16} />
                      {t('profile')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        router.push('/wallet');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F8FAFC] dark:hover:bg-[#334155] hover:text-[#0F172A] dark:hover:text-white transition-colors"
                    >
                      <Wallet size={16} />
                      {tc('wallet')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        router.push('/badges');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F8FAFC] dark:hover:bg-[#334155] hover:text-[#0F172A] dark:hover:text-white transition-colors"
                    >
                      <BadgeCheck size={16} />
                      {t('navBadges')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        router.push('/referrals');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F8FAFC] dark:hover:bg-[#334155] hover:text-[#0F172A] dark:hover:text-white transition-colors"
                    >
                      <Users size={16} />
                      {t('navReferrals')}
                    </button>
                    <div className="border-t border-[#F1F5F9] dark:border-[#334155] my-1" />
                    <div className="px-4 py-2">
                      <LanguageSwitcher variant="compact" className="text-[#334155] dark:text-[#CBD5E1]" />
                    </div>
                    <div className="border-t border-[#F1F5F9] dark:border-[#334155] my-1" />
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        router.push('/help');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F8FAFC] dark:hover:bg-[#334155] hover:text-[#0F172A] dark:hover:text-white transition-colors"
                    >
                      <HelpCircle size={16} />
                      {t('helpSupport')}
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#EF4444] hover:bg-[#FEF2F2] dark:hover:bg-[#7F1D1D]/20 transition-colors"
                    >
                      <LogOutIcon size={16} />
                      {t('signOut')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          </div>
        </header>

        {/* ─── Page Content ────────────────────────────────── */}
        <main className="flex-1 p-4 lg:p-8">{children}</main>

        {/* ─── Bottom tab bar (phones) ─────────────────────── */}
        <TabBar variant="app" badges={{ Me: unreadCount }} />
      </div>
    </div>
  );
}

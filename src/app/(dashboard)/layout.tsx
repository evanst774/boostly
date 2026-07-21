// src/app/(dashboard)/layout.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Gamepad2,
  Wallet,
  Settings,
  Menu,
  ChevronRight,
  Users,
  Search,
  X,
  User,
  Sun,
  Moon,
  Gift,
  TrendingUp,
  HelpCircle,
  Zap,
  ChevronDown,
  Crown,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutDashboard,
  PlayCircle,
  Trophy,
  ClipboardCheck,
  LineChart,
  BadgeCheck,
  UserCircle,
  LogOut as LogOutIcon,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
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
    name: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard size={18} />,
    section: 'main',
    match: ['/dashboard'],
  },
  {
    name: 'Watch Videos',
    href: '/earn/videos',
    icon: <PlayCircle size={18} />,
    badge: 5,
    badgeColor: 'green',
    section: 'main',
    match: ['/earn/videos'],
  },
  {
    name: 'Play Games',
    href: '/earn/games',
    icon: <Trophy size={18} />,
    section: 'main',
    match: ['/earn/games'],
  },
  {
    name: 'Surveys',
    href: '/earn/surveys',
    icon: <ClipboardCheck size={18} />,
    section: 'main',
    match: ['/earn/surveys'],
  },
  {
    name: 'Wallet',
    href: '/wallet',
    icon: <Wallet size={18} />,
    section: 'finance',
    match: [
      '/wallet',
      '/wallet/withdraw',
      '/wallet/history',
      '/wallet/earnings',
    ],
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: <LineChart size={18} />,
    section: 'finance',
    match: ['/analytics'],
  },
  {
    name: 'My Badges',
    href: '/badges',
    icon: <BadgeCheck size={18} />,
    section: 'account',
    match: ['/badges'],
  },
  {
    name: 'Referrals',
    href: '/referrals',
    icon: <Users size={18} />,
    section: 'account',
    match: ['/referrals'],
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: <Settings size={18} />,
    section: 'account',
    match: ['/settings', '/settings/profile', '/settings/security'],
  },
];

// Mobile bottom nav items
const bottomNavItems = [
  { name: 'Home', href: '/dashboard', icon: Home },
  { name: 'Earn', href: '/earn/videos', icon: Zap },
  { name: 'Games', href: '/earn/games', icon: Gamepad2 },
  { name: 'Wallet', href: '/wallet', icon: Wallet },
  { name: 'Profile', href: '/settings/profile', icon: User },
];

// Quick actions
const quickActions = [
  { icon: <Gift size={14} />, label: 'Daily Bonus', href: '/daily-bonus' },
  {
    icon: <TrendingUp size={14} />,
    label: 'Earnings',
    href: '/wallet/earnings',
  },
  { icon: <Zap size={14} />, label: 'Quick Earn', href: '/earn/videos' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();

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
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setSidebarOpen(false);
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ─── Lock body scroll while the mobile sidebar/search is open ────
  useEffect(() => {
    document.body.style.overflow = sidebarOpen || searchOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen, searchOpen]);

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
  const getPageTitle = () => {
    const item = navItems.find((i) =>
      i.match?.some((m) => pathname?.startsWith(m)),
    );
    return item?.name || 'Dashboard';
  };

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
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  // Check if current path matches bottom nav.
  // More specific routes are checked first so a sub-route (e.g. /earn/games)
  // never lights up its parent tab (e.g. Earn) at the same time.
  const isBottomNavActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    if (href === '/earn/games')
      return pathname?.startsWith('/earn/games') ?? false;
    if (href === '/earn/videos')
      return (
        (pathname?.startsWith('/earn') ?? false) &&
        !pathname?.startsWith('/earn/games')
      );
    if (href === '/wallet') return pathname?.startsWith('/wallet') ?? false;
    if (href === '/settings/profile')
      return pathname?.startsWith('/settings') ?? false;
    return pathname === href;
  };

  return (
    <div
      className={cn(
        'min-h-screen bg-[#F8FAFC] font-outfit antialiased',
        isDarkMode && 'dark:bg-[#0F172A]',
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
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
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
                  {section === 'main' && 'Main Menu'}
                  {section === 'finance' && 'Finance'}
                  {section === 'account' && 'Account'}
                </span>
                {isCollapsed && (
                  <span className="hidden lg:block w-6 h-px bg-[#E2E8F0] dark:bg-[#334155]" />
                )}
              </div>
              {navItems
                .filter((item) => item.section === section)
                .map((item) => {
                  const isActive = item.match?.some((m) =>
                    pathname?.startsWith(m),
                  );
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      title={isCollapsed ? item.name : undefined}
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
                        {item.name}
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
                          New
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
            title={isCollapsed ? user?.name || 'Profile' : undefined}
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
                {user?.name || 'User'}
              </div>
              <div className="text-xs text-[#64748B] dark:text-[#94A3B8] flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                  {user?.plan || 'Starter'}
                </span>
                <span className="w-1 h-1 rounded-full bg-[#CBD5E1]" />
                <span className="inline-flex items-center gap-1">
                  <Crown size={10} className="text-[#F59E0B]" />
                  {user?.badge || 'No Badge'}
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
          'min-h-screen flex flex-col pb-[calc(72px+env(safe-area-inset-bottom))] lg:pb-0 transition-[margin] duration-300 ease-in-out',
          isCollapsed ? 'lg:ml-[76px]' : 'lg:ml-[272px]',
        )}
      >
        {/* ─── Topbar ─────────────────────────────────────── */}
        <header
          className={cn(
            'sticky top-0 z-30 bg-white/90 dark:bg-[#1E293B]/90 backdrop-blur-md border-b border-[#F1F5F9] dark:border-[#334155] px-4 lg:px-8 py-3 flex items-center gap-3 h-[64px] transition-shadow duration-200',
            isScrolled && 'shadow-sm',
          )}
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          {/* Hamburger */}
          <button
            type="button"
            aria-label="Open menu"
            className="lg:hidden w-10 h-10 rounded-lg border border-[#F1F5F9] dark:border-[#334155] flex items-center justify-center hover:border-[#2563EB] hover:bg-[#EFF6FF] dark:hover:bg-[#2563EB]/10 transition-colors flex-shrink-0"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} className="text-[#64748B] dark:text-[#94A3B8]" />
          </button>

          {/* Logo (mobile only — desktop already shows the sidebar wordmark) */}
          <div className="lg:hidden relative w-8 h-8 flex-shrink-0">
            <Image
              src="/img/logo/icon.png"
              alt="Boostly"
              width={32}
              height={32}
              className="rounded-lg"
            />
          </div>

          {/* Page Title */}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg lg:text-xl font-bold text-[#0F172A] dark:text-white truncate font-outfit">
              {getPageTitle()}
            </h1>
          </div>

          {/* Quick Actions (Desktop) */}
          <div className="hidden md:flex items-center gap-1">
            {quickActions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => router.push(action.href)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F8FAFC] dark:hover:bg-[#334155] hover:text-[#0F172A] dark:hover:text-white transition-colors"
              >
                {action.icon}
                <span className="hidden xl:inline">{action.label}</span>
              </button>
            ))}
            <span className="w-px h-6 bg-[#E2E8F0] dark:bg-[#334155] mx-1.5" />
          </div>

          <div className="flex items-center gap-2">
            {/* Search Button (Mobile) */}
            <button
              type="button"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
              className="md:hidden w-10 h-10 rounded-lg border border-[#F1F5F9] dark:border-[#334155] flex items-center justify-center hover:border-[#2563EB] hover:bg-[#EFF6FF] dark:hover:bg-[#2563EB]/10 transition-colors"
            >
              <Search
                size={18}
                className="text-[#64748B] dark:text-[#94A3B8]"
              />
            </button>

            {/* Search Bar (Desktop) */}
            <div className="hidden md:flex items-center gap-2 bg-[#F1F5F9] dark:bg-[#334155] border border-transparent rounded-lg px-3.5 py-2 text-sm transition-colors focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#2563EB]/15 hover:bg-white dark:hover:bg-[#2D3A4F]">
              <Search
                size={15}
                className="text-[#94A3B8] dark:text-[#64748B]"
              />
              <input
                type="search"
                placeholder="Search…"
                aria-label="Search"
                className="bg-transparent border-none outline-none text-sm w-40 text-[#0F172A] dark:text-white placeholder:text-[#94A3B8] dark:placeholder:text-[#64748B]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <kbd className="text-[10px] font-medium text-[#94A3B8] dark:text-[#64748B] bg-white dark:bg-[#1E293B] px-1.5 py-0.5 rounded border border-[#E2E8F0] dark:border-[#334155]">
                ⌘K
              </kbd>
            </div>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              aria-label="Toggle dark mode"
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

            {/* Profile Dropdown */}
            <div className="relative profile-dropdown">
              <button
                type="button"
                aria-label="Account menu"
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
                        {user?.name || 'User'}
                      </p>
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8] truncate">
                        {user?.email || 'user@example.com'}
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
                      Profile
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
                      Wallet
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
                      Badges
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
                      Referrals
                    </button>
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
                      Help & Support
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#EF4444] hover:bg-[#FEF2F2] dark:hover:bg-[#7F1D1D]/20 transition-colors"
                    >
                      <LogOutIcon size={16} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ─── Search Overlay ─────────────────────────────── */}
        {searchOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 animate-fade-in"
            onClick={() => setSearchOpen(false)}
          >
            <div
              className="max-w-2xl mx-auto mt-20 p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-2xl border border-[#F1F5F9] dark:border-[#334155] overflow-hidden animate-slide-up">
                <div className="flex items-center gap-3 p-4 border-b border-[#F1F5F9] dark:border-[#334155]">
                  <Search size={20} className="text-[#94A3B8]" />
                  <input
                    type="text"
                    placeholder="Search videos, games, settings…"
                    className="flex-1 bg-transparent border-none outline-none text-[#0F172A] dark:text-white placeholder:text-[#94A3B8] text-lg"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button
                    type="button"
                    aria-label="Close search"
                    onClick={() => setSearchOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-[#334155] transition-colors"
                  >
                    <X size={18} className="text-[#64748B]" />
                  </button>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                    Press{' '}
                    <kbd className="px-1.5 py-0.5 bg-[#F1F5F9] dark:bg-[#334155] rounded text-xs font-medium">
                      Esc
                    </kbd>{' '}
                    to close
                  </p>
                  <div className="flex items-center gap-1 text-xs text-[#94A3B8]">
                    <span>⌘K to open</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Page Content ────────────────────────────────── */}
        <main className="flex-1 p-4 lg:p-8">{children}</main>

        {/* ─── Bottom Navigation (Mobile) ────────────────── */}
        <nav
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#1E293B]/95 backdrop-blur-md border-t border-[#F1F5F9] dark:border-[#334155] flex items-center justify-around h-[72px] px-2"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = isBottomNavActive(item.href);
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => router.push(item.href)}
                className="flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[48px] rounded-lg relative"
              >
                <div className="relative">
                  <Icon
                    size={22}
                    className={cn(
                      'transition-colors duration-150',
                      isActive
                        ? 'text-[#2563EB]'
                        : 'text-[#94A3B8] dark:text-[#64748B]',
                    )}
                  />
                  {item.name === 'Earn' && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-0.5 rounded-full bg-[#EF4444] text-white text-[9px] font-bold flex items-center justify-center border-2 border-white dark:border-[#1E293B]">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    'text-[10px] font-medium transition-colors duration-150',
                    isActive
                      ? 'text-[#2563EB]'
                      : 'text-[#94A3B8] dark:text-[#64748B]',
                  )}
                >
                  {item.name}
                </span>
                {isActive && (
                  <span className="absolute -top-[9px] left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[#2563EB]" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

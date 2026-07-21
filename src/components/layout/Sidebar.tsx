// components/layout/Sidebar.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Bike,
  ShoppingCart,
  Users,
  Wallet,
  FileText,
  BarChart3,
  Shield,
  Settings,
  ChevronDown,
  LogOut,
  User,
  Bell,
  ChevronRight,
  Store,
  Loader2,
  // Submenu child icons
  List,
  PlusCircle,
  Tag,
  Truck,
  Receipt,
  History,
  FilePlus,
  UserCheck,
  UserX,
  CreditCard,
  CalendarClock,
  Landmark,
  Library,
  TrendingUp,
  PieChart,
  LineChart,
  PackageSearch,
  Download,
  UserCog,
  KeyRound,
  ScrollText,
  Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { SystemRoles } from '@/modules/rbac/roles';
import { useState, useEffect, useCallback } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { SidebarSkeleton } from './SidebarSkeleton';

// ============================================
// TYPES
// ============================================

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

interface NavChild {
  name: string;
  href: string;
  permission?: string;
  icon: React.FC<{ className?: string }>;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.FC<{ className?: string }>;
  permission?: string;
  children?: NavChild[];
}

// ============================================
// NAVIGATION ITEMS
// ============================================

const navigationItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    permission: 'dashboard.read',
  },
  {
    name: 'Inventory',
    href: '/inventory',
    icon: Bike,
    permission: 'inventory.read',
    children: [
      {
        name: 'All Bikes',
        href: '/inventory',
        icon: List,
        permission: 'inventory.read',
      },
      {
        name: 'Add Bike',
        href: '/inventory/add',
        icon: PlusCircle,
        permission: 'inventory.create',
      },
      {
        name: 'Categories',
        href: '/inventory/categories',
        icon: Tag,
        permission: 'inventory.read',
      },
      {
        name: 'Models',
        href: '/inventory/models',
        icon: Package,
        permission: 'inventory.read',
      },
      {
        name: 'Suppliers',
        href: '/inventory/suppliers',
        icon: Truck,
        permission: 'inventory.read',
      },
    ],
  },
  {
    name: 'Sales',
    href: '/sales',
    icon: ShoppingCart,
    permission: 'sales.read',
    children: [
      {
        name: 'New Sale',
        href: '/sales/new',
        icon: PlusCircle,
        permission: 'sales.create',
      },
      {
        name: 'Sales History',
        href: '/sales/history',
        icon: History,
        permission: 'sales.read',
      },
      {
        name: 'Invoices',
        href: '/sales/invoices',
        icon: Receipt,
        permission: 'sales.read',
      },
    ],
  },
  {
    name: 'Customers',
    href: '/customers',
    icon: Users,
    permission: 'customers.read',
    children: [
      {
        name: 'All Customers',
        href: '/customers',
        icon: UserCheck,
        permission: 'customers.read',
      },
      {
        name: 'Debtors',
        href: '/customers/debtors',
        icon: UserX,
        permission: 'debts.read',
      },
    ],
  },
  {
    name: 'Finance',
    href: '/finance',
    icon: Wallet,
    permission: 'payments.read',
    children: [
      {
        name: 'Payments',
        href: '/finance/payments',
        icon: CreditCard,
        permission: 'payments.read',
      },
      {
        name: 'Installments',
        href: '/finance/installments',
        icon: CalendarClock,
        permission: 'finance.read',
      },
      {
        name: 'Debts',
        href: '/finance/debts',
        icon: Landmark,
        permission: 'debts.read',
      },
    ],
  },
  {
    name: 'Contracts',
    href: '/contracts',
    icon: FileText,
    permission: 'contracts.read',
    children: [
      {
        name: 'Contract Library',
        href: '/contracts',
        icon: Library,
        permission: 'contracts.read',
      },
      {
        name: 'Upload Contract',
        href: '/contracts/upload',
        icon: FilePlus,
        permission: 'contracts.upload',
      },
    ],
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: BarChart3,
    permission: 'reports.read',
    children: [
      {
        name: 'Sales Reports',
        href: '/reports/sales',
        icon: TrendingUp,
        permission: 'reports.sales',
      },
      {
        name: 'Debt Analytics',
        href: '/reports/debts',
        icon: PieChart,
        permission: 'reports.finance',
      },
      {
        name: 'Finance Reports',
        href: '/reports/finance',
        icon: LineChart,
        permission: 'reports.finance',
      },
      {
        name: 'Inventory Reports',
        href: '/reports/inventory',
        icon: PackageSearch,
        permission: 'reports.inventory',
      },
      {
        name: 'Export Reports',
        href: '/reports/export',
        icon: Download,
        permission: 'reports.export',
      },
    ],
  },
  {
    name: 'Admin',
    href: '/admin',
    icon: Shield,
    permission: 'users.manage',
    children: [
      {
        name: 'Users',
        href: '/admin/users',
        icon: UserCog,
        permission: 'users.manage',
      },
      {
        name: 'Roles',
        href: '/admin/roles',
        icon: KeyRound,
        permission: 'roles.manage',
      },
      {
        name: 'Audit Logs',
        href: '/admin/audit-logs',
        icon: ScrollText,
        permission: 'audit.read',
      },
    ],
  },
  {
    name: 'Account',
    href: '/settings/profile',
    icon: User,
    permission: 'profile.read',
    children: [
      {
        name: 'Profile',
        href: '/settings/profile',
        icon: User,
        permission: 'profile.read',
      },
      {
        name: 'Security',
        href: '/settings/security',
        icon: Shield,
        permission: 'security.read',
      },
    ],
  },
  {
    name: 'System',
    href: '/settings',
    icon: Settings,
    permission: 'system.config',
  },
];

// ============================================
// HELPERS
// ============================================

const isChildActive = (
  pathname: string,
  childHref: string,
  parentHref: string,
): boolean => {
  if (childHref === parentHref) {
    return pathname === childHref;
  }
  return pathname === childHref || pathname.startsWith(childHref + '/');
};

// ============================================
// SIDEBAR COMPONENT
// ============================================

export function Sidebar({
  collapsed,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();

  // Navigation state
  const [openSubmenus, setOpenSubmenus] = useState<string[]>([]);

  // Company settings state
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('MotoTrack');
  const [logoLoading, setLogoLoading] = useState(true);
  const [logoError, setLogoError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // Show skeleton while permissions are loading
  const showSkeleton = permissionsLoading || !user;

  // ============================================
  // FETCH COMPANY SETTINGS
  // ============================================

  const fetchCompanySettings = useCallback(async () => {
    setLogoLoading(true);
    try {
      const res = await fetch('/api/settings', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data?.company) {
          if (data.company.logoUrl) {
            setCompanyLogo(data.company.logoUrl);
          }
          if (data.company.companyName?.trim()) {
            setCompanyName(data.company.companyName.trim());
          }
        }
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

  // ============================================
  // AUTO-EXPAND SUBMENUS
  // ============================================

  useEffect(() => {
    if (showSkeleton) return;

    const newOpen: string[] = [];
    navigationItems.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some((child) =>
          isChildActive(pathname, child.href, item.href),
        );
        if (hasActiveChild) {
          newOpen.push(item.name);
        }
      }
    });
    setOpenSubmenus((prev) => {
      const merged = [...prev];
      newOpen.forEach((name) => {
        if (!merged.includes(name)) merged.push(name);
      });
      return merged;
    });
  }, [pathname, showSkeleton]);

  // ============================================
  // HANDLERS
  // ============================================

  const toggleSubmenu = (name: string) => {
    setOpenSubmenus((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  };

  const isParentActive = (item: NavItem): boolean => {
    if (!item.children) return false;
    return item.children.some((child) =>
      isChildActive(pathname, child.href, item.href),
    );
  };

  const hasAccess = (permission?: string): boolean => {
    if (!permission) return true;
    if (user?.roles?.includes(SystemRoles.SUPER_ADMIN)) return true;
    return hasPermission(permission);
  };

  const formatRole = (role: string) => {
    if (!role) return 'User';
    return role
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleLogoError = () => {
    setLogoError(true);
  };

  // ============================================
  // DERIVED VALUES
  // ============================================

  const userInitial =
    user?.name?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    'U';
  const displayName = user?.name || user?.email?.split('@')[0] || 'User';
  const userRole = user?.role || 'User';

  const truncatedCompanyName =
    companyName.length > 16
      ? companyName.substring(0, 16) + '...'
      : companyName;

  // ============================================
  // RENDER LOGO
  // ============================================

  const renderLogo = () => {
    if (logoLoading) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <Loader2 className="w-4 h-4 text-white/60 animate-spin" />
        </div>
      );
    }

    if (companyLogo && !logoError) {
      return (
        <Image
          src={companyLogo}
          alt={companyName}
          width={40}
          height={40}
          className="w-full h-full object-contain p-1"
          onError={handleLogoError}
        />
      );
    }

    return <Store className="w-5 h-5 text-white" />;
  };

  // Show skeleton while permissions are loading
  if (showSkeleton) {
    return (
      <>
        {/* Desktop Sidebar Skeleton — explicit SHELL_BG to match header, h-full so it fills the flex column */}
        <aside
          className={cn(
            'hidden lg:flex flex-col h-full transition-all duration-300 z-30',
            collapsed ? 'w-20' : 'w-64',
          )}
          style={{ background: '#0D1829' }}
        >
          <SidebarSkeleton collapsed={collapsed} />
        </aside>

        {/* Mobile Sidebar Skeleton — keeps own bg since it floats over page */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-64 h-full bg-surface/98 backdrop-blur-xl transform transition-transform duration-300 lg:hidden',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <SidebarSkeleton collapsed={false} />
        </aside>

        {/* Mobile Overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={onMobileClose}
          />
        )}
      </>
    );
  }

  // ============================================
  // SIDEBAR CONTENT
  // ============================================

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* ========== LOGO ==========
          No border-b — color contrast between sidebar and main does the separation */}
      <div className="flex-shrink-0 p-4">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg group-hover:shadow-glow-blue transition-all duration-300 overflow-hidden flex-shrink-0">
            {renderLogo()}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="font-rebond-bold text-base text-white truncate">
                {truncatedCompanyName}
              </div>
              <div className="text-[10px] text-gray-500">
                ERP Management System
              </div>
            </div>
          )}
        </Link>
      </div>

      {/* ========== NAVIGATION ==========
          flex-1 + overflow-y-auto + min-h-0 ensures this scrolls within the
          fixed-height parent instead of forcing the sidebar to grow. */}
      <nav className="flex-1 min-h-0 overflow-y-auto py-4 px-3 space-y-1 sidebar-scroll">
        {navigationItems.map((item) => {
          if (!hasAccess(item.permission)) return null;

          const hasChildren = !!(item.children && item.children.length > 0);
          const parentActive = hasChildren && isParentActive(item);
          const isExactActive = !hasChildren && pathname === item.href;
          const isHighlighted = parentActive || isExactActive;
          const isSubmenuOpen = openSubmenus.includes(item.name);
          const Icon = item.icon;

          return (
            <div key={item.name}>
              {hasChildren ? (
                <>
                  <button
                    onClick={() => toggleSubmenu(item.name)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group',
                      isHighlighted
                        ? 'bg-gradient-to-r from-primary-500/20 to-accent-500/20 text-white border border-primary-500/30'
                        : 'text-gray-400 hover:text-white hover:bg-white/5',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && (
                        <span className="text-sm font-medium truncate">
                          {item.name}
                        </span>
                      )}
                    </div>
                    {!collapsed && (
                      <ChevronDown
                        className={cn(
                          'w-4 h-4 flex-shrink-0 transition-transform duration-200',
                          isSubmenuOpen && 'rotate-180',
                        )}
                      />
                    )}
                  </button>

                  {!collapsed && isSubmenuOpen && (
                    // Tree container: left padding aligns with parent icon center (px-3 + 10px icon-half = ~22px)
                    <div className="relative mt-1 ml-[22px]">
                      {/* Vertical spine — runs full height of the child list */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-px"
                        style={{
                          background:
                            'linear-gradient(to bottom, rgba(99,102,241,0.35) 0%, rgba(99,102,241,0.08) 100%)',
                        }}
                      />

                      <div className="space-y-0.5 pl-4">
                        {item.children?.map((child) => {
                          if (!hasAccess(child.permission)) return null;
                          const active = isChildActive(
                            pathname,
                            child.href,
                            item.href,
                          );
                          const ChildIcon = child.icon;

                          return (
                            <div key={child.name} className="relative">
                              {/* Horizontal tick from spine to item */}
                              <div
                                className="absolute left-[-16px] top-1/2 w-3 h-px -translate-y-1/2"
                                style={{ background: 'rgba(99,102,241,0.35)' }}
                              />
                              {/* Small dot on the spine at this item's level */}
                              <div
                                className={cn(
                                  'absolute left-[-17px] top-1/2 w-[5px] h-[5px] rounded-full -translate-y-1/2 -translate-x-1/2 transition-colors duration-200',
                                  active ? 'bg-primary-400' : 'bg-white/20',
                                )}
                              />

                              <Link
                                href={child.href}
                                onClick={onMobileClose}
                                className={cn(
                                  'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all duration-200',
                                  active
                                    ? 'bg-primary-500/15 text-primary-300 font-medium'
                                    : 'text-gray-500 hover:text-white hover:bg-white/5',
                                )}
                              >
                                <ChildIcon
                                  className={cn(
                                    'w-3.5 h-3.5 flex-shrink-0 transition-colors duration-200',
                                    active
                                      ? 'text-primary-400'
                                      : 'text-gray-600 group-hover:text-gray-400',
                                  )}
                                />
                                <span className="truncate">{child.name}</span>
                              </Link>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href}
                  onClick={onMobileClose}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                    isExactActive
                      ? 'bg-gradient-to-r from-primary-500/20 to-accent-500/20 text-white border border-primary-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5',
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <span className="text-sm font-medium truncate">
                      {item.name}
                    </span>
                  )}
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* ========== USER PROFILE ==========
          No border-t — nav scroll area provides visual rhythm naturally */}
      <div className="flex-shrink-0 p-3">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="w-full flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all hover:bg-white/5 group">
              {/* User avatar – ring added for visibility */}
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-md flex-shrink-0 overflow-hidden ring-2 ring-white/20">
                {user?.avatar && !avatarError ? (
                  <Image
                    src={user.avatar}
                    alt={displayName}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                    onError={() => setAvatarError(true)}
                    unoptimized
                  />
                ) : (
                  <span className="text-sm font-bold text-white">
                    {userInitial}
                  </span>
                )}
              </div>
              {!collapsed && (
                <>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-sm font-semibold text-white truncate">
                      {displayName}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      {formatRole(userRole)}
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-white transition-colors flex-shrink-0" />
                </>
              )}
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="min-w-[240px] bg-surface/98 backdrop-blur-xl rounded-xl py-2 shadow-2xl border border-border-subtle z-[100]"
              sideOffset={8}
              align={collapsed ? 'end' : 'start'}
              side={collapsed ? 'right' : 'top'}
            >
              {/* User Info Header – larger avatar with ring */}
              <div className="px-4 py-3 border-b border-border-subtle mb-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center flex-shrink-0 overflow-hidden ring-2 ring-white/20">
                    {user?.avatar && !avatarError ? (
                      <Image
                        src={user.avatar}
                        alt={displayName}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                        onError={() => setAvatarError(true)}
                        unoptimized
                      />
                    ) : (
                      <span className="text-sm font-bold text-white">
                        {userInitial}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">
                      {displayName}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      {user?.email}
                    </div>
                  </div>
                </div>
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-primary-500/20 text-primary-400">
                    {formatRole(userRole)}
                  </span>
                </div>
              </div>

              {/* Menu Items */}
              <DropdownMenu.Item
                className="px-4 py-2.5 text-sm cursor-pointer outline-none flex items-center gap-3 text-gray-300 hover:text-white hover:bg-white/5 transition-colors mx-1 rounded-lg"
                onSelect={() => {
                  onMobileClose();
                  router.push('/settings');
                }}
              >
                <Settings className="w-4 h-4 text-gray-400" />
                <span>Settings</span>
              </DropdownMenu.Item>

              <DropdownMenu.Item
                className="px-4 py-2.5 text-sm cursor-pointer outline-none flex items-center gap-3 text-gray-300 hover:text-white hover:bg-white/5 transition-colors mx-1 rounded-lg"
                onSelect={() => {
                  onMobileClose();
                  router.push('/settings/profile');
                }}
              >
                <User className="w-4 h-4 text-gray-400" />
                <span>Profile</span>
              </DropdownMenu.Item>

              <DropdownMenu.Item
                className="px-4 py-2.5 text-sm cursor-pointer outline-none flex items-center gap-3 text-gray-300 hover:text-white hover:bg-white/5 transition-colors mx-1 rounded-lg"
                onSelect={() => {
                  onMobileClose();
                  router.push('/settings/notifications');
                }}
              >
                <Bell className="w-4 h-4 text-gray-400" />
                <span>Notifications</span>
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="h-px my-1 mx-2 bg-border-subtle" />

              <DropdownMenu.Item
                className="px-4 py-2.5 text-sm cursor-pointer outline-none flex items-center gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors mx-1 rounded-lg"
                onSelect={handleLogout}
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </DropdownMenu.Item>

              <DropdownMenu.Arrow className="fill-surface" />
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </div>
  );

  // ============================================
  // RENDER
  // ============================================

  return (
    <>
      {/* Desktop Sidebar — explicit SHELL_BG (#0D1829) to match the header.
          h-full so it fills the parent flex column's height (set by the
          h-screen wrapper in DashboardLayout), which lets the inner <nav>'s
          overflow-y-auto actually have something to overflow against.
          No border-r: the darker PAGE_BG on <main> + borderTopLeftRadius creates
          the Kimchi-style concave notch without any visible dividing line. */}
      <aside
        className={cn(
          'hidden lg:flex flex-col h-full transition-all duration-300 z-30',
          collapsed ? 'w-20' : 'w-64',
        )}
        style={{ background: '#0D1829' }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar — keeps its own bg since it floats above PAGE_BG.
          inset-y-0 already pins top/bottom; h-full reinforces it for the
          inner flex column to size correctly. */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 h-full bg-surface/98 backdrop-blur-xl transform transition-transform duration-300 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}
    </>
  );
}

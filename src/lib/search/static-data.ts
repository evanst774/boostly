// src/lib/search/static-data.ts
import { ROUTES } from '@/lib/routes';
import type { SearchResultItem } from './types';

export const QUICK_ACTIONS: SearchResultItem[] = [
  {
    id: 'action-new-sale',
    type: 'action',
    title: 'New Sale',
    subtitle: 'Record a new sale',
    href: ROUTES.SALES.NEW(),
    icon: 'Plus',
  },
  {
    id: 'action-new-customer',
    type: 'action',
    title: 'New Customer',
    subtitle: 'Register a customer',
    href: ROUTES.CUSTOMERS.NEW,
    icon: 'UserPlus',
  },
  {
    id: 'action-add-bike',
    type: 'action',
    title: 'Add Bike',
    subtitle: 'Add a bike to inventory',
    href: ROUTES.INVENTORY.ADD,
    icon: 'Bike',
  },
  {
    id: 'action-record-payment',
    type: 'action',
    title: 'Record Payment',
    subtitle: 'Log a customer payment',
    href: ROUTES.FINANCE.PAYMENTS,
    icon: 'Wallet',
  },
];

export const STATIC_PAGES: SearchResultItem[] = [
  {
    id: 'page-dashboard',
    type: 'page',
    title: 'Dashboard',
    subtitle: 'Overview & KPIs',
    href: ROUTES.DASHBOARD,
    icon: 'LayoutDashboard',
  },
  {
    id: 'page-customers',
    type: 'page',
    title: 'Customers',
    subtitle: 'Customer directory',
    href: ROUTES.CUSTOMERS.LIST,
    icon: 'Users',
  },
  {
    id: 'page-debtors',
    type: 'page',
    title: 'Debtors',
    subtitle: 'Customers with outstanding balances',
    href: ROUTES.CUSTOMERS.DEBTORS,
    icon: 'AlertCircle',
  },
  {
    id: 'page-inventory',
    type: 'page',
    title: 'Inventory',
    subtitle: 'Bike stock',
    href: ROUTES.INVENTORY.LIST,
    icon: 'Bike',
  },
  {
    id: 'page-categories',
    type: 'page',
    title: 'Categories',
    subtitle: 'Bike categories',
    href: ROUTES.INVENTORY.CATEGORIES,
    icon: 'Tag',
  },
  {
    id: 'page-suppliers',
    type: 'page',
    title: 'Suppliers',
    subtitle: 'Bike suppliers',
    href: ROUTES.INVENTORY.SUPPLIERS,
    icon: 'Truck',
  },
  {
    id: 'page-sales-history',
    type: 'page',
    title: 'Sales History',
    subtitle: 'All sales records',
    href: ROUTES.SALES.HISTORY,
    icon: 'Receipt',
  },
  {
    id: 'page-invoices',
    type: 'page',
    title: 'Invoices',
    subtitle: 'Generated invoices',
    href: ROUTES.SALES.INVOICES_LIST,
    icon: 'FileText',
  },
  {
    id: 'page-payments',
    type: 'page',
    title: 'Payments',
    subtitle: 'Recorded payments',
    href: ROUTES.FINANCE.PAYMENTS,
    icon: 'Wallet',
  },
  {
    id: 'page-installments',
    type: 'page',
    title: 'Installments',
    subtitle: 'Installment plans',
    href: ROUTES.FINANCE.INSTALLMENTS,
    icon: 'CalendarClock',
  },
  {
    id: 'page-debts',
    type: 'page',
    title: 'Debts',
    subtitle: 'Outstanding debt',
    href: ROUTES.FINANCE.DEBTS,
    icon: 'TrendingDown',
  },
  {
    id: 'page-contracts',
    type: 'page',
    title: 'Contracts',
    subtitle: 'Contract library',
    href: ROUTES.CONTRACTS.LIBRARY,
    icon: 'FileSignature',
  },
  {
    id: 'page-reports-sales',
    type: 'page',
    title: 'Sales Reports',
    subtitle: 'Sales analytics',
    href: ROUTES.REPORTS.SALES,
    icon: 'BarChart3',
  },
  {
    id: 'page-reports-finance',
    type: 'page',
    title: 'Finance Reports',
    subtitle: 'Finance analytics',
    href: ROUTES.REPORTS.FINANCE,
    icon: 'LineChart',
  },
  {
    id: 'page-reports-inventory',
    type: 'page',
    title: 'Inventory Reports',
    subtitle: 'Inventory analytics',
    href: ROUTES.REPORTS.INVENTORY,
    icon: 'PieChart',
  },
  {
    id: 'page-admin-users',
    type: 'page',
    title: 'Users',
    subtitle: 'Manage system users',
    href: ROUTES.ADMIN.USERS,
    icon: 'UserCog',
  },
  {
    id: 'page-admin-roles',
    type: 'page',
    title: 'Roles & Permissions',
    subtitle: 'Manage roles',
    href: ROUTES.ADMIN.ROLES,
    icon: 'ShieldCheck',
  },
  {
    id: 'page-admin-audit',
    type: 'page',
    title: 'Audit Logs',
    subtitle: 'System activity log',
    href: ROUTES.ADMIN.AUDIT_LOGS,
    icon: 'History',
  },
  {
    id: 'page-settings-profile',
    type: 'page',
    title: 'Profile Settings',
    subtitle: 'Your profile',
    href: ROUTES.SETTINGS.PROFILE,
    icon: 'User',
  },
  {
    id: 'page-settings-security',
    type: 'page',
    title: 'Security Settings',
    subtitle: '2FA & sudo mode',
    href: ROUTES.SETTINGS.SECURITY,
    icon: 'Shield',
  },
];

export function searchStaticItems(query: string): SearchResultItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return [...QUICK_ACTIONS, ...STATIC_PAGES].filter((item) => {
    return (
      item.title.toLowerCase().includes(q) ||
      (item.subtitle ? item.subtitle.toLowerCase().includes(q) : false)
    );
  });
}

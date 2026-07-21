// src/lib/routes.ts

/**
 * Centralized route definitions for the MotoTrack ERP application.
 * Use these constants instead of hardcoded strings throughout the app.
 */

export const ROUTES = {
  // Public pages
  HOME: '/',
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY: '/verify',
  TWO_FACTOR: '/2fa',
  PRIVACY: '/privacy',
  TERMS: '/terms',
  UNAUTHORIZED: '/unauthorized',
  FORBIDDEN: '/forbidden',

  // Dashboard
  DASHBOARD: '/dashboard',
  ACCOUNT_LOCKED: '/account-locked',
  // Finance
  FINANCE: {
    PAYMENTS: '/finance/payments',
    INSTALLMENTS: '/finance/installments',
    DEBTS: '/finance/debts',
  },

  // Customers
  CUSTOMERS: {
    LIST: '/customers',
    DETAIL: (id: string) => `/customers/${id}`,
    EDIT: (id: string) => `/customers/${id}/edit`,
    NEW: '/customers/new',
    DEBTORS: '/customers/debtors',
  },

  // Inventory / Bikes
  INVENTORY: {
    LIST: '/inventory',
    ADD: '/inventory/add',
    DETAIL: (id: string) => `/inventory/${id}`,
    EDIT: (id: string) => `/inventory/${id}/edit`,
    CATEGORIES: '/inventory/categories',
    SUPPLIERS: '/inventory/suppliers',
  },

  // Sales
  SALES: {
    NEW: (customerId?: string) =>
      customerId ? `/sales/new?customerId=${customerId}` : '/sales/new',
    HISTORY: '/sales/history',
    EDIT: (id: string) => `/sales/${id}/edit`,
    DETAIL: (id: string) => `/sales/${id}`,
    IMPORT: '/sales/import',
    INVOICE: (id: string) => `/sales/${id}/invoice`,
    PAYMENT: (id: string) => `/sales/${id}/payment`,
    INVOICES_LIST: '/sales/invoices',
  },

  // Contracts
  CONTRACTS: {
    LIBRARY: '/contracts',
    UPLOAD: '/contracts/upload',
  },

  // Reports
  REPORTS: {
    LIST: '/reports',
    SALES: '/reports/sales',
    FINANCE: '/reports/finance',
    INVENTORY: '/reports/inventory',
  },

  // Admin
  ADMIN: {
    USERS: '/admin/users',
    ROLES: '/admin/roles',
    AUDIT_LOGS: '/admin/audit-logs',
  },

  // Settings
  SETTINGS: {
    HOME: '/settings',
    PROFILE: '/settings/profile',
    NOTIFICATIONS: '/settings/notifications',
    SECURITY: '/settings/security',
  },

  ACCOUNT: {
    HOME: '/account',
  },

  // API Routes
  API: {
    AUTH: {
      LOGIN: '/api/auth/login',
      LOGOUT: '/api/auth/logout',
      ME: '/api/auth/me',
      SESSION: '/api/auth/session',
      PERMISSIONS: '/api/auth/permissions',
      FORGOT_PASSWORD: '/api/auth/forgot-password',
      RESET_PASSWORD: '/api/auth/reset-password',
      VALIDATE_RESET_TOKEN: '/api/auth/validate-reset-token',
      VERIFY_EMAIL_REQUEST: '/api/auth/verify-email/request',
      VERIFY_EMAIL_CONFIRM: '/api/auth/verify-email/confirm',
      TWO_FACTOR_SETUP: '/api/auth/2fa/setup',
      TWO_FACTOR_VERIFY: '/api/auth/2fa/verify',
      TWO_FACTOR_RESEND: '/api/auth/2fa/resend',
      CHECK: '/api/auth/check',
      DEBUG_COOKIE: '/api/auth/debug-cookie',
      RESEND_2FA: '/api/auth/resend-2fa',
    },
    CUSTOMERS: {
      BASE: '/api/customers',
      DETAIL: (id: string) => `/api/customers/${id}`,
      STATS: '/api/customers/stats',
      DEBTORS: '/api/customers/debtors',
      DEBTORS_STATS: '/api/customers/debtors/stats',
    },
    BIKES: {
      BASE: '/api/bikes',
      DETAIL: (id: string) => `/api/bikes/${id}`,
      STATS: '/api/bikes/stats',
      EXPORT: '/api/bikes/export',
      CATEGORIES: {
        BASE: '/api/bikes/categories',
        DETAIL: (id: string) => `/api/bikes/categories/${id}`,
        STATS: '/api/bikes/categories/stats',
      },
      SUPPLIERS: {
        BASE: '/api/bikes/suppliers',
        STATS: '/api/bikes/suppliers/stats',
      },
    },
    SALES: {
      BASE: '/api/sales',
      DETAIL: (id: string) => `/api/sales/${id}`,
      CANCEL: (id: string) => `/api/sales/${id}/cancel`,
      CONTRACT: (id: string) => `/api/sales/${id}/contract`,
      PAYMENT: (id: string) => `/api/sales/${id}/payments`,
      STATS: '/api/sales/stats',
      PENDING: '/api/sales/pending',
    },
    INVOICES: {
      BASE: '/api/invoices',
      STATS: '/api/invoices/stats',
    },
    REPORTS: {
      DASHBOARD: '/api/reports/dashboard',
      TOP_BIKES: '/api/reports/top-bikes',
    },
    FINANCE: {
      PAYMENTS: '/api/finance/payments',
      PAYMENTS_STATS: '/api/finance/payments/stats',
      INSTALLMENTS: '/api/finance/installments',
      INSTALLMENTS_STATS: '/api/finance/installments/stats',
      INSTALLMENTS_UPCOMING: '/api/finance/installments/upcoming',
      DEBTS: '/api/finance/debts',
      DEBTS_STATS: '/api/finance/debts/stats',
      REMINDERS: '/api/finance/reminders',
    },
    UPLOAD: '/api/upload',
    AUDIT: {
      RECENT: '/api/audit/recent',
    },
    COMMUNICATIONS: {
      EMAIL: '/api/communications/email',
      SEND: '/api/communications/send',
    },
  },
} as const;

// Type for all route values
export type RoutePath = string | ((...args: string[]) => string);

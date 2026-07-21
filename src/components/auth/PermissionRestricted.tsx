// components/auth/PermissionRestricted.tsx
'use client';

import { Shield, ArrowLeft, Home, Info } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionRestrictedProps {
  feature: string;
  requiredPermission?: string;
  requiredRole?: string;
  action?: string;
  backLink?: string;
  backText?: string;
  showAlternativeActions?: boolean;
}

export function PermissionRestricted({
  feature,
  requiredPermission,
  requiredRole,
  action = 'view',
  backLink,
  backText = 'Go Back',
  showAlternativeActions = true,
}: PermissionRestrictedProps) {
  const router = useRouter();
  const { hasPermission } = usePermissions();

  // Check what the user DOES have access to
  const hasCustomerAccess = hasPermission('customers.read');
  const hasSalesAccess = hasPermission('sales.read');
  const hasInventoryAccess = hasPermission('inventory.read');
  const hasDashboardAccess = hasPermission('dashboard.read');
  const hasFinanceAccess = hasPermission('finance.read');
  const hasPaymentsAccess = hasPermission('payments.read');
  const hasReportsAccess = hasPermission('reports.read');

  // Map technical permissions to user-friendly descriptions
  const permissionDescriptions: Record<string, string> = {
    // Finance
    'finance.read': 'access the finance section',
    'finance.manage': 'manage financial operations',
    'finance.reports': 'generate financial reports',
    // Payments
    'payments.read': 'view payment history',
    'payments.create': 'record customer payments',
    'payments.delete': 'delete payment records',
    // Debts
    'debts.read': 'track customer debts and outstanding payments',
    'debts.manage': 'manage debt collection and write-offs',
    // Sales
    'sales.read': 'view sales history',
    'sales.create': 'create new sales',
    'sales.update': 'edit existing sales',
    'sales.delete': 'delete sales records',
    'sales.cancel': 'cancel active sales',
    'sales.finance': 'view sale prices and financial details',
    // Customers
    'customers.read': 'view customer records',
    'customers.create': 'register new customers',
    'customers.update': 'edit customer information',
    'customers.delete': 'delete customer records',
    // Inventory
    'inventory.read': 'view bike inventory',
    'inventory.create': 'add new bikes',
    'inventory.update': 'edit bike information',
    'inventory.delete': 'remove bikes from inventory',
    'inventory.manage': 'fully manage bike inventory',
    // Contracts
    'contracts.read': 'view and download contracts',
    'contracts.upload': 'upload contract documents',
    'contracts.delete': 'delete contract documents',
    // Reports
    'reports.read': 'access the reports section',
    'reports.export': 'export reports to PDF/Excel',
    'reports.sales': 'view sales analytics',
    'reports.finance': 'view financial analytics',
    'reports.inventory': 'view inventory analytics',
    // Admin
    'users.manage': 'manage system users',
    'roles.manage': 'manage user roles',
    'permissions.manage': 'modify permission settings',
    'audit.read': 'view system audit logs',
    'audit.export': 'export system audit logs',
    'system.config': 'configure system settings',
    // Dashboard
    'dashboard.read': 'view the main dashboard',
  };

  // Map technical roles to user-friendly names
  const roleDescriptions: Record<string, string> = {
    SUPER_ADMIN: 'System Administrator',
    MANAGER: 'Operations Manager',
    ACCOUNTANT: 'Finance Accountant',
    SALES_PERSON: 'Sales Representative',
  };

  // Build context-aware suggestions per permission
  const suggestionMap: Partial<Record<string, string>> = {
    'payments.read': hasSalesAccess
      ? 'You can process sales, but viewing payment history requires finance access.'
      : hasCustomerAccess
        ? 'You can manage customers, but payment records require additional finance permissions.'
        : '',

    'payments.create': hasPaymentsAccess
      ? 'You can view payments, but recording new ones requires additional permissions.'
      : hasSalesAccess
        ? 'You can process sales, but recording payments requires finance access.'
        : '',

    'finance.read': hasSalesAccess
      ? 'You can process sales, but the finance section requires accountant or manager access.'
      : hasCustomerAccess
        ? 'You can manage customers, but financial data requires additional permissions.'
        : '',

    'debts.read': hasCustomerAccess
      ? 'You can manage customer records, but debt tracking requires additional financial permissions.'
      : hasSalesAccess
        ? 'You can process sales, but viewing debt information requires accountant or manager access.'
        : hasInventoryAccess
          ? 'You can manage inventory, but debt tracking requires finance team access.'
          : '',

    'debts.manage': hasFinanceAccess
      ? 'You can view financial data, but managing debts requires accountant-level access.'
      : '',

    'reports.finance': hasReportsAccess
      ? 'You can access reports, but financial analytics require finance permissions.'
      : hasFinanceAccess
        ? 'You have finance access, but generating financial reports requires additional permissions.'
        : '',

    'reports.sales': hasReportsAccess
      ? 'You can access reports, but sales analytics require additional permissions.'
      : hasSalesAccess
        ? 'You can view sales, but generating sales reports requires additional permissions.'
        : '',

    'inventory.manage': hasInventoryAccess
      ? 'You can view inventory, but full management requires elevated permissions.'
      : '',

    'users.manage': hasDashboardAccess
      ? 'You can access the dashboard, but user management requires administrator access.'
      : '',

    'system.config': hasDashboardAccess
      ? 'System configuration is restricted to administrators only.'
      : '',
  };

  const suggestion = requiredPermission
    ? (suggestionMap[requiredPermission] ?? '')
    : '';

  const friendlyPermission = requiredPermission
    ? permissionDescriptions[requiredPermission] ||
      requiredPermission.replace('.', ' ').toLowerCase()
    : null;

  const friendlyRole = requiredRole
    ? roleDescriptions[requiredRole] || requiredRole
    : null;

  const handleBack = () => {
    if (backLink) {
      router.push(backLink);
    } else {
      router.back();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-blue-400" />
        </div>

        <h3 className="text-lg font-semibold text-white mb-2">
          {requiredRole
            ? `${friendlyRole || requiredRole} Access Required`
            : 'Access Restricted'}
        </h3>

        <p className="text-gray-400 text-sm">
          To {action} {feature.toLowerCase()}, you need{' '}
          {friendlyRole ? `${friendlyRole} ` : ''}
          {friendlyPermission && (
            <span className="text-amber-400 font-medium">
              {friendlyPermission}
            </span>
          )}{' '}
          permissions.
        </p>

        {suggestion && (
          <div className="mt-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-left">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-300">{suggestion}</p>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-500 mt-3">
          Need access? Contact your system administrator to request the
          appropriate permissions.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-colors touch-manipulation"
          >
            <ArrowLeft className="w-4 h-4" />
            {backText}
          </button>

          {showAlternativeActions && hasDashboardAccess && (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors touch-manipulation"
            >
              <Home className="w-4 h-4" />
              Go to Dashboard
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
